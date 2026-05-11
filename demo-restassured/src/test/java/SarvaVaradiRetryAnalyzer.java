import org.testng.IRetryAnalyzer;
import org.testng.ITestResult;

/**
 * Retry analyzer for detecting and retrying flaky tests
 * Integrates with SarvaVaradiListener to track retry attempts
 */
public class SarvaVaradiRetryAnalyzer implements IRetryAnalyzer {
    private static final int MAX_RETRY_COUNT = 2; // Maximum retry attempts
    private int retryCount = 0;

    @Override
    public boolean retry(ITestResult result) {
        if (retryCount < MAX_RETRY_COUNT) {
            retryCount++;
            System.out.println("⚠️  Retrying test: " + result.getMethod().getMethodName() +
                             " (Attempt " + (retryCount + 1) + " of " + (MAX_RETRY_COUNT + 1) + ")");

            // Mark that this test has been retried (will be used by listener)
            result.setAttribute("retryCount", retryCount);
            return true;
        }
        return false;
    }

    /**
     * Get the current retry count for a test
     */
    public int getRetryCount() {
        return retryCount;
    }

    /**
     * Reset retry count (called between tests)
     */
    public void reset() {
        retryCount = 0;
    }
}
