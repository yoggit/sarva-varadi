package io.github.yoggit.sarvavaradi;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.openqa.selenium.WebDriver;
import org.testng.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sarva-Varadi TestNG listener for Selenium tests.
 *
 * Add to testng.xml:
 *   <listener class-name="io.github.yoggit.sarvavaradi.SarvaVaradiSeleniumListener"/>
 */
public class SarvaVaradiSeleniumListener implements ITestListener {

    private static final String OUTPUT_FILE = "test-results.json";
    private final String outputDir = SarvaVaradiConfig.getOutputDir();

    // Keyed by testId — PUT overwrites so retried tests produce one final record
    private final Map<String, Map<String, Object>> resultsByTest = new ConcurrentHashMap<>();
    private final Map<String, TestAttemptTracker> attemptTrackers = new ConcurrentHashMap<>();

    @Override
    public void onStart(ITestContext context) {
        System.out.println("\n🎯 Sarva-Varadi: Starting Selenium test run — " +
                           context.getAllTestMethods().length + " tests");
        try {
            Files.createDirectories(Paths.get(outputDir));
        } catch (IOException e) {
            System.err.println("Sarva-Varadi: Failed to create output directory: " + e.getMessage());
        }
    }

    @Override
    public void onTestStart(ITestResult result) {
        String testId = testId(result);
        attemptTrackers.putIfAbsent(testId, new TestAttemptTracker());
        attemptTrackers.get(testId).recordAttemptStart();
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        captureEndScreenshot(result, "passed");
        recordResult(result, "PASS");
    }

    @Override
    public void onTestFailure(ITestResult result) {
        captureEndScreenshot(result, "failed");
        recordResult(result, "FAIL");
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        recordResult(result, "SKIP");
    }

    @Override
    public void onFinish(ITestContext context) {
        List<Map<String, Object>> testResults = new ArrayList<>(resultsByTest.values());
        markFlakyTests(testResults);
        writeResultsToJson(testResults);
        System.out.println("\n✅ Sarva-Varadi: Results saved to " + outputDir + "/" + OUTPUT_FILE);
    }

    private void recordResult(ITestResult result, String status) {
        String testId = testId(result);
        TestAttemptTracker tracker = attemptTrackers.get(testId);
        if (tracker == null) return;

        tracker.recordAttemptEnd(status);

        Map<String, Object> data = new HashMap<>();
        data.put("testName", result.getTestClass().getName() + "." + result.getName());
        data.put("methodName", result.getName());
        data.put("status", status);
        data.put("startTime", result.getStartMillis());
        data.put("endTime", result.getEndMillis());
        data.put("duration", result.getEndMillis() - result.getStartMillis());
        data.put("retryCount", tracker.getRetryCount());
        data.put("browser", browserInfo(result));

        if (result.getThrowable() != null) {
            Map<String, String> error = new HashMap<>();
            error.put("message", result.getThrowable().getMessage());
            error.put("stackTrace", stackTrace(result.getThrowable()));
            data.put("error", error);
        }

        if (result.getParameters().length > 0) {
            data.put("parameters", Arrays.asList(result.getParameters()));
        }

        SarvaVaradiWebDriverListener wdListener = extractWebDriverListener(result.getInstance());
        if (wdListener != null) {
            List<Map<String, Object>> actions = wdListener.getActions();
            if (!actions.isEmpty()) {
                data.put("actions", actions);
            }
            wdListener.clearActions();
        }

        // PUT overwrites any previous attempt — final call wins
        resultsByTest.put(testId, data);
    }

    private void markFlakyTests(List<Map<String, Object>> testResults) {
        for (Map<String, Object> test : testResults) {
            String testName = (String) test.get("testName");
            TestAttemptTracker tracker = attemptTrackers.get(testName);
            if (tracker != null && tracker.isFlaky()) {
                test.put("status", "FLAKY");
                test.put("flakyReason", "Test passed after " + tracker.getRetryCount() + " retry attempt(s)");
                System.out.println("⚠️  Flaky test detected: " + testName);
            }
        }
    }

    private void writeResultsToJson(List<Map<String, Object>> testResults) {
        try {
            ObjectMapper mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
            mapper.writeValue(new File(outputDir, OUTPUT_FILE), testResults);
            System.out.println("📊 Total tests: " + testResults.size());
        } catch (IOException e) {
            System.err.println("Sarva-Varadi: Failed to write results: " + e.getMessage());
        }
    }

    private String testId(ITestResult result) {
        return result.getTestClass().getName() + "." + result.getName();
    }

    private Map<String, String> browserInfo(ITestResult result) {
        Map<String, String> info = new HashMap<>();
        try {
            Object instance = result.getInstance();
            WebDriver driver = extractDriver(instance);
            if (driver != null) {
                info.put("name", driver.getClass().getSimpleName().replace("Driver", ""));
            } else {
                info.put("name", "Unknown");
            }
        } catch (Exception e) {
            info.put("name", "Unknown");
        }
        info.put("platform", System.getProperty("os.name"));
        return info;
    }

    private WebDriver extractDriver(Object instance) {
        if (instance == null) return null;
        try {
            var field = instance.getClass().getDeclaredField("driver");
            field.setAccessible(true);
            Object val = field.get(instance);
            if (val instanceof WebDriver) return (WebDriver) val;
        } catch (Exception ignored) {}
        return null;
    }

    private SarvaVaradiWebDriverListener extractWebDriverListener(Object instance) {
        // Thread-local registry: works regardless of driver factory pattern
        SarvaVaradiWebDriverListener fromContext = SarvaVaradiContext.getListener();
        if (fromContext != null) return fromContext;

        // Fallback: search instance and superclass fields (simple per-test pattern)
        if (instance == null) return null;
        try {
            Class<?> clazz = instance.getClass();
            while (clazz != null && clazz != Object.class) {
                for (java.lang.reflect.Field field : clazz.getDeclaredFields()) {
                    if (SarvaVaradiWebDriverListener.class.isAssignableFrom(field.getType())) {
                        field.setAccessible(true);
                        Object val = java.lang.reflect.Modifier.isStatic(field.getModifiers())
                            ? field.get(null)
                            : field.get(instance);
                        if (val instanceof SarvaVaradiWebDriverListener) {
                            return (SarvaVaradiWebDriverListener) val;
                        }
                    }
                }
                clazz = clazz.getSuperclass();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private void captureEndScreenshot(ITestResult result, String status) {
        SarvaVaradiWebDriverListener wdListener = extractWebDriverListener(result.getInstance());
        if (wdListener != null) {
            wdListener.captureTestEndScreenshot(testId(result), status);
        }
    }

    private String stackTrace(Throwable t) {
        StringBuilder sb = new StringBuilder();
        for (StackTraceElement e : t.getStackTrace()) {
            sb.append(e).append("\n");
            if (sb.length() > 2000) break;
        }
        return sb.toString();
    }

    private static class TestAttemptTracker {
        private int startCount = 0;
        private String finalStatus = null;

        void recordAttemptStart() { startCount++; }
        void recordAttemptEnd(String status) { finalStatus = status; }

        // Flaky = retried at least once AND ultimately passed
        boolean isFlaky() { return startCount > 1 && "PASS".equals(finalStatus); }
        int getRetryCount() { return Math.max(0, startCount - 1); }
    }
}
