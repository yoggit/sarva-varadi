import type {
  TestCase,
  TestResult,
  TestStep as PWTestStep,
  Suite,
} from '@playwright/test/reporter';
import { BaseAdapter, SarvaTestResult, TestStep, Attachment, TestStatus } from '@sarva-varadi/core';

export class PlaywrightAdapter extends BaseAdapter {
  private sensitiveValues: string[];

  constructor(
    private maskSensitiveData: boolean = false,
    sensitiveEnvVars: string[] = [],
    private maskAllFills: boolean = false
  ) {
    super();
    this.sensitiveValues = sensitiveEnvVars
      .map(name => process.env[name])
      .filter((v): v is string => typeof v === 'string' && v.length > 0);
  }

  private maskStepTitle(title: string): string {
    if (!this.maskSensitiveData) return title;

    let masked = title;

    // Mask value in every Fill/Type step regardless of locator: Fill "value" locator(...) → Fill "***" locator(...)
    if (this.maskAllFills) {
      masked = masked.replace(/^(Fill|Type|Press sequentially)\s+"([^"]*)"/i, '$1 "***"');
    }

    // Replace resolved env var values wherever they appear in the step title
    for (const value of this.sensitiveValues) {
      const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      masked = masked.replace(new RegExp(escaped, 'g'), '***');
    }

    return masked;
  }

  adaptTest(testCase: TestCase, result: TestResult, projectName: string): SarvaTestResult {
    const uuid = this.generateUUID();
    const fullName = this.getFullTestName(testCase);
    const status = this.adaptStatus(result.status, result.retry);

    // Collect labels from two sources:
    // 1. @tag in test title: test('my test @issue:PROJ-123', ...) — zero code in test body
    // 2. test.info().annotations.push() — for programmatic/dynamic values
    const labelsFromTags        = this.adaptTags((testCase as any).tags || []);
    const labelsFromAnnotations = this.adaptAnnotations(result.annotations || []);
    const labels = [...labelsFromTags, ...labelsFromAnnotations];

    return {
      uuid,
      tool: 'playwright',
      name: this.stripLabelTags(testCase.title),
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
      labels: labels.length ? labels : undefined,
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

  private readonly KNOWN_LABEL_PREFIXES = ['issue:', 'tms:', 'severity:', 'owner:', 'feature:', 'epic:', 'story:'];

  private adaptTags(tags: string[]): { name: string; value: string }[] {
    const labels: { name: string; value: string }[] = [];
    for (const tag of tags) {
      const t = tag.startsWith('@') ? tag.slice(1) : tag;
      const match = this.KNOWN_LABEL_PREFIXES.find(p => t.startsWith(p));
      if (match) {
        labels.push({ name: match.slice(0, -1), value: t.slice(match.length).trim() });
      }
    }
    return labels;
  }

  private adaptAnnotations(annotations: { type: string; description?: string }[]): { name: string; value: string }[] {
    const KNOWN = new Set(['issue', 'tms', 'severity', 'owner', 'feature', 'epic', 'story', 'tag']);
    const labels: { name: string; value: string }[] = [];
    for (const ann of annotations) {
      const type = ann.type?.toLowerCase();
      const value = ann.description || '';
      if (KNOWN.has(type)) {
        labels.push({ name: type, value });
      }
    }
    return labels;
  }

  private adaptSteps(steps: PWTestStep[]): TestStep[] {
    return steps.map(step => ({
      name: this.maskStepTitle(step.title),
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

  private stripLabelTags(title: string): string {
    return title.replace(/@(issue|tms|severity|owner|feature|epic|story):[^\s]+/gi, '').replace(/\s{2,}/g, ' ').trim();
  }

  private getFullTestName(testCase: TestCase): string {
    const parts: string[] = [];
    let current: Suite | undefined = testCase.parent;

    while (current && current.title) {
      parts.unshift(this.stripLabelTags(current.title));
      current = current.parent;
    }

    parts.push(this.stripLabelTags(testCase.title));
    return parts.join(' > ');
  }
}
