import { BaseAdapter, SarvaTestResult } from '@sarva-varadi/core';

/**
 * Adapter for RestAssured + JUnit 5 test results.
 *
 * On the Java side, wire up:
 *   @ExtendWith(SarvaVaradiJUnit5Extension.class)  ← on your base test class
 *
 * The extension auto-registers RestAssuredRequestCapture and writes
 * sarva-varadi-results/test-results.json on JVM exit.
 *
 * Then generate the HTML report with:
 *   npx @sarva-varadi/core generate \
 *     --input sarva-varadi-results/test-results.json \
 *     --output sarva-report
 */
export class RestAssuredJUnit5Adapter extends BaseAdapter {

  adaptTest(
    testName: string,
    methodName: string,
    status: string,
    startTime: number,
    endTime: number,
    error?: { message: string; stackTrace?: string },
    retryCount?: number,
    flakyReason?: string,
  ): SarvaTestResult {
    const uuid     = this.generateUUID();
    const duration = endTime - startTime;

    let sarvaStatus: 'passed' | 'failed' | 'skipped' | 'broken' | 'flaky';
    switch (status) {
      case 'PASS':  sarvaStatus = 'passed';  break;
      case 'FLAKY': sarvaStatus = 'flaky';   break;
      case 'SKIP':  sarvaStatus = 'skipped'; break;
      case 'FAIL':
        sarvaStatus = error?.message?.includes('AssertionError') ? 'failed' : 'broken';
        break;
      default:
        sarvaStatus = 'broken';
    }

    return {
      uuid,
      tool: 'rest-assured',
      name: methodName,
      fullName: testName,
      status: sarvaStatus,
      statusDetails: error ? {
        message: error.message || '',
        trace: error.stackTrace || '',
      } : undefined,
      stage: 'finished',
      start: startTime,
      stop: endTime,
      duration,
      steps: [],
      attachments: [],
      extra: {
        restAssured: {
          retries: retryCount || 0,
        },
        testClass:   testName.split('.').slice(0, -1).join('.'),
        testMethod:  methodName,
        flakyReason: flakyReason,
      },
    };
  }
}
