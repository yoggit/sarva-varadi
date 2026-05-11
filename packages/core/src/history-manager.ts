import * as fs from 'fs';
import * as path from 'path';
import { RunHistory, RunSummary, TestTrendData, TestRunOutcome, SarvaTestResult, HistoryOptions } from './types';

export class HistoryManager {
  private historyDir: string;
  private runsFile: string;

  constructor(
    private outputFolder: string,
    private options: HistoryOptions
  ) {
    this.historyDir = path.join(outputFolder, 'history');
    this.runsFile = path.join(this.historyDir, 'runs.json');
  }

  initialize(): void {
    if (!fs.existsSync(this.historyDir)) {
      fs.mkdirSync(this.historyDir, { recursive: true });
    }
  }

  loadHistory(): RunHistory {
    if (!fs.existsSync(this.runsFile)) {
      // Check if archived run folders exist - if so, rebuild from them
      if (fs.existsSync(this.historyDir)) {
        const runFolders = fs.readdirSync(this.historyDir).filter(name => {
          const fullPath = path.join(this.historyDir, name);
          return fs.statSync(fullPath).isDirectory();
        });

        if (runFolders.length > 0) {
          console.log('📦 No runs.json found but archived folders exist. Rebuilding history from archives...');
          this.rebuildHistoryFromArchives();
          // Load the rebuilt history
          if (fs.existsSync(this.runsFile)) {
            return JSON.parse(fs.readFileSync(this.runsFile, 'utf-8'));
          }
        }
      }
      return { runs: [], testHistory: [] };
    }

    try {
      const content = fs.readFileSync(this.runsFile, 'utf-8');
      const history = JSON.parse(content);

      // Check if migration is needed (if missing version marker or any outcome missing wasFlaky flag)
      const needsMigration = !history.migrationVersion || history.migrationVersion < 1 ||
        history.testHistory.some((test: TestTrendData) =>
          test.history.some((outcome: TestRunOutcome) => outcome.wasFlaky === undefined)
        );

      if (needsMigration) {
        console.log('🔄 Migrating history to add wasFlaky flags from archived data...');
        this.migrateHistoryWithFlakyFlags();
        // Reload after migration
        return JSON.parse(fs.readFileSync(this.runsFile, 'utf-8'));
      }

      return history;
    } catch (error) {
      console.warn('Failed to load run history:', error);
      return { runs: [], testHistory: [] };
    }
  }

  saveHistory(history: RunHistory): void {
    fs.writeFileSync(this.runsFile, JSON.stringify(history, null, 2));
  }

