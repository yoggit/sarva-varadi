import { SarvaTestResult } from '../types';
import { randomUUID } from 'crypto';

/**
 * Base converter class for transforming test results to Sarva-Varadi format
 */
export abstract class BaseConverter {
  /**
   * Convert test results from source format to Sarva-Varadi format
   */
  abstract convert(data: any): SarvaTestResult[];

  /**
   * Generate a unique ID for a test
   */
  protected generateUUID(): string {
    return randomUUID();
  }

  /**
   * Map status from source format to Sarva-Varadi status
   */
  protected mapStatus(status: string): 'passed' | 'failed' | 'skipped' | 'flaky' | 'broken' {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus.includes('pass')) return 'passed';
    if (normalizedStatus.includes('fail')) return 'failed';
    if (normalizedStatus.includes('skip') || normalizedStatus.includes('pending')) return 'skipped';
    if (normalizedStatus.includes('flaky')) return 'flaky';
    if (normalizedStatus.includes('broken') || normalizedStatus.includes('error')) return 'broken';

    // Default to failed for unknown statuses
    return 'failed';
  }

  /**
   * Extract browser/environment info from test name or properties
   */
  protected extractBrowser(testName: string, properties?: any): string {
    const browserPatterns = ['chromium', 'firefox', 'webkit', 'chrome', 'safari', 'edge'];

    for (const browser of browserPatterns) {
      if (testName.toLowerCase().includes(browser)) {
        return browser;
      }
    }

    if (properties?.browser) {
      return properties.browser;
    }

    return 'unknown';
  }

  /**
   * Clean test name by removing browser suffix if present
   */
  protected cleanTestName(fullName: string): string {
    // Remove browser suffix like " - chromium", " [firefox]", etc.
    return fullName
      .replace(/\s*[-–]\s*(chromium|firefox|webkit|chrome|safari|edge)$/i, '')
      .replace(/\s*\[(chromium|firefox|webkit|chrome|safari|edge)\]$/i, '')
      .trim();
  }
}
