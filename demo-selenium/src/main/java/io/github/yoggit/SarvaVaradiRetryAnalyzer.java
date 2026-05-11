package io.github.yoggit.sarvavaradi;

import org.testng.IRetryAnalyzer;
import org.testng.ITestResult;

/**
 * Sarva-Varadi Retry Analyzer for Selenium tests
 * Automatically retries failed tests up to MAX_RETRY_COUNT times
 * Used for flaky test detection
 */
public class SarvaVaradiRetryAnalyzer implements IRetryAnalyzer {

    private static final int MAX_RETRY_COUNT = 2;
    private int retryCount = 0;

    @Override
    public boolean retry(ITestResult result) {
        if (retryCount < MAX_RETRY_COUNT) {
            retryCount++;
            result.setAttribute("retryCount", retryCount);
            System.out.println("⚠️  Retrying test: " + result.getName() +
                             " (attempt " + (retryCount + 1) + " of " + MAX_RETRY_COUNT + ")");
            return true;
        }
        return false;
    }

    public int getRetryCount() {
        return retryCount;
    }
}
