package io.github.yoggit.sarvavaradi;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.openqa.selenium.WebDriver;
import org.testng.*;
import org.testng.annotations.Test;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sarva-Varadi TestNG Listener for Selenium tests
 * Captures test execution details including:
 * - Test results with flaky detection
 * - Browser information
 * - Screenshots and logs
 * - Retry attempts
 * - WebDriver actions
 */
public class SarvaVaradiSeleniumListener implements ITestListener, IRetryAnalyzer {

    private static final String OUTPUT_FILE = "test-results.json";
    private final String outputDir;
    private final int maxRetryCount;

    private final List<Map<String, Object>> testResults = Collections.synchronizedList(new ArrayList<>());
    private final Map<String, TestAttemptTracker> attemptTrackers = new ConcurrentHashMap<>();
    private final Map<String, Integer> retryCounters = new ConcurrentHashMap<>();

    public SarvaVaradiSeleniumListener() {
        this.outputDir = SarvaVaradiConfig.getOutputDir();
        this.maxRetryCount = SarvaVaradiConfig.getMaxRetryCount();
    }

    @Override
    public void onStart(ITestContext context) {
        System.out.println("\n🎯 Sarva-Varadi: Starting Selenium test run with " +
                          context.getAllTestMethods().length + " tests");

        // Create output directory
        try {
            Files.createDirectories(Paths.get(outputDir));
        } catch (IOException e) {
            System.err.println("Failed to create output directory: " + e.getMessage());
        }
    }

    @Override
    public void onTestStart(ITestResult result) {
        String testId = getTestId(result);
        attemptTrackers.putIfAbsent(testId, new TestAttemptTracker(testId));

        TestAttemptTracker tracker = attemptTrackers.get(testId);
        tracker.recordAttemptStart(System.currentTimeMillis());
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        captureScreenshotForStatus(result, "passed");
        recordTestResult(result, "PASS");
    }

    @Override
    public void onTestFailure(ITestResult result) {
        captureScreenshotForStatus(result, "failed");
        recordTestResult(result, "FAIL");
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        captureScreenshotForStatus(result, "skipped");
        recordTestResult(result, "SKIP");
    }

    @Override
    public void onFinish(ITestContext context) {
        // Mark flaky tests
        markFlakyTests();

        // Write results to JSON
        writeResultsToJson();

        System.out.println("\n✅ Sarva-Varadi: Test results saved to " + outputDir + "/" + OUTPUT_FILE);
    }

    /**
     * IRetryAnalyzer implementation for automatic retry on failure
     */
    @Override
    public boolean retry(ITestResult result) {
        String testId = getTestId(result);
        int retryCount = retryCounters.getOrDefault(testId, 0);

        if (retryCount < maxRetryCount) {
            retryCounters.put(testId, retryCount + 1);
            result.setAttribute("retryCount", retryCount + 1);
            System.out.println("⚠️  Retrying test: " + result.getName() + " (attempt " + (retryCount + 2) + ")");
            return true;
        }

        return false;
    }

    private void recordTestResult(ITestResult result, String status) {
        String testId = getTestId(result);
        TestAttemptTracker tracker = attemptTrackers.get(testId);

        long endTime = System.currentTimeMillis();
        tracker.recordAttemptEnd(endTime, status);

        // Only record the final result
        if (tracker.isFinalAttempt(status)) {
            Map<String, Object> testData = new HashMap<>();

            testData.put("testName", result.getTestClass().getName() + "." + result.getName());
            testData.put("methodName", result.getName());
            testData.put("status", status);
            testData.put("startTime", result.getStartMillis());
            testData.put("endTime", result.getEndMillis());
            testData.put("duration", result.getEndMillis() - result.getStartMillis());
            testData.put("retryCount", tracker.getRetryCount());

            // Browser info
            testData.put("browser", getBrowserInfo(result));

            // Error details
            if (result.getThrowable() != null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", result.getThrowable().getMessage());
                error.put("stackTrace", getStackTrace(result.getThrowable()));
                testData.put("error", error);
            }

            // Test parameters
            if (result.getParameters().length > 0) {
                testData.put("parameters", Arrays.asList(result.getParameters()));
            }

            // WebDriver actions (if captured)
            testData.put("actions", getWebDriverActions(result));

            testResults.add(testData);
        }
    }

