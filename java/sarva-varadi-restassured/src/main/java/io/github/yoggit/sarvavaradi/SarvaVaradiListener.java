package io.github.yoggit.sarvavaradi;

import org.testng.*;
import com.google.gson.Gson;
import java.io.*;
import java.util.*;

/**
 * Sarva-Varadi TestNG listener for RestAssured API tests.
 *
 * Add to testng.xml:
 *   <listener class-name="io.github.yoggit.sarvavaradi.SarvaVaradiListener"/>
 */
public class SarvaVaradiListener implements ITestListener {

    private final List<Map<String, Object>> allAttempts = new ArrayList<>();
    private final Map<String, TestAttemptTracker> testTrackers = new HashMap<>();
    private final Gson gson = new Gson();

    private static class TestAttemptTracker {
        List<String> statuses = new ArrayList<>();
        Map<String, Object> latestResult = null;
        int retryCount = 0;
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        captureResult(result, "PASS");
    }

    @Override
    public void onTestFailure(ITestResult result) {
        captureResult(result, "FAIL");
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        captureResult(result, "SKIP");
    }

    private void captureResult(ITestResult result, String status) {
        String testFullName = result.getTestClass().getName() + "." + result.getMethod().getMethodName();

        testTrackers.putIfAbsent(testFullName, new TestAttemptTracker());
        TestAttemptTracker tracker = testTrackers.get(testFullName);

        tracker.statuses.add(status);
        tracker.retryCount = tracker.statuses.size() - 1;

        Map<String, Object> testData = new HashMap<>();
        testData.put("testName", testFullName);
        testData.put("methodName", result.getMethod().getMethodName());
        testData.put("status", status);
        testData.put("startTime", result.getStartMillis());
        testData.put("endTime", result.getEndMillis());
        testData.put("retryCount", tracker.retryCount);

        if (result.getThrowable() != null) {
            Map<String, String> error = new HashMap<>();
            error.put("message", result.getThrowable().getMessage());
            error.put("stackTrace", getStackTrace(result.getThrowable()));
            testData.put("error", error);
        }

        Object[] parameters = result.getParameters();
        if (parameters != null && parameters.length > 0) {
            Map<String, Object> params = new HashMap<>();
            for (int i = 0; i < parameters.length; i++) {
                params.put("param" + i, parameters[i]);
            }
            testData.put("parameters", params);
        }

        List<Map<String, Object>> apiCalls = RestAssuredRequestCapture.getApiCalls();
        if (!apiCalls.isEmpty()) {
            testData.put("apiCalls", apiCalls);
            RestAssuredRequestCapture.saveApiCalls(testFullName + "-attempt" + tracker.retryCount);
            RestAssuredRequestCapture.clearApiCalls();
        }

        allAttempts.add(testData);
        tracker.latestResult = testData;
    }

    @Override
    public void onFinish(ITestContext context) {
        try {
            List<Map<String, Object>> finalResults = buildFinalResults();

            File outputDir = new File(SarvaVaradiConfig.getOutputDir());
            outputDir.mkdirs();

            File outputFile = new File(outputDir, "test-results.json");
            try (FileWriter writer = new FileWriter(outputFile)) {
                writer.write(gson.toJson(finalResults));
            }

            System.out.println("✅ Sarva-Varadi results: " + outputFile.getAbsolutePath());

            System.out.println("📊 Total tests: " + finalResults.size());
            printSummary(finalResults);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private List<Map<String, Object>> buildFinalResults() {
        List<Map<String, Object>> finalResults = new ArrayList<>();

        for (Map.Entry<String, TestAttemptTracker> entry : testTrackers.entrySet()) {
            TestAttemptTracker tracker = entry.getValue();
            Map<String, Object> finalResult = tracker.latestResult;
            if (finalResult == null) continue;

            if (tracker.retryCount > 0 && "PASS".equals(finalResult.get("status"))) {
                finalResult.put("status", "FLAKY");
                finalResult.put("flakyReason", "Test passed after " + tracker.retryCount + " retry attempt(s)");
                System.out.println("⚠️  Flaky test detected: " + entry.getKey());
            }

            finalResults.add(finalResult);
        }

        return finalResults;
    }

    private void printSummary(List<Map<String, Object>> results) {
        long passed  = results.stream().filter(r -> "PASS".equals(r.get("status"))).count();
        long failed  = results.stream().filter(r -> "FAIL".equals(r.get("status"))).count();
        long skipped = results.stream().filter(r -> "SKIP".equals(r.get("status"))).count();
        long flaky   = results.stream().filter(r -> "FLAKY".equals(r.get("status"))).count();
        System.out.println("📈 Summary: " + passed + " passed, " + failed + " failed, " +
                           skipped + " skipped, " + flaky + " flaky");
    }

    private String getStackTrace(Throwable t) {
        StringWriter sw = new StringWriter();
        t.printStackTrace(new PrintWriter(sw));
        return sw.toString();
    }
}
