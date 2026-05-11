import { SarvaTestResult, TestStep, Attachment } from '../types';

export abstract class BaseAdapter {
  abstract adaptTest(...args: any[]): SarvaTestResult;

  adaptStep?(stepData: any): TestStep;
  adaptAttachment?(attachmentData: any): Attachment;

  protected generateUUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  protected calculateDuration(start: number, stop: number): number {
    return stop - start;
  }

  protected sanitizeTestName(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '-');
  }
}
