import { SarvaTestResult } from '../types';

export type SupportedFormat = 'sarva-varadi' | 'junit' | 'testng' | 'testng-listener' | 'testng-selenium' | 'cucumber' | 'mocha' | 'jest' | 'unknown';

/**
 * Detects if data is already in Sarva-Varadi format
 */
export function isSarvaVaradiFormat(data: any): boolean {
  // Check if it's an array of test results
  if (Array.isArray(data)) {
    if (data.length === 0) return false;
    const firstItem = data[0];
    // Must have required Sarva-Varadi fields
    return !!(
      firstItem.tool &&
      firstItem.name &&
      firstItem.fullName &&
      firstItem.status &&
      typeof firstItem.duration === 'number' &&
      typeof firstItem.start === 'number'
    );
  }
  return false;
}

/**
 * Auto-detects the format of test results
 */
export function detectFormat(data: any): SupportedFormat {
  // Already Sarva-Varadi format
  if (isSarvaVaradiFormat(data)) {
    return 'sarva-varadi';
  }

  // JUnit XML (parsed to JSON)
  if (data.testsuites || data.testsuite) {
    return 'junit';
  }

  // TestNG XML (parsed to JSON)
  if (data.testng || data['testng-results'] || (data.suite && data.suite.test)) {
    return 'testng';
  }

  // TestNG Listener JSON (from SarvaVaradiListener)
  if (Array.isArray(data) && data.length > 0 && data[0].testName && data[0].methodName && data[0].status && data[0].startTime && data[0].endTime) {
    // Check if it's Selenium (has browser info or WebDriver actions)
    if (data[0].browser || data[0].actions) {
      return 'testng-selenium';
    }
    return 'testng-listener';
  }

  // Cucumber JSON
  if (Array.isArray(data) && data[0]?.type === 'feature' && data[0]?.elements) {
    return 'cucumber';
  }

  // Mocha JSON
  if (data.stats && data.tests && Array.isArray(data.tests)) {
    return 'mocha';
  }

  // Jest JSON
  if (data.testResults && Array.isArray(data.testResults)) {
    return 'jest';
  }

  return 'unknown';
}

/**
 * Validates if the format is supported
 */
export function isSupportedFormat(format: SupportedFormat): boolean {
  return format !== 'unknown';
}