  archiveCurrentRun(runId: string, tests: SarvaTestResult[]): void {
    if (!this.options.enabled) return;

    const runDir = path.join(this.historyDir, runId);
    if (!fs.existsSync(runDir)) {
      fs.mkdirSync(runDir, { recursive: true });
    }

    const dataFile = path.join(runDir, 'data.json');
    fs.writeFileSync(dataFile, JSON.stringify(tests, null, 2));
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

  updateHistory(runSummary: RunSummary, tests: SarvaTestResult[]): void {
    if (!this.options.enabled) return;

    // Get only unique final test results (excluding retry attempts)
    const uniqueTests = this.getUniqueFinalTests(tests);

    const history = this.loadHistory();

    // Check if this run ID already exists (prevent duplicates)
    if (history.runs.some(run => run.id === runSummary.id)) {
      console.log(`⚠️  Run ${runSummary.id} already exists in history, skipping duplicate`);
      return;
    }

    history.runs.unshift(runSummary);

    // Cleanup logic: Keep runs that meet EITHER criteria
    // 1. Within last N runs (maxRuns)
    // 2. Within last N days (retentionDays)
    // Only delete runs that exceed BOTH limits
    const runsToDelete: RunSummary[] = [];

    if (this.options.maxRuns > 0 || this.options.retentionDays > 0) {
      const cutoffTime = this.options.retentionDays > 0
        ? Date.now() - (this.options.retentionDays * 24 * 60 * 60 * 1000)
        : 0;

      history.runs.forEach((run, index) => {
        const exceedsMaxRuns = this.options.maxRuns > 0 && index >= this.options.maxRuns;
        const exceedsRetentionDays = this.options.retentionDays > 0 && run.timestamp < cutoffTime;

        // Delete only if BOTH conditions are true (if both are configured)
        // Or if the single configured condition is true
        const shouldDelete = this.options.maxRuns > 0 && this.options.retentionDays > 0
          ? exceedsMaxRuns && exceedsRetentionDays
          : exceedsMaxRuns || exceedsRetentionDays;

        if (shouldDelete) {
          runsToDelete.push(run);
        }
      });

      // Remove the runs marked for deletion
      history.runs = history.runs.filter(run => !runsToDelete.includes(run));
      runsToDelete.forEach(run => this.deleteRunFolder(run.id));
    }

    if (this.options.trackPerTest) {
      history.testHistory = this.updateTestHistory(history.testHistory, runSummary.id, uniqueTests);
    }

    this.saveHistory(history);
  }

  private updateTestHistory(
    existingHistory: TestTrendData[],
    runId: string,
    tests: SarvaTestResult[]
  ): TestTrendData[] {
    const testMap = new Map<string, TestTrendData>();

    existingHistory.forEach(trend => {
      testMap.set(trend.testId, trend);
    });

    tests.forEach(test => {
      const testId = this.getTestId(test);

      let status: 'passed' | 'failed' | 'skipped';
      let wasFlaky = false;

      if (test.status === 'flaky') {
        status = 'failed'; // Store as failed for trend calculation
        wasFlaky = true; // But mark that it was actually flaky (passed after retry)
      } else if (test.status === 'broken') {
        status = 'failed';
      } else if (test.status === 'passed' || test.status === 'failed' || test.status === 'skipped') {
        status = test.status;
      } else {
        status = 'failed';
      }

      const outcome: TestRunOutcome = {
        runId,
        status,
        duration: test.duration,
        retries: test.extra?.playwright?.retries || 0,
        wasFlaky,
      };

      if (testMap.has(testId)) {
        const trend = testMap.get(testId)!;

        // Update wasEverFlaky flag if this outcome was flaky
        if (outcome.wasFlaky) {
          trend.wasEverFlaky = true;
          // Update lastFlakyRunId only if this is the most recent flaky occurrence
          if (!trend.lastFlakyRunId || runId.localeCompare(trend.lastFlakyRunId) > 0) {
            trend.lastFlakyRunId = runId;
          }
        }

        trend.history.unshift(outcome);
        trend.history = trend.history.slice(0, 10);
        trend.lastStatus = outcome.status;
        trend.flakyScore = this.calculateFlakyScore(trend.history);
      } else {
        testMap.set(testId, {
          testId,
          testName: test.name,
          history: [outcome],
          flakyScore: 0,
          lastStatus: outcome.status,
          wasEverFlaky: outcome.wasFlaky,
          lastFlakyRunId: outcome.wasFlaky ? runId : undefined,
        });
      }
    });

    return Array.from(testMap.values());
  }

  private calculateFlakyScore(history: TestRunOutcome[]): number {
    if (history.length < 2) return 0;

    let statusChanges = 0;
    let flakyRetries = 0; // Only count retries when test was actually flaky (passed after retry)

    for (let i = 1; i < history.length; i++) {
      if (history[i].status !== history[i - 1].status) {
        statusChanges++;
      }
      // Only count retries if the test was actually flaky (wasFlaky = true)
      if (history[i].wasFlaky && history[i].retries > 0) {
        flakyRetries += history[i].retries;
      }
    }

    const changeRate = (statusChanges / (history.length - 1)) * 100;
    const retryRate = (flakyRetries / history.length) * 20;

    return Math.min(100, Math.round(changeRate + retryRate));
  }

  private getTestId(test: SarvaTestResult): string {
    return `${test.tool}:${test.fullName}`;
  }

  private deleteRunFolder(runId: string): void {
    const runDir = path.join(this.historyDir, runId);
    if (fs.existsSync(runDir)) {
      fs.rmSync(runDir, { recursive: true, force: true });
    }
  }

  getRecentRuns(count: number = 10): RunSummary[] {
    const history = this.loadHistory();
    return history.runs.slice(0, count);
  }

  getFlakyTests(minScore: number = 30, limit: number = 10): TestTrendData[] {
    const history = this.loadHistory();
    return history.testHistory
      .filter(test => test.flakyScore >= minScore)
      .sort((a, b) => b.flakyScore - a.flakyScore)
      .slice(0, limit);
  }

  // Rebuild runs.json from archived run folders
  rebuildHistoryFromArchives(): void {
    console.log('🔄 Rebuilding history from archived run folders...');

    // Get all run folders
    const runFolders = fs.readdirSync(this.historyDir)
      .filter(name => {
        const fullPath = path.join(this.historyDir, name);
        return fs.statSync(fullPath).isDirectory();
      })
      .sort()
      .reverse(); // Most recent first

    console.log(`Found ${runFolders.length} archived run folders`);

    const history: RunHistory = { runs: [], testHistory: [], migrationVersion: 1 };

    // Process each archived run
    runFolders.forEach(runId => {
      const dataFile = path.join(this.historyDir, runId, 'data.json');
      if (!fs.existsSync(dataFile)) {
        console.log(`⚠️  Skipping ${runId} - no data.json found`);
        return;
      }

      try {
        const tests: SarvaTestResult[] = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
        if (tests.length === 0) return;

        // Get unique final tests for this run
        const uniqueTests = this.getUniqueFinalTests(tests);

        // Calculate run summary
        const runSummary: RunSummary = {
          id: runId,
          timestamp: uniqueTests[0]?.start || Date.now(),
          duration: uniqueTests.reduce((sum, t) => sum + t.duration, 0),
          total: uniqueTests.length,
          passed: uniqueTests.filter(t => t.status === 'passed').length,
          failed: uniqueTests.filter(t => t.status === 'failed' || t.status === 'broken').length,
          skipped: uniqueTests.filter(t => t.status === 'skipped').length,
          flaky: uniqueTests.filter(t => t.status === 'flaky').length,
          passRate: 0,
          environment: {
            ci: 'false'
          }
        };
        runSummary.passRate = runSummary.total > 0
          ? Math.round((runSummary.passed / runSummary.total) * 100 * 10) / 10
          : 0;

        history.runs.push(runSummary);

        // Update test history
        uniqueTests.forEach(test => {
          const testId = this.getTestId(test);

          let status: 'passed' | 'failed' | 'skipped';
          let wasFlaky = false;

          if (test.status === 'flaky') {
            status = 'failed';
            wasFlaky = true;
          } else if (test.status === 'broken') {
            status = 'failed';
          } else if (test.status === 'passed' || test.status === 'failed' || test.status === 'skipped') {
            status = test.status;
          } else {
            status = 'failed';
          }

          const outcome: TestRunOutcome = {
            runId,
            status,
            duration: test.duration,
            retries: test.extra?.playwright?.retries || 0,
            wasFlaky,
          };

          let testTrend = history.testHistory.find(t => t.testId === testId);
          if (!testTrend) {
            testTrend = {
              testId,
              testName: test.name,
              history: [],
              flakyScore: 0,
              lastStatus: outcome.status,
              wasEverFlaky: outcome.wasFlaky,
              lastFlakyRunId: outcome.wasFlaky ? runId : undefined,
            };
            history.testHistory.push(testTrend);
          } else {
            // Update wasEverFlaky flag if this outcome was flaky
            if (outcome.wasFlaky) {
              testTrend.wasEverFlaky = true;
              // Since we're processing runs from newest to oldest, the first flaky we encounter is the most recent
              // Only set lastFlakyRunId if it's not already set, or if this run is newer
              if (!testTrend.lastFlakyRunId || runId.localeCompare(testTrend.lastFlakyRunId) > 0) {
                testTrend.lastFlakyRunId = runId;
              }
            }
          }

          // Since we're processing runs from newest to oldest, push (not unshift) to maintain order
          testTrend.history.push(outcome);
          // Keep only the 10 most recent (which are at the beginning of the array)
          if (testTrend.history.length > 10) {
            testTrend.history = testTrend.history.slice(0, 10);
          }
          testTrend.lastStatus = outcome.status;
          testTrend.flakyScore = this.calculateFlakyScore(testTrend.history);
        });

        console.log(`✓ Processed ${runId} - ${uniqueTests.length} tests, ${runSummary.flaky} flaky`);
      } catch (error) {
        console.warn(`⚠️  Failed to process ${runId}:`, error);
      }
    });

    this.saveHistory(history);
    console.log(`✅ Rebuilt history with ${history.runs.length} runs and ${history.testHistory.length} unique tests`);
  }

  // Migrate existing history to add wasFlaky flag from archived run data
  private migrateHistoryWithFlakyFlags(): void {
    // Read history directly without using loadHistory to avoid recursion
    const content = fs.readFileSync(this.runsFile, 'utf-8');
    const history: RunHistory = JSON.parse(content);

    // For each test in testHistory, update their history array with wasFlaky flags
    let migratedCount = 0;
    let totalProcessed = 0;

    console.log(`Processing ${history.testHistory.length} tests in history...`);

    history.testHistory.forEach(testTrend => {
      testTrend.history.forEach(outcome => {
        totalProcessed++;
        // Note: We don't skip if wasFlaky is already set, because it might have been set incorrectly
        // The migration needs to re-check archived data to ensure accuracy

        // Try to load the archived run data to check if test was flaky
        const runDir = path.join(this.historyDir, outcome.runId);
        const dataFile = path.join(runDir, 'data.json');

        if (fs.existsSync(dataFile)) {
          try {
            const testsData: SarvaTestResult[] = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

            // Debug: check first test in this run
            const flakyInRun = testsData.filter(t => t.status === 'flaky');
            if (flakyInRun.length > 0) {
              console.log(`📍 Run ${outcome.runId} has ${flakyInRun.length} flaky tests in archive`);
              flakyInRun.forEach(t => {
                const archiveTestId = `${t.tool}:${t.fullName}`;
                console.log(`  - Archive testId: "${archiveTestId}"`);
                console.log(`  - Looking for: "${testTrend.testId}"`);
                console.log(`  - Match: ${archiveTestId === testTrend.testId}`);
              });
            }

            // Find ALL occurrences of this test in the archived data (including retries)
            const archivedTests = testsData.filter(t => {
              const testId = `${t.tool}:${t.fullName}`;
              return testId === testTrend.testId;
            });

            // Set wasFlaky based on the archived status - check if ANY occurrence has status 'flaky'
            if (archivedTests.length > 0) {
              // Check if any of the test attempts (including retries) has status 'flaky'
              const wasFlaky = archivedTests.some(t => t.status === 'flaky');
              if (wasFlaky && outcome.wasFlaky !== wasFlaky) {
                console.log(`✓ Found flaky test: ${testTrend.testName} in run ${outcome.runId}`);
                migratedCount++;
              }
              outcome.wasFlaky = wasFlaky;
            } else {
              console.log(`✗ Could not find test ${testTrend.testId} in run ${outcome.runId}`);
              outcome.wasFlaky = false;
            }
          } catch (error) {
            console.warn(`Failed to read archived data for run ${outcome.runId}:`, error);
            outcome.wasFlaky = false;
          }
        } else {
          outcome.wasFlaky = false;
        }
      });
    });

    // Mark as migrated
    history.migrationVersion = 1;

    // Save the migrated history
    this.saveHistory(history);
    console.log(`✅ Successfully migrated history with wasFlaky flags (${migratedCount} flaky tests found out of ${totalProcessed} outcomes processed)`);
  }
}
