import * as fs from 'fs';
import * as path from 'path';
import { SarvaTestResult, RunMetadata, RunSummary, SarvaReporterOptions, DEFAULT_OPTIONS } from '../types';
import { HistoryManager } from '../history-manager';
import { HTMLGenerator } from './html-generator';
import { NotificationManager } from '../notifiers';

export class ReportGenerator {
  private options: Required<SarvaReporterOptions>;
  private historyManager: HistoryManager;
  private htmlGenerator: HTMLGenerator;
  private notificationManager: NotificationManager;

  constructor(options: SarvaReporterOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.historyManager = new HistoryManager(this.options.outputFolder, this.options.history);
    this.htmlGenerator = new HTMLGenerator(this.options);
    this.notificationManager = new NotificationManager(this.options.notifications);
  }

  async generateReport(tests: SarvaTestResult[], metadata: RunMetadata): Promise<void> {
    const outputDir = path.resolve(this.options.outputFolder);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    this.historyManager.initialize();

    const runSummary = this.createRunSummary(metadata, tests);

    this.copyAttachments(outputDir, tests, runSummary.id);
    this.copyLogo(outputDir);

    // Update history BEFORE generating report so per-test trends include current run
    if (this.options.history.enabled) {
      this.historyManager.archiveCurrentRun(runSummary.id, tests);
      this.historyManager.updateHistory(runSummary, tests);
    }

    this.backfillDataJs(outputDir);

    const history = this.historyManager.loadHistory();
    const indexHtml = this.htmlGenerator.generate(tests, metadata, {
      runs: history.runs || [],
      testHistory: history.testHistory || [],
    });
    const indexPath = path.join(outputDir, this.options.outputFile);
    fs.writeFileSync(indexPath, indexHtml);

    console.log(`\n📊 Sarva-Varadi report generated: ${indexPath}`);

    // Send notifications
    if (this.options.notifications?.enabled) {
      const failedTests = tests
        .filter(t => t.status === 'failed' || t.status === 'broken')
        .map(t => ({
          name: t.name,
          error: t.statusDetails?.message || 'No error message',
        }));

      await this.notificationManager.notify({
        summary: runSummary,
        reportUrl: undefined, // Can be set if hosting report online
        trendsUrl: undefined,
        failedTests,
      });
    }
  }

  private getUniqueFinalTests(tests: SarvaTestResult[]): SarvaTestResult[] {
    // Group tests by fullName and keep only the final result (latest attempt)
    const uniqueTests = new Map<string, SarvaTestResult>();

    tests.forEach(test => {
      const key = test.fullName;
      const existing = uniqueTests.get(key);

      // Keep the test with the latest start time (final attempt)
      if (!existing || test.start >= existing.start) {
        uniqueTests.set(key, test);
      }
    });

    return Array.from(uniqueTests.values());
  }

  private getSeverityFromLabels(labels?: { name: string; value: string }[]): string {
    if (!labels) return '';
    const direct = labels.find(l => l.name === 'severity');
    if (direct) return (direct.value || '').toLowerCase();
    const tagged = labels.find(l => l.name === 'tag' && (l.value || '').startsWith('severity:'));
    return tagged ? tagged.value.slice(9).toLowerCase() : '';
  }

  private createRunSummary(metadata: RunMetadata, tests: SarvaTestResult[]): RunSummary {
    // Get only unique final test results for summary calculations
    const uniqueTests = this.getUniqueFinalTests(tests);

    const passed = uniqueTests.filter(t => t.status === 'passed').length;
    const failed = uniqueTests.filter(t => t.status === 'failed' || t.status === 'broken').length;
    const skipped = uniqueTests.filter(t => t.status === 'skipped').length;
    const flaky = uniqueTests.filter(t => t.status === 'flaky').length;
    const total = uniqueTests.length;

    const sevCounts = { critical: 0, high: 0, medium: 0, low: 0, trivial: 0 };
    let anySev = false;
    uniqueTests
      .filter(t => t.status === 'failed' || t.status === 'broken' || t.status === 'flaky')
      .forEach(t => {
        const sev = this.getSeverityFromLabels(t.labels as { name: string; value: string }[]);
        if (sev && sev in sevCounts) {
          sevCounts[sev as keyof typeof sevCounts]++;
          anySev = true;
        }
      });

    return {
      id: metadata.id,
      timestamp: metadata.timestamp,
      duration: metadata.duration,
      total,
      passed,
      failed,
      skipped,
      flaky,
      passRate: total > 0 ? Math.round((passed / total) * 100 * 10) / 10 : 0,
      environment: metadata.environment,
      ...(anySev ? { severityBreakdown: sevCounts } : {}),
    };
  }

  private backfillDataJs(outputDir: string): void {
    const historyDir = path.join(outputDir, 'history');
    if (!fs.existsSync(historyDir)) return;
    fs.readdirSync(historyDir).forEach(runId => {
      const runDir = path.join(historyDir, runId);
      const jsonFile = path.join(runDir, 'data.json');
      const jsFile   = path.join(runDir, 'data.js');
      if (fs.existsSync(jsonFile) && !fs.existsSync(jsFile)) {
        try {
          const raw = fs.readFileSync(jsonFile, 'utf8');
          fs.writeFileSync(jsFile,
            `window.SarvaRunData=window.SarvaRunData||{};window.SarvaRunData[${JSON.stringify(runId)}]=${raw};`
          );
        } catch (_e) { /* skip corrupt runs */ }
      }
    });
  }

  private copyLogo(outputDir: string): void {
    const logoSource = path.join(__dirname, '../screenshots/logo.svg');
    const logoDest = path.join(outputDir, 'logo.svg');

    if (fs.existsSync(logoSource)) {
      try {
        fs.copyFileSync(logoSource, logoDest);
      } catch (error) {
        console.warn('Failed to copy logo, will use fallback', error);
      }
    }
  }

  private copyAttachments(outputDir: string, tests: SarvaTestResult[], runId: string): void {
    if (!this.options.embedAttachments) return;

    const attachmentsDir = path.join(outputDir, 'attachments');
    if (!fs.existsSync(attachmentsDir)) {
      fs.mkdirSync(attachmentsDir, { recursive: true });
    }

    tests.forEach(test => {
      // Prefix: runId + testUuid ensures uniqueness across runs AND across tests within a run.
      // Without this, every run writes e.g. "video.webm" and overwrites the previous run's file,
      // so historical drawer views always show the latest run's attachments instead of the selected one.
      const prefix = `${runId}_${test.uuid}_`;
      this.copyTestAttachments(test, attachmentsDir, prefix);
    });
  }

  private copyTestAttachments(test: SarvaTestResult, attachmentsDir: string, prefix: string): void {
    const copyOne = (attachment: { source?: string; [k: string]: any }): void => {
      if (attachment.source && fs.existsSync(attachment.source)) {
        const fileName = prefix + path.basename(attachment.source);
        const destPath = path.join(attachmentsDir, fileName);
        try {
          fs.copyFileSync(attachment.source, destPath);
          attachment.source = `attachments/${fileName}`;
        } catch (error) {
          console.warn(`Failed to copy attachment: ${attachment.source}`, error);
        }
      }
    };

    test.attachments.forEach(copyOne);

    const walkSteps = (steps: any[]): void => {
      steps.forEach(step => {
        if (step.attachments) step.attachments.forEach(copyOne);
        if (step.steps?.length) walkSteps(step.steps);
      });
    };
    walkSteps(test.steps);
  }
}
