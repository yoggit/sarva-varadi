package io.github.yoggit.sarvavaradi;

import org.testng.IRetryAnalyzer;
import org.testng.ITestResult;

/**
 * Retry analyzer for flaky test detection.
 *
 * Use on individual tests:
 *   @Test(retryAnalyzer = SarvaVaradiRetryAnalyzer.class)
 *
 * Max retries configurable via: -Dsarva.maxRetryCount=2
 */
public class SarvaVaradiRetryAnalyzer implements IRetryAnalyzer {

    private static final int MAX_RETRY_COUNT = SarvaVaradiConfig.getMaxRetryCount();

    private int retryCount = 0;

    @Override
    public boolean retry(ITestResult result) {
        if (retryCount < MAX_RETRY_COUNT) {
            retryCount++;
            result.setAttribute("retryCount", retryCount);
            System.out.println("⚠️  Retrying: " + result.getName() +
                               " (attempt " + (retryCount + 1) + " of " + (MAX_RETRY_COUNT + 1) + ")");
            return true;
        }
        return false;
    }

    public int getRetryCount() {
        return retryCount;
    }
}
