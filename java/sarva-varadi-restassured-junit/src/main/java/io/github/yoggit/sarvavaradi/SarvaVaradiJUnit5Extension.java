package io.github.yoggit.sarvavaradi;

import com.google.gson.GsonBuilder;
import org.junit.jupiter.api.extension.*;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Sarva-Varadi JUnit 5 extension for RestAssured API tests.
 *
 * Option 1 — annotate each test class (or a shared base class):
 *   @ExtendWith(SarvaVaradiJUnit5Extension.class)
 *
 * Option 2 — apply globally via service loader (zero touch per test class):
 *   1. Add to surefire config:
 *        <configurationParameters>
 *          junit.jupiter.extensions.autodetection.enabled=true
 *        </configurationParameters>
 *   2. Create src/test/resources/META-INF/services/org.junit.jupiter.api.extension.Extension
 *      containing: io.github.yoggit.sarvavaradi.SarvaVaradiJUnit5Extension
 *
 * The RestAssured request/response filter is registered automatically before each test —
 * no manual RestAssured.filters() call is needed. Works alongside other JUnit 5 extensions
 * that may replace filters in their own beforeEach (e.g. ExtentReports).
 */
public class SarvaVaradiJUnit5Extension implements BeforeAllCallback, BeforeEachCallback, BeforeTestExecutionCallback, TestWatcher {

    private static final String OUTPUT_FILE = "test-results.json";
    private static final String outputDir   = SarvaVaradiConfig.getOutputDir();

    // Keyed by testId — PUT overwrites so retried tests produce one final record
    private static final Map<String, Map<String, Object>> resultsByTest  = new ConcurrentHashMap<>();
    private static final Map<String, TestAttemptTracker>  attemptTrackers = new ConcurrentHashMap<>();

    private static final AtomicBoolean initialized = new AtomicBoolean(false);

    // Per-thread start time so duration is accurate
    private static final ThreadLocal<Long> testStartTime = new ThreadLocal<>();

