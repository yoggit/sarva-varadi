import { BaseConverter } from './base-converter';
import { SarvaTestResult } from '../types';

/**
 * Converts JUnit XML format to Sarva-Varadi format
 * Supports Maven Surefire, Gradle, and other JUnit-based reporters
 */
export class JUnitConverter extends BaseConverter {
  convert(data: any): SarvaTestResult[] {
    const results: SarvaTestResult[] = [];

    // Handle both <testsuites> and single <testsuite> root
    const suites = this.extractTestSuites(data);

    for (const suite of suites) {
      const suiteName = suite._attributes?.name || suite.name || 'Unknown Suite';
      const testcases = Array.isArray(suite.testcase) ? suite.testcase : [suite.testcase].filter(Boolean);

      for (const testcase of testcases) {
        const attributes = testcase._attributes || testcase;
        const testName = attributes.name || 'Unknown Test';
        const className = attributes.classname || attributes.className || '';
        const fullName = className ? `${className}.${testName}` : testName;
        const duration = parseFloat(attributes.time || '0') * 1000; // Convert seconds to ms
        const start = Date.now() - duration; // Approximate start time
        const stop = Date.now();

        // Determine status
        let status: 'passed' | 'failed' | 'skipped' = 'passed';
        let errorMessage: string | undefined;
        let stackTrace: string | undefined;

        if (testcase.failure) {
          status = 'failed';
          const failure = testcase.failure;
          errorMessage = failure._attributes?.message || failure.message || 'Test failed';
          stackTrace = failure._text || failure._cdata || failure.toString();
        } else if (testcase.error) {
          status = 'failed';
          const error = testcase.error;
          errorMessage = error._attributes?.message || error.message || 'Test error';
          stackTrace = error._text || error._cdata || error.toString();
        } else if (testcase.skipped) {
          status = 'skipped';
          errorMessage = testcase.skipped._attributes?.message || testcase.skipped.message || 'Test skipped';
        }

        const result: SarvaTestResult = {
          uuid: this.generateUUID(),
          tool: 'junit',
          name: this.cleanTestName(testName),
          fullName: this.cleanTestName(fullName),
          status,
          statusDetails: errorMessage ? {
            message: errorMessage,
            trace: stackTrace,
          } : undefined,
          stage: 'finished',
          start,
          stop,
          duration,
          steps: [],
          attachments: [],
        };

        // Extract system-out and system-err as metadata
        if (testcase['system-out'] || testcase['system-err']) {
          result.extra = {};
          if (testcase['system-out']) {
            result.extra.systemOut = testcase['system-out']._text || testcase['system-out'].toString();
          }
          if (testcase['system-err']) {
            result.extra.systemErr = testcase['system-err']._text || testcase['system-err'].toString();
          }
        }

        results.push(result);
      }
    }

    return results;
  }

  private extractTestSuites(data: any): any[] {
    if (data.testsuites) {
      const suites = data.testsuites.testsuite;
      return Array.isArray(suites) ? suites : [suites].filter(Boolean);
    }

    if (data.testsuite) {
      return Array.isArray(data.testsuite) ? data.testsuite : [data.testsuite];
    }

    return [];
  }
}
