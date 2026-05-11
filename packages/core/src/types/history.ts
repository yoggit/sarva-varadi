export interface RunHistory {
  runs: RunSummary[];
  testHistory: TestTrendData[];
  migrationVersion?: number; // Track migration version for data updates
}

export interface RunSummary {
  id: string;
  timestamp: number;
  duration: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  passRate: number;
  environment?: {
    branch?: string;
    commit?: string;
    ci?: string;
  };
}

export interface TestTrendData {
  testId: string;
  testName: string;
  history: TestRunOutcome[];
  flakyScore: number;
  lastStatus: 'passed' | 'failed' | 'skipped';
  wasEverFlaky?: boolean; // Track if test was ever flaky across entire history
  lastFlakyRunId?: string; // RunId of the most recent flaky occurrence
}

export interface TestRunOutcome {
  runId: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  retries: number;
  wasFlaky?: boolean; // True when test passed after retry (original status was 'flaky')
}
