import org.testng.*;
import com.google.gson.Gson;
import java.io.*;
import java.util.*;

public class SarvaVaradiListener implements ITestListener {
    private List<Map<String, Object>> allAttempts = new ArrayList<>(); // Stores ALL attempts (including retries)
    private Gson gson = new Gson();

    // Track test state for flaky detection
    private Map<String, TestAttemptTracker> testTrackers = new HashMap<>();

    // Helper class to track test attempts
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

        // Get or create tracker for this test
        testTrackers.putIfAbsent(testFullName, new TestAttemptTracker());
        TestAttemptTracker tracker = testTrackers.get(testFullName);

        // Track attempt
        tracker.statuses.add(status);
        tracker.retryCount = tracker.statuses.size() - 1; // 0 for first attempt, 1+ for retries

        // Build test data
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

        // Capture test parameters if any
        Object[] parameters = result.getParameters();
        if (parameters != null && parameters.length > 0) {
            Map<String, Object> params = new HashMap<>();
            for (int i = 0; i < parameters.length; i++) {
                params.put("param" + i, parameters[i]);
            }
            testData.put("parameters", params);
        }

        // Capture API calls made during the test
        List<Map<String, Object>> apiCalls = RestAssuredRequestCapture.getApiCalls();
        if (!apiCalls.isEmpty()) {
            testData.put("apiCalls", apiCalls);
            // Save to separate file for detailed view
            RestAssuredRequestCapture.saveApiCalls(testFullName + "-attempt" + tracker.retryCount);
            // Clear for next attempt
            RestAssuredRequestCapture.clearApiCalls();
        }

        // Store this attempt
        allAttempts.add(testData);

        // Always update latest result (will be the final one when test completes)
        tracker.latestResult = testData;
    }

    @Override
    public void onFinish(ITestContext context) {
        try {
            // Build final results list (one entry per test, with flaky detection)
            List<Map<String, Object>> finalResults = buildFinalResults();

            File outputDir = new File("sarva-varadi-results");
            outputDir.mkdirs();

            File outputFile = new File(outputDir, "test-results.json");
            FileWriter writer = new FileWriter(outputFile);
            writer.write(gson.toJson(finalResults));
            writer.close();

            System.out.println("✅ Sarva-Varadi results: " + outputFile.getAbsolutePath());
            System.out.println("📊 Total tests: " + finalResults.size());
            printSummary(finalResults);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * Build final results list - one entry per test (like Playwright does)
     * Mark as FLAKY if retry > 0 && status == PASS
     */
    private List<Map<String, Object>> buildFinalResults() {
        List<Map<String, Object>> finalResults = new ArrayList<>();

        for (Map.Entry<String, TestAttemptTracker> entry : testTrackers.entrySet()) {
            String testName = entry.getKey();
            TestAttemptTracker tracker = entry.getValue();

            Map<String, Object> finalResult = tracker.latestResult;
            if (finalResult == null) continue;

            // Apply flaky detection: retry > 0 && final status == PASS
            int retryCount = tracker.retryCount;
            String finalStatus = (String) finalResult.get("status");

            if (retryCount > 0 && "PASS".equals(finalStatus)) {
                finalResult.put("status", "FLAKY");
                finalResult.put("flakyReason", "Test passed after " + retryCount + " retry attempt(s)");
                System.out.println("⚠️  Flaky test detected: " + testName + " (passed after " + retryCount + " retries)");
            }

            finalResults.add(finalResult);
        }

        return finalResults;
    }

    /**
     * Print summary of test run
     */
    private void printSummary(List<Map<String, Object>> finalResults) {
        long passedCount = finalResults.stream().filter(r -> "PASS".equals(r.get("status"))).count();
        long failedCount = finalResults.stream().filter(r -> "FAIL".equals(r.get("status"))).count();
        long skippedCount = finalResults.stream().filter(r -> "SKIP".equals(r.get("status"))).count();
        long flakyCount = finalResults.stream().filter(r -> "FLAKY".equals(r.get("status"))).count();

        System.out.println("📈 Summary: " + passedCount + " passed, " + failedCount + " failed, " +
                         skippedCount + " skipped, " + flakyCount + " flaky");
    }

    private String getStackTrace(Throwable throwable) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        throwable.printStackTrace(pw);
        return sw.toString();
    }
}
