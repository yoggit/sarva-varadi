import { BaseConverter } from './base-converter';
import { SarvaTestResult } from '../types';

/**
 * Converts TestNG XML format to Sarva-Varadi format
 */
export class TestNGConverter extends BaseConverter {
  convert(data: any): SarvaTestResult[] {
    const results: SarvaTestResult[] = [];

    // Handle both <testng-results> and <suite> root
    const suite = data.testng?.suite || data['testng-results']?.suite || data.suite;
    if (!suite) return results;

    const suites = Array.isArray(suite) ? suite : [suite];

    for (const s of suites) {
      const tests = Array.isArray(s.test) ? s.test : [s.test].filter(Boolean);

      for (const test of tests) {
        const classes = Array.isArray(test.class) ? test.class : [test.class].filter(Boolean);

        for (const cls of classes) {
          const className = cls._attributes?.name || cls.name || '';
          const testMethods = Array.isArray(cls['test-method']) ? cls['test-method'] : [cls['test-method']].filter(Boolean);

          for (const method of testMethods) {
            const attributes = method._attributes || method;
            const testName = attributes.name || 'Unknown Test';
            const fullName = className ? `${className}.${testName}` : testName;
            const status = attributes.status || 'PASS';
            const duration = parseInt(attributes['duration-ms'] || '0', 10);
            const startTime = parseInt(attributes['started-at'] || Date.now().toString(), 10);

            let errorMessage: string | undefined;
            let stackTrace: string | undefined;

            // Check for exceptions
            if (method.exception) {
              const exception = method.exception;
              errorMessage = exception._attributes?.class || 'Test failed';
              stackTrace = exception.message?._text || exception['full-stacktrace']?._text || '';
            }

            const result: SarvaTestResult = {
              uuid: this.generateUUID(),
              tool: 'testng',
              name: this.cleanTestName(testName),
              fullName: this.cleanTestName(fullName),
              status: this.mapStatus(status),
              statusDetails: errorMessage ? {
                message: errorMessage,
                trace: stackTrace,
              } : undefined,
              stage: 'finished',
              start: startTime,
              stop: startTime + duration,
              duration,
              steps: [],
              attachments: [],
            };

            // Extract parameters if present
            if (method.params && method.params.param) {
              const params = Array.isArray(method.params.param) ? method.params.param : [method.params.param];
              result.extra = {
                parameters: params.map((p: any) => ({
                  name: p._attributes?.name,
                  value: p._attributes?.value,
                })),
              };
            }

            results.push(result);
          }
        }
      }
    }

    return results;
  }
}
