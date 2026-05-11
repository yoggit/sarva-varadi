import type {
  TestCase,
  TestResult,
  TestStep as PWTestStep,
  FullConfig,
  Suite,
} from '@playwright/test/reporter';
import { BaseAdapter, SarvaTestResult, TestStep, Attachment, TestStatus } from '@sarva-varadi/core';

export class PlaywrightAdapter extends BaseAdapter {
  adaptTest(testCase: TestCase, result: TestResult, projectName: string): SarvaTestResult {
    const uuid = this.generateUUID();
    const fullName = this.getFullTestName(testCase);
    const status = this.adaptStatus(result.status, result.retry);

    return {
      uuid,
      tool: 'playwright',
      name: testCase.title,
      fullName,
      status,
      statusDetails: result.error ? {
        message: result.error.message || '',
        trace: result.error.stack || '',
      } : undefined,
      stage: 'finished',
      start: result.startTime.getTime(),
      stop: (result.startTime.getTime() + result.duration),
      duration: result.duration,
      steps: this.adaptSteps(result.steps),
      attachments: this.adaptAttachments(result.attachments),
      extra: {
        playwright: {
          project: projectName,
          browser: testCase.parent.project()?.use?.browserName,
          retries: result.retry,
          traceFile: this.findTraceFile(result.attachments),
        },
      },
    };
  }

  private adaptStatus(status: string, retry: number): TestStatus {
    if (retry > 0 && status === 'passed') {
      return 'flaky';
    }

    switch (status) {
      case 'passed':
        return 'passed';
      case 'failed':
        return 'failed';
      case 'timedOut':
        return 'broken';
      case 'skipped':
        return 'skipped';
      default:
        return 'broken';
    }
  }

  private adaptSteps(steps: PWTestStep[]): TestStep[] {
    return steps.map(step => ({
      name: step.title,
      status: this.adaptStepStatus(step.error),
      start: step.startTime.getTime(),
      stop: (step.startTime.getTime() + step.duration),
      duration: step.duration,
      steps: step.steps ? this.adaptSteps(step.steps) : undefined,
      attachments: this.adaptAttachments(step.attachments || []),
    }));
  }

  private adaptStepStatus(error: any): TestStatus {
    return error ? 'failed' : 'passed';
  }

  adaptAttachments(attachments: any[]): Attachment[] {
    return attachments
      .filter(att => att.name !== 'error-context')
      .map(att => ({
        name: att.name,
        type: this.getAttachmentType(att.name, att.contentType),
        source: att.path || '',
        contentType: att.contentType,
      }));
  }

  private getAttachmentType(name: string, contentType?: string): string {
    if (name.includes('trace')) return 'trace';
    if (name.includes('video')) return 'video';
    if (name.includes('screenshot') || contentType?.startsWith('image/')) return 'screenshot';
    return 'file';
  }

  private findTraceFile(attachments: any[]): string | undefined {
    const trace = attachments.find(att => att.name.includes('trace'));
    return trace?.path;
  }

  private getFullTestName(testCase: TestCase): string {
    const parts: string[] = [];
    let current: Suite | undefined = testCase.parent;

    while (current && current.title) {
      parts.unshift(current.title);
      current = current.parent;
    }

    parts.push(testCase.title);
    return parts.join(' > ');
  }
}