    private void markFlakyTests() {
        for (Map<String, Object> test : testResults) {
            String testName = (String) test.get("testName");
            TestAttemptTracker tracker = attemptTrackers.get(testName);

            if (tracker != null && tracker.isFlaky()) {
                test.put("status", "FLAKY");
                test.put("flakyReason", "Test passed after " + tracker.getRetryCount() + " retry attempt(s)");
            }
        }
    }

    private void writeResultsToJson() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.enable(SerializationFeature.INDENT_OUTPUT);

            File outputFile = new File(outputDir, OUTPUT_FILE);
            mapper.writeValue(outputFile, testResults);

        } catch (IOException e) {
            System.err.println("Failed to write test results: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String getTestId(ITestResult result) {
        return result.getTestClass().getName() + "." + result.getName();
    }

    private Map<String, String> getBrowserInfo(ITestResult result) {
        Map<String, String> browserInfo = new HashMap<>();

        // Try to get WebDriver from test instance or context
        Object testInstance = result.getInstance();
        WebDriver driver = extractWebDriver(testInstance);

        if (driver != null) {
            try {
                browserInfo.put("name", driver.getClass().getSimpleName().replace("Driver", ""));
                browserInfo.put("version", "Unknown"); // Can be enhanced with capabilities
                browserInfo.put("platform", System.getProperty("os.name"));
            } catch (Exception e) {
                browserInfo.put("name", "Unknown");
            }
        } else {
            browserInfo.put("name", "Unknown");
            browserInfo.put("platform", System.getProperty("os.name"));
        }

        return browserInfo;
    }

    private WebDriver extractWebDriver(Object testInstance) {
        // Try to extract WebDriver from test instance
        // This can be customized based on your test framework structure
        try {
            if (testInstance instanceof IHookable) {
                // Custom extraction logic
            }
        } catch (Exception e) {
            // Ignore
        }
        return null;
    }

    private List<Map<String, Object>> getWebDriverActions(ITestResult result) {
        // Placeholder for WebDriver action capture
        // Will be populated by WebDriverEventListener
        List<Map<String, Object>> actions = new ArrayList<>();

        Object actionsAttr = result.getAttribute("webDriverActions");
        if (actionsAttr instanceof List) {
            return (List<Map<String, Object>>) actionsAttr;
        }

        return actions;
    }

    private String getStackTrace(Throwable throwable) {
        StringBuilder sb = new StringBuilder();
        for (StackTraceElement element : throwable.getStackTrace()) {
            sb.append(element.toString()).append("\n");
            if (sb.length() > 2000) break; // Limit stack trace length
        }
        return sb.toString();
    }

    private void captureScreenshotForStatus(ITestResult result, String status) {
        SarvaVaradiWebDriverListener listener = extractWebDriverListener(result);
        if (listener != null) {
            listener.captureTestEndScreenshot(getTestId(result), status);
        }
    }

    private SarvaVaradiWebDriverListener extractWebDriverListener(ITestResult result) {
        // Try to extract the WebDriverListener from test attributes
        Object listenerAttr = result.getAttribute("webDriverListener");
        if (listenerAttr instanceof SarvaVaradiWebDriverListener) {
            return (SarvaVaradiWebDriverListener) listenerAttr;
        }
        return null;
    }

    /**
     * Tracks test attempts for flaky detection
     */
    private static class TestAttemptTracker {
        private final String testId;
        private int retryCount = 0;
        private String finalStatus = null;
        private final List<String> attemptStatuses = new ArrayList<>();

        public TestAttemptTracker(String testId) {
            this.testId = testId;
        }

        public void recordAttemptStart(long startTime) {
            // Can track start times if needed
        }

        public void recordAttemptEnd(long endTime, String status) {
            attemptStatuses.add(status);
            finalStatus = status;
        }

        public boolean isFinalAttempt(String status) {
            // Need access to maxRetryCount from parent class
            return status.equals("PASS") || retryCount >= 2; // Will be fixed via config
        }

        public boolean isFlaky() {
            return retryCount > 0 && "PASS".equals(finalStatus);
        }

        public int getRetryCount() {
            return retryCount;
        }

        public void incrementRetry() {
            retryCount++;
        }
    }
}
