import { BaseConverter } from './base-converter';
import { SarvaTestResult, TestStep, Attachment } from '../types';

/**
 * Converts Allure 2/3 result files to SarvaTestResult[].
 *
 * Allure writes one *-result.json per test into an allure-results/ directory.
 * The CLI reads all *-result.json files from the directory and passes them as
 * an array to this converter.
 *
 * Allure status values (passed/failed/broken/skipped) map directly to
 * SarvaTestResult status — no transformation needed beyond the type cast.
 */
export class AllureConverter extends BaseConverter {
  convert(data: any[]): SarvaTestResult[] {
    return data
      .filter(r => r && r.uuid)
      .filter(r => !r.hidden)     // skip previous retry attempts (Allure marks them hidden: true)
      .map(r => this.convertOne(r));
  }

  private convertOne(r: any): SarvaTestResult {
    const start: number = r.start ?? Date.now();
    const stop: number  = r.stop  ?? start;

    return {
      uuid:        r.uuid,
      tool:        'allure',
      name:        r.name    || 'Unnamed Test',
      fullName:    r.fullName || r.name || 'Unnamed Test',
      status:      this.adaptStatus(r.status, r.flaky),
      statusDetails: this.adaptStatusDetails(r.statusDetails),
      stage:       'finished',
      start,
      stop,
      duration:    stop - start,
      steps:       this.adaptSteps(r.steps       || []),
      attachments: this.adaptAttachments(r.attachments || []),
      labels:      this.adaptLabels(r.labels || [], r.links || []),
    };
  }

  private adaptStatus(status: string, flaky?: boolean): SarvaTestResult['status'] {
    if (flaky && (status || '').toLowerCase() === 'passed') return 'flaky';
    switch ((status || '').toLowerCase()) {
      case 'passed':  return 'passed';
      case 'failed':  return 'failed';
      case 'broken':  return 'broken';
      case 'skipped': return 'skipped';
      default:        return 'broken';
    }
  }


  private adaptStatusDetails(d: any): SarvaTestResult['statusDetails'] {
    if (!d) return undefined;
    return { message: d.message || '', trace: d.trace || '' };
  }

  private adaptSteps(steps: any[]): TestStep[] {
    return steps.map(s => ({
      name:        s.name || 'Step',
      status:      this.adaptStatus(s.status),
      start:       s.start ?? 0,
      stop:        s.stop  ?? 0,
      duration:    (s.stop ?? 0) - (s.start ?? 0),
      steps:       s.steps?.length ? this.adaptSteps(s.steps) : undefined,
      attachments: this.adaptAttachments(s.attachments || []),
    }));
  }

  private adaptAttachments(attachments: any[]): Attachment[] {
    return attachments.map(a => ({
      name:        a.name   || 'attachment',
      type:        this.guessAttachmentType(a.type, a.name),
      source:      a.source || '',
      contentType: a.type   || '',
    }));
  }

  private guessAttachmentType(contentType: string, name: string): string {
    const ct = (contentType || '').toLowerCase();
    const n  = (name        || '').toLowerCase();
    if (ct.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/.test(n)) return 'screenshot';
    if (ct.startsWith('video/') || /\.(webm|mp4|mov)$/.test(n))          return 'video';
    if (n.includes('trace') || /\.zip$/.test(n))                         return 'trace';
    return 'file';
  }

  private adaptLabels(
    labels: { name: string; value: string }[],
    links:  { name?: string; url?: string; type?: string }[]
  ): { name: string; value: string }[] {
    const result: { name: string; value: string }[] = [];

    // Pass through label types sarva-varadi understands natively
    const KNOWN = new Set(['severity', 'owner', 'feature', 'epic', 'story', 'suite', 'tag']);
    for (const l of labels) {
      if (KNOWN.has((l.name || '').toLowerCase())) {
        result.push({ name: l.name.toLowerCase(), value: l.value });
      }
    }

    // Allure links → issue / tms labels (rendered as badges in test detail)
    for (const link of links) {
      const type = (link.type || '').toLowerCase();
      const val  = link.name || link.url || '';
      if (type === 'issue') result.push({ name: 'issue', value: val });
      if (type === 'tms')   result.push({ name: 'tms',   value: val });
    }

    return result;
  }
}
