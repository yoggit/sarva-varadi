import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import { ReportGenerator, SarvaTestResult, RunMetadata, SarvaReporterOptions } from '@sarva-varadi/core';
import { PlaywrightAdapter } from './playwright-adapter';

export default class SarvaPlaywrightReporter implements Reporter {
  private adapter: PlaywrightAdapter;
  private reportGenerator: ReportGenerator;
  private tests: SarvaTestResult[] = [];
  private config: FullConfig | undefined;
  private startTime: number = 0;

  constructor(options: SarvaReporterOptions = {}) {
    this.adapter = new PlaywrightAdapter();
    this.reportGenerator = new ReportGenerator(options);
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.startTime = Date.now();
    console.log(`\n🎯 Sarva-Varadi: Starting test run with ${suite.allTests().length} tests`);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const projectName = test.parent.project()?.name || 'default';
    const sarvaTest = this.adapter.adaptTest(test, result, projectName);
    this.tests.push(sarvaTest);
  }

  async onEnd(result: FullResult): Promise<void> {
    const duration = Date.now() - this.startTime;

    const metadata: RunMetadata = {
      id: this.generateRunId(),
      tool: 'playwright',
      timestamp: this.startTime,
      duration,
      environment: {
        os: process.platform,
        node: process.version,
        branch: process.env.GITHUB_REF_NAME || process.env.GIT_BRANCH,
        commit: process.env.GITHUB_SHA || process.env.GIT_COMMIT,
        ci: process.env.CI ? 'true' : 'false',
      },
    };

    await this.reportGenerator.generateReport(this.tests, metadata);
  }

  private generateRunId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}-${hour}${minute}${second}`;
  }

  printsToStdio(): boolean {
    return false;
  }
}
