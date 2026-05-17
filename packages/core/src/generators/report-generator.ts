import * as fs from 'fs';
import * as path from 'path';
import { SarvaTestResult, RunMetadata, RunSummary, SarvaReporterOptions, DEFAULT_OPTIONS } from '../types';
import { HistoryManager } from '../history-manager';
import { HTMLGenerator } from './html-generator';
import { TrendsGenerator } from './trends-generator';
import { NotificationManager } from '../notifiers';

export class ReportGenerator {
  private options: Required<SarvaReporterOptions>;
  private historyManager: HistoryManager;
  private htmlGenerator: HTMLGenerator;
  private trendsGenerator: TrendsGenerator;
  private notificationManager: NotificationManager;

  constructor(options: SarvaReporterOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.historyManager = new HistoryManager(this.options.outputFolder, this.options.history);
    this.htmlGenerator = new HTMLGenerator(this.options);
    this.trendsGenerator = new TrendsGenerator(this.options);
    this.notificationManager = new NotificationManager(this.options.notifications);
  }

  async generateReport(tests: SarvaTestResult[], metadata: RunMetadata): Promise<void> {
    const outputDir = path.resolve(this.options.outputFolder);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    this.historyManager.initialize();

    const runSummary = this.createRunSummary(metadata, tests);

    this.copyAttachments(outputDir, tests);
    this.copyLogo(outputDir);

    const indexHtml = this.htmlGenerator.generate(tests, metadata);
    const indexPath = path.join(outputDir, this.options.outputFile);
    fs.writeFileSync(indexPath, indexHtml);

    // Update history BEFORE generating trends so trends shows the current run
    if (this.options.history.enabled) {
      this.historyManager.archiveCurrentRun(runSummary.id, tests);
      this.historyManager.updateHistory(runSummary, tests);
    }

    if (this.options.trends.enabled) {
      const history = this.historyManager.loadHistory();
      const trendsHtml = this.trendsGenerator.generate(history, metadata);
      const trendsPath = path.join(outputDir, 'trends.html');
      fs.writeFileSync(trendsPath, trendsHtml);
    }

    console.log(`\n📊 Sarva-Varadi report generated: ${indexPath}`);
    if (this.options.trends.enabled) {
      console.log(`📈 Trends dashboard: ${path.join(outputDir, 'trends.html')}`);
    }

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

  private createRunSummary(metadata: RunMetadata, tests: SarvaTestResult[]): RunSummary {
    // Get only unique final test results for summary calculations
    const uniqueTests = this.getUniqueFinalTests(tests);

    const passed = uniqueTests.filter(t => t.status === 'passed').length;
    const failed = uniqueTests.filter(t => t.status === 'failed' || t.status === 'broken').length;
    const skipped = uniqueTests.filter(t => t.status === 'skipped').length;
    const flaky = uniqueTests.filter(t => t.status === 'flaky').length;
    const total = uniqueTests.length;

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
    };
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

  private copyAttachments(outputDir: string, tests: SarvaTestResult[]): void {
    if (!this.options.embedAttachments) return;

    const attachmentsDir = path.join(outputDir, 'attachments');
    if (!fs.existsSync(attachmentsDir)) {
      fs.mkdirSync(attachmentsDir, { recursive: true });
    }

    tests.forEach(test => {
      this.copyTestAttachments(test, attachmentsDir);
    });
  }

  private copyTestAttachments(test: SarvaTestResult, attachmentsDir: string): void {
    test.attachments.forEach(attachment => {
      if (attachment.source && fs.existsSync(attachment.source)) {
        const fileName = path.basename(attachment.source);
        const destPath = path.join(attachmentsDir, fileName);

        try {
          fs.copyFileSync(attachment.source, destPath);
          attachment.source = `attachments/${fileName}`;
        } catch (error) {
          console.warn(`Failed to copy attachment: ${attachment.source}`, error);
        }
      }
    });

    test.steps.forEach(step => {
      if (step.attachments) {
        step.attachments.forEach(attachment => {
          if (attachment.source && fs.existsSync(attachment.source)) {
            const fileName = path.basename(attachment.source);
            const destPath = path.join(attachmentsDir, fileName);

            try {
              fs.copyFileSync(attachment.source, destPath);
              attachment.source = `attachments/${fileName}`;
            } catch (error) {
              console.warn(`Failed to copy step attachment: ${attachment.source}`, error);
            }
          }
        });
      }

      if (step.steps) {
        step.steps.forEach(nestedStep => {
          if (nestedStep.attachments) {
            nestedStep.attachments.forEach(attachment => {
              if (attachment.source && fs.existsSync(attachment.source)) {
                const fileName = path.basename(attachment.source);
                const destPath = path.join(attachmentsDir, fileName);

                try {
                  fs.copyFileSync(attachment.source, destPath);
                  attachment.source = `attachments/${fileName}`;
                } catch (error) {
                  console.warn(`Failed to copy nested step attachment: ${attachment.source}`, error);
                }
              }
            });
          }
        });
      }
    });
  }
}
