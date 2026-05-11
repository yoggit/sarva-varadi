import { BaseConverter } from './base-converter';
import { SarvaTestResult } from '../types';

/**
 * Converter for TestNG Selenium listener JSON format
 * Handles Selenium WebDriver test results with browser info and actions
 */
export class TestNGSeleniumConverter extends BaseConverter {
  convert(data: any[]): SarvaTestResult[] {
    if (!Array.isArray(data)) {
      throw new Error('TestNG Selenium data must be an array');
    }

    return data.map(test => this.convertTest(test));
  }

  private convertTest(test: any): SarvaTestResult {
    const uuid = this.generateUUID();
    const duration = test.endTime - test.startTime;

    // Map TestNG status to Sarva-Varadi status
    let status: 'passed' | 'failed' | 'skipped' | 'broken' | 'flaky';
    if (test.status === 'FLAKY') {
      status = 'flaky';
    } else if (test.status === 'PASS') {
      status = 'passed';
    } else if (test.status === 'FAIL') {
      status = test.error?.message?.includes('AssertionError') ? 'failed' : 'broken';
    } else if (test.status === 'SKIP') {
      status = 'skipped';
    } else {
      status = 'broken';
    }

    // Convert WebDriver actions to detailed hierarchical steps
    const steps = test.actions ? test.actions.map((action: any) =>
      this.convertActionToDetailedStep(action)
    ) : [];

    return {
      uuid,
      tool: 'selenium',
      name: test.methodName || test.testName,
      fullName: test.testName,
      status,
      statusDetails: test.error ? {
        message: test.error.message || '',
        trace: test.error.stackTrace || '',
      } : undefined,
      stage: 'finished',
      start: test.startTime,
      stop: test.endTime,
      duration,
      steps,
      attachments: this.extractAttachments(test),
      extra: {
        selenium: {
          retries: test.retryCount || 0,
          browser: test.browser || {},
        },
        parameters: test.parameters ? test.parameters.map((param: any, index: number) => ({
          name: `param${index + 1}`,
          value: String(param)
        })) : undefined,
        testClass: test.testName.split('.').slice(0, -1).join('.'),
        testMethod: test.methodName,
        flakyReason: test.flakyReason,
      },
    };
  }

  /**
   * Convert WebDriver action into detailed hierarchical step
   * Combines Option B (hierarchical structure) + Option C (timeline with technical details)
   */
  private convertActionToDetailedStep(action: any): any {
    const actionType = action.type || 'action';
    const description = action.description || '';
    const timestamp = action.timestamp;
    const status = action.status === 'failed' ? 'failed' : 'passed';

    // Create main step with action type
    const mainStep: any = {
      name: this.getActionTitle(actionType, description),
      status: status as 'passed' | 'failed',
      start: timestamp,
      stop: timestamp + 100,
      duration: 100,
      steps: [],
    };

    // Add detailed sub-steps based on action type
    if (actionType === 'navigate') {
      mainStep.steps = this.createNavigationDetails(action, timestamp);
    } else if (actionType === 'click') {
      mainStep.steps = this.createClickDetails(action, timestamp);
    } else if (actionType === 'sendKeys') {
      mainStep.steps = this.createInputDetails(action, timestamp);
    } else if (actionType === 'findElement') {
      mainStep.steps = this.createFindElementDetails(action, timestamp);
    } else if (actionType === 'screenshot') {
      mainStep.statusDetails = {
        message: `Screenshot: ${action.file || 'captured'}`,
      };
    } else if (actionType === 'error') {
      mainStep.steps = this.createErrorDetails(action, timestamp);
    }

    return mainStep;
  }

  private getActionTitle(type: string, description: string): string {
    const icons: Record<string, string> = {
      navigate: '🌐',
      click: '🖱️',
      sendKeys: '⌨️',
      findElement: '🔍',
      screenshot: '📸',
      error: '❌',
    };

    const icon = icons[type] || '📌';

    // Extract meaningful title from description
    if (type === 'navigate' && description.includes('GET')) {
      return `${icon} Navigate to Page`;
    } else if (type === 'click' && description.includes('Click on')) {
      return `${icon} Click Element`;
    } else if (type === 'sendKeys' && description.includes('Type into')) {
      return `${icon} Input Text`;
    } else if (type === 'findElement') {
      return `${icon} Find Element`;
    }

    return `${icon} ${description || type}`;
  }

