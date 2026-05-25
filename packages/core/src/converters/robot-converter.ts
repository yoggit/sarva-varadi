import { BaseConverter } from './base-converter';
import { SarvaTestResult, TestStep, Label } from '../types';

/**
 * Converts Robot Framework output.xml to Sarva-Varadi format.
 * Supports RF 4, 5, 6 and 7 (schemaversion 3 and 4).
 */
export class RobotConverter extends BaseConverter {
  convert(data: any): SarvaTestResult[] {
    const robot = data.robot;
    if (!robot) throw new Error('Invalid Robot Framework output.xml — missing <robot> root element');

    const results: SarvaTestResult[] = [];
    this.processSuite(robot.suite, [], results);
    return results;
  }

  // ── Suite traversal ──────────────────────────────────────────────────────

  private processSuite(suite: any, parentPath: string[], results: SarvaTestResult[]): void {
    if (!suite) return;
    const suites = Array.isArray(suite) ? suite : [suite];

    for (const s of suites) {
      const name = this.attr(s, 'name') || 'Unknown Suite';
      const currentPath = [...parentPath, name];

      if (s.suite) this.processSuite(s.suite, currentPath, results);

      if (s.test) {
        const tests = Array.isArray(s.test) ? s.test : [s.test];
        for (const test of tests) {
          results.push(this.convertTest(test, currentPath));
        }
      }
    }
  }

  // ── Test conversion ───────────────────────────────────────────────────────

  private convertTest(test: any, suitePath: string[]): SarvaTestResult {
    const name  = this.attr(test, 'name') || 'Unknown Test';
    const st    = this.statusAttrs(test);
    const start = this.parseTimestamp(st.start);
    const dur   = Math.round(parseFloat(st.elapsed || '0') * 1000);
    const stop  = start + dur;

    const sarvaStatus = this.mapRobotStatus(st.status || 'FAIL');
    const errorMsg    = sarvaStatus === 'failed' ? this.extractError(test) : undefined;
    const labels      = this.tagsToLabels(this.extractTags(test));
    const steps       = this.extractSteps(test.kw);

    return {
      uuid:         this.generateUUID(),
      tool:         'robot',
      name,
      fullName:     [...suitePath, name].join(' > '),
      status:       sarvaStatus,
      statusDetails: errorMsg ? { message: errorMsg } : undefined,
      stage:        'finished',
      start,
      stop,
      duration:     dur,
      steps,
      attachments:  [],
      labels,
    };
  }

  // ── Keyword → TestStep (recursive) ───────────────────────────────────────

  private extractSteps(kws: any): TestStep[] {
    if (!kws) return [];
    const list = Array.isArray(kws) ? kws : [kws];
    return list.map(kw => this.convertKeyword(kw));
  }

  private convertKeyword(kw: any): TestStep {
    const name = this.attr(kw, 'name') || 'Keyword';
    const type = this.attr(kw, 'type') || '';
    const st   = this.statusAttrs(kw);
    const start = this.parseTimestamp(st.start);
    const dur   = Math.round(parseFloat(st.elapsed || '0') * 1000);

    const label = type && type !== 'kw' ? `[${type.toUpperCase()}] ${name}` : name;

    return {
      name:     label,
      status:   this.mapRobotStatus(st.status || 'PASS'),
      start,
      stop:     start + dur,
      duration: dur,
      steps:    kw.kw ? this.extractSteps(kw.kw) : undefined,
    };
  }

  // ── Tags → Labels ─────────────────────────────────────────────────────────

  private extractTags(test: any): string[] {
    // RF 4-6: <tag>, RF 7: <tags><tag>
    const raw = test.tags?.tag ?? test.tag;
    if (!raw) return [];
    const arr = Array.isArray(raw) ? raw : [raw];
    return arr.map(t => (typeof t === 'string' ? t : t._ ?? '')).filter(Boolean);
  }

  private tagsToLabels(tags: string[]): Label[] {
    return tags.map(tag => {
      const colon = tag.indexOf(':');
      if (colon > 0) {
        return { name: tag.slice(0, colon).toLowerCase(), value: tag.slice(colon + 1).trim() };
      }
      return { name: 'tag', value: tag };
    });
  }

  // ── Error extraction ──────────────────────────────────────────────────────

  private extractError(test: any): string | undefined {
    // RF 7: <status> has a message attribute/text for failures
    const st = this.statusAttrs(test);
    if (st.message) return st.message;

    // status text content (RF 4-6)
    const statusNode = test.status;
    if (typeof statusNode === 'object' && statusNode._) return statusNode._;

    // Walk keywords looking for a FAIL-level message
    return this.findFailMessage(test);
  }

  private findFailMessage(node: any): string | undefined {
    if (!node) return undefined;
    const msgs = node.msg ? (Array.isArray(node.msg) ? node.msg : [node.msg]) : [];
    for (const m of msgs) {
      const level = this.attr(m, 'level') || (m.$ && m.$.level) || '';
      if (level === 'FAIL') return typeof m === 'string' ? m : (m._ ?? '');
    }
    if (node.kw) {
      const kws = Array.isArray(node.kw) ? node.kw : [node.kw];
      for (const kw of kws) {
        const found = this.findFailMessage(kw);
        if (found) return found;
      }
    }
    return undefined;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Read an XML attribute from either `.$` or `._attributes` (xml2js variants) */
  private attr(node: any, key: string): string {
    return (node?.$?.[key] ?? node?._attributes?.[key] ?? '') as string;
  }

  /** Pull status/start/elapsed/message from a <status> child element */
  private statusAttrs(node: any): Record<string, string> {
    const s = node?.status;
    if (!s) return {};
    return { ...(s.$ ?? {}), ...(s._attributes ?? {}), message: s._ ?? s.$?.message ?? '' };
  }

  private mapRobotStatus(status: string): 'passed' | 'failed' | 'skipped' {
    switch (status.toUpperCase()) {
      case 'PASS': return 'passed';
      case 'SKIP':
      case 'NOT RUN': return 'skipped';
      default: return 'failed';
    }
  }

  /**
   * Parse RF timestamp: "20240101 10:00:01.234" or ISO 8601.
   * Returns epoch milliseconds.
   */
  private parseTimestamp(ts: string): number {
    if (!ts) return Date.now();
    // RF 4-6 format: YYYYMMDD HH:MM:SS.mmm
    const m = ts.match(/^(\d{4})(\d{2})(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\.(\d+)$/);
    if (m) {
      const ms = m[7].padEnd(3, '0').slice(0, 3);
      return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.${ms}Z`).getTime();
    }
    // RF 7+ / ISO fallback
    const d = new Date(ts);
    return isNaN(d.getTime()) ? Date.now() : d.getTime();
  }
}