    static {
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            if (!resultsByTest.isEmpty()) {
                List<Map<String, Object>> results = new ArrayList<>(resultsByTest.values());
                markFlakyTests(results);
                writeResultsToJson(results);
            }
        }));
    }

    @Override
    public void beforeAll(ExtensionContext context) throws Exception {
        if (initialized.compareAndSet(false, true)) {
            Files.createDirectories(Paths.get(outputDir));
            System.out.println("\n🎯 Sarva-Varadi: Starting JUnit 5 RestAssured test run");
        }
    }

    @Override
    public void beforeEach(ExtensionContext context) {
        RestAssuredRequestCapture.clearApiCalls();

        String testId = testId(context);
        attemptTrackers.putIfAbsent(testId, new TestAttemptTracker());
        attemptTrackers.get(testId).recordAttemptStart();
        testStartTime.set(System.currentTimeMillis());
    }

    @Override
    public void beforeTestExecution(ExtensionContext context) {
        // Register the filter right before the test method runs — after all BeforeEachCallbacks.
        // This guarantees our filter is present even when another extension (e.g. ExtentReports)
        // calls RestAssured.replaceFiltersWith() in its own beforeEach, which would wipe any
        // filter registered earlier in the beforeEach phase.
        boolean alreadyPresent = io.restassured.RestAssured.filters().stream()
                .anyMatch(f -> f instanceof RestAssuredRequestCapture);
        if (!alreadyPresent) {
            io.restassured.RestAssured.filters(new RestAssuredRequestCapture());
        }
    }

    @Override
    public void testSuccessful(ExtensionContext context) {
        recordResult(context, "PASS", null);
    }

    @Override
    public void testFailed(ExtensionContext context, Throwable cause) {
        recordResult(context, "FAIL", cause);
    }

    @Override
    public void testAborted(ExtensionContext context, Throwable cause) {
        recordResult(context, "SKIP", cause);
    }

    @Override
    public void testDisabled(ExtensionContext context, Optional<String> reason) {
        String testId = testIdSafe(context);
        Map<String, Object> data = new HashMap<>();
        data.put("testName",   testId);
        data.put("methodName", context.getDisplayName());
        data.put("status",     "SKIP");
        long now = System.currentTimeMillis();
        data.put("startTime",  now);
        data.put("endTime",    now);
        data.put("duration",   0);
        data.put("retryCount", 0);
        reason.ifPresent(r -> {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Disabled: " + r);
            data.put("error", err);
        });
        resultsByTest.put(testId, data);
    }

    private void recordResult(ExtensionContext context, String status, Throwable cause) {
        String testId = testId(context);
        TestAttemptTracker tracker = attemptTrackers.get(testId);
        if (tracker == null) return;

        tracker.recordAttemptEnd(status);

        long startTime = testStartTime.get() != null ? testStartTime.get() : System.currentTimeMillis();
        long endTime   = System.currentTimeMillis();

        Map<String, Object> data = new HashMap<>();
        data.put("testName",   testId);
        data.put("methodName", context.getRequiredTestMethod().getName());
        data.put("status",     status);
        data.put("startTime",  startTime);
        data.put("endTime",    endTime);
        data.put("duration",   endTime - startTime);
        data.put("retryCount", tracker.getRetryCount());

        if (cause != null) {
            Map<String, String> error = new HashMap<>();
            error.put("message",    cause.getMessage() != null ? cause.getMessage() : cause.getClass().getName());
            error.put("stackTrace", stackTrace(cause));
            data.put("error", error);
        }

        List<Map<String, Object>> apiCalls = RestAssuredRequestCapture.getApiCalls();
        if (!apiCalls.isEmpty()) {
            data.put("apiCalls", apiCalls);
            RestAssuredRequestCapture.saveApiCalls(testId + "-attempt" + tracker.getRetryCount());
        }

        // PUT overwrites any previous attempt — final call wins
        resultsByTest.put(testId, data);
    }

    private static void markFlakyTests(List<Map<String, Object>> results) {
        for (Map<String, Object> test : results) {
            String testId = (String) test.get("testName");
            TestAttemptTracker tracker = attemptTrackers.get(testId);
            if (tracker != null && tracker.isFlaky()) {
                test.put("status",      "FLAKY");
                test.put("flakyReason", "Test passed after " + tracker.getRetryCount() + " retry attempt(s)");
                System.out.println("⚠️  Flaky test detected: " + testId);
            }
        }
    }

    private static void writeResultsToJson(List<Map<String, Object>> results) {
        try {
            Files.createDirectories(Paths.get(outputDir));
            File outputFile = new File(outputDir, OUTPUT_FILE);
            try (FileWriter writer = new FileWriter(outputFile)) {
                writer.write(new GsonBuilder().setPrettyPrinting().create().toJson(results));
            }
            System.out.println("\n✅ Sarva-Varadi: Results saved to " + outputFile.getAbsolutePath());
            System.out.println("📊 Total tests: " + results.size());
            printSummary(results);
        } catch (IOException e) {
            System.err.println("Sarva-Varadi: Failed to write results: " + e.getMessage());
        }
    }

    private static void printSummary(List<Map<String, Object>> results) {
        long passed  = results.stream().filter(r -> "PASS".equals(r.get("status"))).count();
        long failed  = results.stream().filter(r -> "FAIL".equals(r.get("status"))).count();
        long skipped = results.stream().filter(r -> "SKIP".equals(r.get("status"))).count();
        long flaky   = results.stream().filter(r -> "FLAKY".equals(r.get("status"))).count();
        System.out.println("📈 Summary: " + passed + " passed, " + failed + " failed, " +
                           skipped + " skipped, " + flaky + " flaky");
    }

    private String testId(ExtensionContext context) {
        return context.getRequiredTestClass().getName() + "." + context.getRequiredTestMethod().getName();
    }

    private String testIdSafe(ExtensionContext context) {
        try {
            return testId(context);
        } catch (Exception e) {
            return context.getDisplayName();
        }
    }

    private String stackTrace(Throwable t) {
        StringWriter sw = new StringWriter();
        t.printStackTrace(new PrintWriter(sw));
        String s = sw.toString();
        return s.length() > 2000 ? s.substring(0, 2000) + "..." : s;
    }

    private static class TestAttemptTracker {
        private int    startCount  = 0;
        private String finalStatus = null;

        void recordAttemptStart() { startCount++; }
        void recordAttemptEnd(String status) { finalStatus = status; }

        boolean isFlaky()      { return startCount > 1 && "PASS".equals(finalStatus); }
        int     getRetryCount() { return Math.max(0, startCount - 1); }
    }
}