  private createNavigationDetails(action: any, timestamp: number): any[] {
    const url = action.description?.replace('GET ', '').replace('Navigated to ', '');

    return [
      {
        name: '📤 Action Details',
        status: 'passed' as const,
        start: timestamp,
        stop: timestamp + 50,
        duration: 50,
        steps: [
          {
            name: `Type: GET`,
            status: 'passed' as const,
            start: timestamp,
            stop: timestamp + 20,
            duration: 20,
          },
          {
            name: `URL: ${url || 'N/A'}`,
            status: 'passed' as const,
            start: timestamp + 20,
            stop: timestamp + 50,
            duration: 30,
          },
        ],
      },
      {
        name: '✅ Result',
        status: 'passed' as const,
        start: timestamp + 50,
        stop: timestamp + 100,
        duration: 50,
        statusDetails: {
          message: `Status: ${action.status || 'success'} | Duration: ~100ms`,
        },
      },
    ];
  }

  private createClickDetails(action: any, timestamp: number): any[] {
    const element = action.description?.replace('Click on ', '').replace('Clicked successfully', '');

    return [
      {
        name: '🎯 Element Details',
        status: 'passed' as const,
        start: timestamp,
        stop: timestamp + 30,
        duration: 30,
        steps: [
          {
            name: `Locator: ${element || 'Unknown'}`,
            status: 'passed' as const,
            start: timestamp,
            stop: timestamp + 15,
            duration: 15,
          },
          {
            name: `Action: Click`,
            status: 'passed' as const,
            start: timestamp + 15,
            stop: timestamp + 30,
            duration: 15,
          },
        ],
      },
      {
        name: '✅ Result',
        status: 'passed' as const,
        start: timestamp + 30,
        stop: timestamp + 50,
        duration: 20,
        statusDetails: {
          message: `Status: ${action.status || 'success'} | Duration: ~50ms`,
        },
      },
    ];
  }

  private createInputDetails(action: any, timestamp: number): any[] {
    const parts = action.description?.split(':') || [];
    const element = parts[0]?.replace('Type into ', '').trim();
    const value = parts[1]?.trim() || '';

    return [
      {
        name: '🎯 Element Details',
        status: 'passed' as const,
        start: timestamp,
        stop: timestamp + 50,
        duration: 50,
        steps: [
          {
            name: `Locator: ${element || 'Unknown'}`,
            status: 'passed' as const,
            start: timestamp,
            stop: timestamp + 25,
            duration: 25,
          },
          {
            name: `Value: ${value || 'N/A'}`,
            status: 'passed' as const,
            start: timestamp + 25,
            stop: timestamp + 50,
            duration: 25,
          },
        ],
      },
      {
        name: '✅ Result',
        status: 'passed' as const,
        start: timestamp + 50,
        stop: timestamp + 80,
        duration: 30,
        statusDetails: {
          message: `Status: ${action.status || 'success'} | Duration: ~80ms`,
        },
      },
    ];
  }

  private createFindElementDetails(action: any, timestamp: number): any[] {
    const locator = action.description?.replace('Find element: ', '').replace('Element found', '');

    return [
      {
        name: '🔎 Search Details',
        status: 'passed' as const,
        start: timestamp,
        stop: timestamp + 20,
        duration: 20,
        steps: [
          {
            name: `Locator: ${locator || 'Unknown'}`,
            status: 'passed' as const,
            start: timestamp,
            stop: timestamp + 10,
            duration: 10,
          },
          {
            name: `Strategy: Auto-detect`,
            status: 'passed' as const,
            start: timestamp + 10,
            stop: timestamp + 20,
            duration: 10,
          },
        ],
      },
      {
        name: '✅ Result',
        status: 'passed' as const,
        start: timestamp + 20,
        stop: timestamp + 30,
        duration: 10,
        statusDetails: {
          message: `Element found | Duration: ~30ms`,
        },
      },
    ];
  }

  private createErrorDetails(action: any, timestamp: number): any[] {
    const errorMsg = action.description?.replace('Error: ', '');

    return [
      {
        name: '❌ Error Details',
        status: 'failed' as const,
        start: timestamp,
        stop: timestamp + 50,
        duration: 50,
        steps: [
          {
            name: `Message: ${errorMsg || 'Unknown error'}`,
            status: 'failed' as const,
            start: timestamp,
            stop: timestamp + 50,
            duration: 50,
          },
        ],
      },
    ];
  }

  private extractAttachments(test: any): any[] {
    const attachments: any[] = [];

    // Extract screenshots from actions
    if (test.actions) {
      test.actions.forEach((action: any) => {
        if (action.type === 'screenshot' && action.file) {
          attachments.push({
            name: action.file,
            source: `../sarva-varadi-results/screenshots/${action.file}`,
            type: 'image/png',
          });
        }
      });
    }

    return attachments;
  }
}
