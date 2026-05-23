import { BaseAdapter, SarvaTestResult, TestStep } from '@sarva-varadi/core';

/**
 * Adapter for Cucumber JVM tests.
 *
 * On the Java side, register the Sarva-Varadi plugin in cucumber.properties:
 *   cucumber.plugin=io.github.yoggit.sarvavaradi.SarvaVaradiCucumberPlugin
 *
 * The plugin captures Feature → Scenario → Step hierarchy and writes
 * sarva-varadi-results/test-results.json in Sarva-Varadi native format.
 * The CLI reads this directly with no conversion needed.
 *
 * Works with any underlying tool: Selenium, REST Assured, Playwright, etc.
 *
 * Generate the HTML report:
 *   npx @sarva-varadi/core generate \
 *     --input sarva-varadi-results/test-results.json \
 *     --output sarva-report
 */
export class CucumberAdapter extends BaseAdapter {

  adaptTest(
    testName: string,
    methodName: string,
    status: string,
    startTime: number,
    endTime: number,
    error?: { message: string; stackTrace?: string },
    retryCount?: number,
    flakyReason?: string,
    featureName?: string,
    featureUri?: string,
    tags?: string[],
    steps?: Array<{
      name: string;
      status: string;
      startTime: number;
      endTime: number;
      duration: number;
      errorMessage?: string;
    }>,
  ): SarvaTestResult {
    const uuid     = this.generateUUID();
    const duration = endTime - startTime;

    let sarvaStatus: 'passed' | 'failed' | 'skipped' | 'broken' | 'flaky';
    switch (status) {
      case 'passed':  sarvaStatus = 'passed';  break;
      case 'flaky':   sarvaStatus = 'flaky';   break;
      case 'skipped': sarvaStatus = 'skipped'; break;
      case 'failed':  sarvaStatus = 'failed';  break;
      case 'broken':  sarvaStatus = 'broken';  break;
      default:        sarvaStatus = 'broken';
    }

    const sarvaSteps: TestStep[] = (steps || []).map(s => ({
      name:     s.name,
      status:   s.status as TestStep['status'],
      start:    s.startTime,
      stop:     s.endTime,
      duration: s.duration,
    }));

    const labels = (tags || []).map(tag => ({
      name:  'tag',
      value: tag.startsWith('@') ? tag.substring(1) : tag,
    }));

    return {
      uuid,
      tool:   'cucumber',
      name:    methodName,
      fullName: testName,
      status:  sarvaStatus,
      statusDetails: error ? {
        message: error.message || '',
        trace:   error.stackTrace || '',
      } : undefined,
      stage:    'finished',
      start:    startTime,
      stop:     endTime,
      duration,
      steps:    sarvaSteps,
      attachments: [],
      labels:   labels.length > 0 ? labels : undefined,
      extra: {
        cucumber: {
          featureName,
          featureUri,
          tags,
          retries: retryCount || 0,
        },
        testClass:  featureName,
        testMethod: methodName,
        flakyReason,
      },
    };
  }
}
