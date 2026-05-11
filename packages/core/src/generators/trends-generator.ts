import { RunHistory, RunMetadata, SarvaReporterOptions, TestTrendData, TestRunOutcome } from '../types';
import { AssetsLoader } from './assets-loader';

export class TrendsGenerator {
  constructor(private options: Required<SarvaReporterOptions>) {}

  generate(history: RunHistory, currentMetadata: RunMetadata): string {
    const styles = AssetsLoader.getStyles();
    const scripts = AssetsLoader.getScripts();
    const toolName = this.getToolName(history);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sarva-Varadi → Trends</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        ${styles}
        /* Additional styles for trends page */
        .chart-container {
            position: relative;
            height: 300px;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="container">
        ${this.generateHeader(history, toolName)}
        ${this.generateTrendsContent(history)}
    </div>
    <script>${scripts}</script>
    ${this.generateChartsScript(history)}
</body>
</html>`;
  }

  private getToolName(history: RunHistory): string {
    if (history.testHistory.length === 0) return '';
    // testId format is "tool:fullName", extract the tool part
    const testId = history.testHistory[0].testId;
    const tool = testId.split(':')[0];
    const toolNames: Record<string, string> = {
      'playwright': 'Playwright',
      'selenium': 'Selenium',
      'cypress': 'Cypress',
      'rest-assured': 'RestAssured'
    };
    return toolNames[tool] || tool;
  }

  private generateHeader(history: RunHistory, toolName: string): string {
    const titleText = toolName ? `Sarva-Varadi → ${toolName} Trends` : `${this.options.title} - Trends`;
    const latestRun = history.runs.length > 0 ? history.runs[0] : null;

    return `
    <header class="header">
        <div class="header-content">
            <div class="header-left">
                <h1 class="title">
                    <img src="./logo.svg" alt="Sarva-Varadi" class="logo" style="height: 60px; width: auto;">
                    <span class="title-text">${titleText}</span>
                </h1>
                <div class="nav-tabs" style="margin-top: 0.5rem;">
                    <a href="index.html" class="nav-tab">← Latest Run</a>
                    <a href="trends.html" class="nav-tab active">Trends</a>
                </div>
            </div>
            <div class="header-right" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0;">
                ${latestRun ? `
                <div class="subtitle">
                    Latest Run on <span id="timestamp" data-time="${new Date(latestRun.timestamp).toISOString()}"></span>
                </div>
                ` : ''}
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="subtitle">
                        Historical analysis across ${history.runs.length} runs
                    </div>
                    <div class="theme-toggle">
                        <input type="checkbox" id="themeToggle" class="theme-toggle-checkbox">
                        <label for="themeToggle" class="theme-toggle-label">
                            <span class="theme-toggle-icon">🌙</span>
                            <span class="theme-toggle-icon">☀️</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </header>`;
  }

  private generateTrendsContent(history: RunHistory): string {
    return `
    <section class="summary-and-filters" style="flex-direction: column;">
        <!-- Date Range Filter -->
        <div class="summary-section" style="background: var(--color-section-bg); padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span style="font-weight: 600; font-size: 0.95rem;">Date Range:</span>
                </div>
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                    <button onclick="filterByDateRange('last20')" class="filter-btn active" data-date-filter="last20" style="padding: 0.35rem 0.75rem; font-size: 0.875rem;">Last 20 Runs</button>
                    <button onclick="filterByDateRange('last30days')" class="filter-btn" data-date-filter="last30days" style="padding: 0.35rem 0.75rem; font-size: 0.875rem;">Last 30 Days</button>
                    <button onclick="filterByDateRange('last60days')" class="filter-btn" data-date-filter="last60days" style="padding: 0.35rem 0.75rem; font-size: 0.875rem;">Last 60 Days</button>
                    <button onclick="filterByDateRange('all')" class="filter-btn" data-date-filter="all" style="padding: 0.35rem 0.75rem; font-size: 0.875rem;">All</button>
                </div>
            </div>
            <div style="margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px solid var(--color-border); font-size: 0.875rem; color: var(--color-text-secondary);">
                <strong style="color: #f59e0b; font-weight: 700;">📋 Note:</strong> History retention policy keeps up to ${this.options.history.maxRuns} runs OR runs from the last ${this.options.history.retentionDays} days (whichever provides more data).
            </div>
        </div>

        <!-- Pass Rate Chart -->
        <div class="summary-section">
            <h2 class="section-header" style="display: flex; align-items: center; flex-wrap: wrap;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                Health Pulse
                <span class="info-tooltip" style="position: relative; display: inline-flex; cursor: help; margin-left: 0.25rem; vertical-align: super; font-size: 0.7em;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <circle cx="12" cy="8" r="1" fill="#d97706"></circle>
                    </svg>
                    <span class="tooltip-text"><strong>Pass Rate Over Time:</strong><br>Tracks the percentage of passing tests across recent runs. Shows overall test suite stability and quality trends.</span>
                </span>
                <span id="passrate-runs-count" style="margin-left: 1rem; color: var(--color-text-secondary); font-size: 0.875rem; font-weight: normal;">(${Math.min(history.runs.length, 20)} runs)</span>
                <div style="display: flex; gap: 0.5rem; margin-left: auto;">
                    <button onclick="zoomPassRateChart('out')" class="control-btn" style="padding: 0.3rem 0.6rem; font-size: 0.875rem;">➖</button>
                    <button onclick="zoomPassRateChart('reset')" class="control-btn" style="padding: 0.3rem 0.6rem; font-size: 0.875rem;">↺</button>
                    <button onclick="zoomPassRateChart('in')" class="control-btn" style="padding: 0.3rem 0.6rem; font-size: 0.875rem;">➕</button>
                </div>
            </h2>
            <div id="pass-rate-scroll-container" style="overflow-x: auto; overflow-y: hidden;">
                <div id="pass-rate-chart-wrapper" class="chart-container">
                    <canvas id="pass-rate-chart"></canvas>
                </div>
            </div>
        </div>

        <!-- Distribution Chart -->
        <div class="summary-section">
            <h2 class="section-header" style="display: flex; align-items: center; flex-wrap: wrap;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;">
                    <line x1="12" y1="20" x2="12" y2="10"></line>
                    <line x1="18" y1="20" x2="18" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="16"></line>
                </svg>
                Execution Breakdown
                <span class="info-tooltip" style="position: relative; display: inline-flex; cursor: help; margin-left: 0.25rem; vertical-align: super; font-size: 0.7em;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <circle cx="12" cy="8" r="1" fill="#d97706"></circle>
                    </svg>
                    <span class="tooltip-text"><strong>Test Distribution Per Run:</strong><br>Breakdown of test outcomes (passed, failed, flaky, skipped) for each run. Helps identify patterns in test behavior.</span>
                </span>
                <span id="distribution-runs-count" style="margin-left: 1rem; color: var(--color-text-secondary); font-size: 0.875rem; font-weight: normal;">(${Math.min(history.runs.length, 20)} runs)</span>
                <div id="distribution-legend" style="display: flex; gap: 1rem; margin-left: auto; font-size: 0.875rem;">
                    <!-- Legend will be populated by JavaScript -->
                </div>
            </h2>
            <div id="distribution-chart-wrapper" class="chart-container">
                <canvas id="distribution-chart"></canvas>
            </div>
        </div>

        <!-- Flaky Tests Section -->
        ${this.generateFlakyTests(history)}

        <!-- Recent Runs Table -->
        ${this.generateRecentRuns(history)}
    </section>`;
  }

  private generateFlakyTests(history: RunHistory): string {
    // Group tests by name (removing browser prefix) to avoid duplicates
    const testsByName = new Map<string, TestTrendData[]>();

    history.testHistory
      // Only include tests that were ever flaky across entire history
      .filter(test => test.wasEverFlaky)
      .forEach(test => {
        const testName = test.testName;
        if (!testsByName.has(testName)) {
          testsByName.set(testName, []);
        }
        testsByName.get(testName)!.push(test);
      });

    // For each unique test name, merge data from all browsers
    const uniqueFlakyTests = Array.from(testsByName.entries()).map(([testName, tests]) => {
      // Use the highest flaky score among all browser variants
      const maxFlakyScore = Math.max(...tests.map(t => t.flakyScore));

      // Merge history from all browsers, sort by runId to maintain chronological order
      const mergedHistory: TestRunOutcome[] = [];
      const seenRuns = new Set<string>();

      tests.forEach(test => {
        test.history.forEach(outcome => {
          if (!seenRuns.has(outcome.runId)) {
            seenRuns.add(outcome.runId);
            mergedHistory.push(outcome);
          } else {
            // If this run already exists, keep the "worst" status (wasFlaky > failed > passed)
            const existingIndex = mergedHistory.findIndex(h => h.runId === outcome.runId);
            if (existingIndex !== -1) {
              const existing = mergedHistory[existingIndex];
              if (outcome.wasFlaky && !existing.wasFlaky) {
                mergedHistory[existingIndex] = outcome;
              } else if (outcome.status === 'failed' && existing.status === 'passed' && !existing.wasFlaky) {
                mergedHistory[existingIndex] = outcome;
              }
            }
          }
        });
      });

      // Sort by most recent first (assuming runId contains timestamp)
      mergedHistory.sort((a, b) => b.runId.localeCompare(a.runId));

      // Find the most recent flaky run ID across all browser variants
      const lastFlakyRunId = tests.reduce((latest, test) => {
        if (!test.lastFlakyRunId) return latest;
        if (!latest || test.lastFlakyRunId > latest) return test.lastFlakyRunId;
        return latest;
      }, undefined as string | undefined);

      return {
        testId: tests[0].testId,
        testName,
        history: mergedHistory.slice(0, 10),
        flakyScore: maxFlakyScore,
        lastStatus: tests[0].lastStatus,
        wasEverFlaky: tests.some(t => t.wasEverFlaky),
        lastFlakyRunId
      };
    });

    const flakyTests = uniqueFlakyTests
      .sort((a, b) => b.flakyScore - a.flakyScore)
      .slice(0, 10);

    if (flakyTests.length === 0) {
      return `
        <div class="summary-section">
            <h2 class="section-header">🔥 Top Offenders</h2>
            <div style="padding: 0.5rem 1rem; margin-bottom: 1rem; background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; border-radius: 4px; color: var(--color-text-secondary); font-size: 0.875rem; font-style: italic;">
                ⚠️ Shows all history (not filtered by date range)
            </div>
            <div style="padding: 2rem; text-align: center; color: var(--color-text-secondary);">
                <div style="font-size: 3rem;">🎉</div>
                <div style="margin-top: 1rem;">No flaky tests detected!</div>
            </div>
        </div>`;
    }

    const items = flakyTests.map((test, index) => {
      const scoreClass = test.flakyScore >= 70 ? 'card-failed' : 'card-flaky';

      // Generate icons with styled tooltips showing run date/time
      const historyIcons = test.history.slice(0, 10).map(outcome => {
        const run = history.runs.find(r => r.id === outcome.runId);
        const isoTime = run ? new Date(run.timestamp).toISOString() : '';
        const statusText = outcome.wasFlaky ? 'Flaky (passed after retry)' :
                          outcome.status === 'passed' ? 'Passed' :
                          outcome.status === 'failed' ? 'Failed' : 'Skipped';

        let icon = '';
        let color = '';
        if (outcome.wasFlaky) {
          icon = '~';
          color = 'var(--color-flaky)';
        } else if (outcome.status === 'passed') {
          icon = '✓';
          color = 'var(--color-passed)';
        } else if (outcome.status === 'failed') {
          icon = '✗';
          color = 'var(--color-failed)';
        } else {
          icon = '○';
          color = 'var(--color-skipped)';
        }

        return `<span class="info-tooltip" style="position: relative; display: inline-flex; color: ${color}; cursor: help; margin: 0 0.15rem;">
                  ${icon}
                  <span class="tooltip-text tooltip-date" data-time="${isoTime}" style="white-space: nowrap; width: auto; min-width: 200px; left: 50%; transform: translateX(-50%); right: auto; top: auto; bottom: 100%; margin-top: 0; margin-bottom: 0.5rem;"><strong>${statusText}</strong><br><span class="date-placeholder">Loading...</span></span>
                </span>`;
      }).join('');

      // Use lastFlakyRunId to find the most recent flaky occurrence from entire history
      const run = test.lastFlakyRunId ? history.runs.find(r => r.id === test.lastFlakyRunId) : null;
      const lastFlakyIso = run ? new Date(run.timestamp).toISOString() : '';

      return `
        <div class="test-item" style="margin-bottom: 0.5rem;">
            <div class="test-header" style="cursor: default;">
                <div class="test-header-left">
                    <span class="status-icon status-flaky">~</span>
                    <div class="test-info">
                        <div class="test-title">${this.escapeHtml(test.testName)}</div>
                        <div class="test-meta">
                            <span class="test-tag" style="background: ${test.flakyScore >= 70 ? 'var(--color-failed)' : 'var(--color-flaky)'};">
                                Flaky Score: ${test.flakyScore}%
                            </span>
                            <span style="margin-left: 1rem; color: var(--color-text-secondary); font-size: 0.875rem;">
                                Last flaky: <span class="last-flaky-date" data-time="${lastFlakyIso}">${lastFlakyIso ? 'Loading...' : 'Unknown'}</span>
                            </span>
                            <span style="margin-left: 1rem; font-family: monospace;">
                                <span style="color: var(--color-text-secondary);">Last 10 runs:</span> ${historyIcons}
                                <span style="margin-left: 0.5rem; font-size: 0.75rem; color: var(--color-text-secondary); font-style: italic; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">(hover for details)</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');

    return `
      <div class="summary-section">
          <h2 class="section-header" onclick="toggleFlakyTestsSection()" style="display: flex; align-items: center; cursor: pointer;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
              Top Offenders (${flakyTests.length})
              <span class="info-tooltip" style="position: relative; display: inline-flex; cursor: help; margin-left: 0.25rem; vertical-align: super; font-size: 0.7em;" onclick="event.stopPropagation();">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <circle cx="12" cy="8" r="1" fill="#d97706"></circle>
                  </svg>
                  <span class="tooltip-text"><strong>Flakiest Tests:</strong><br><strong>Flaky Score (0-100):</strong> Calculated based on status changes between runs (pass→fail→pass) and retry frequency.<br><strong>Formula:</strong> (Status Changes ÷ Total Runs × 100) + (Total Retries ÷ Total Runs × 20)<br><strong>Interpretation:</strong> 0-20 = Stable, 21-50 = Moderately Flaky, 51-100 = Highly Flaky ⚠️</span>
              </span>
              <span id="flaky-tests-hint" style="margin-left: 1rem; color: #f59e0b; font-style: italic; font-size: 0.9rem; font-weight: normal;">
                  Click to expand and see details
              </span>
              <span id="flaky-tests-expand-icon" style="margin-left: auto; font-size: 1.2rem;">▼</span>
          </h2>
          <div style="padding: 0.5rem 1rem; margin-bottom: 1rem; background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; border-radius: 4px; color: var(--color-text-secondary); font-size: 0.875rem; font-style: italic;">
              ⚠️ Shows all history (not filtered by date range)<br>
              <span style="font-size: 0.8rem; margin-top: 0.25rem; display: inline-block;">ℹ️ "Last 10 runs" shows only runs where the specific test executed (hover icons for dates)</span>
          </div>
          <div id="flaky-tests-content" style="display: none;">
              <div class="tests-list">
                  ${items}
              </div>
          </div>
      </div>`;
  }

  private generateRecentRuns(history: RunHistory): string {
    // Generate rows for all available runs (will be filtered by JavaScript)
    const allRuns = history.runs;

    const rows = allRuns.map(run => {
      const date = new Date(run.timestamp);
      const isoTime = date.toISOString();
      const duration = this.formatDuration(run.duration);
      const passRateColor = run.passRate >= 95 ? 'var(--color-passed)' : run.passRate >= 80 ? 'var(--color-flaky)' : 'var(--color-failed)';

      return `
        <tr>
            <td><span class="activity-date" data-time="${isoTime}">Loading...</span></td>
            <td style="color: ${passRateColor}; font-weight: 600;">${run.passRate}%</td>
            <td>
                <span style="color: var(--color-passed);">✓ ${run.passed}</span>
                <span style="color: var(--color-failed); margin-left: 0.5rem;">✗ ${run.failed}</span>
                ${run.flaky > 0 ? `<span style="color: var(--color-flaky); margin-left: 0.5rem;">~ ${run.flaky}</span>` : ''}
                <span style="color: var(--color-skipped); margin-left: 0.5rem;">○ ${run.skipped}</span>
            </td>
            <td>${duration}</td>
        </tr>`;
    }).join('');

    return `
      <div class="activity-stream-section">
          <h2 class="section-header" style="display: flex; align-items: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Activity Stream
              <span class="info-tooltip" style="position: relative; display: inline-flex; cursor: help; margin-left: 0.25rem; vertical-align: super; font-size: 0.7em;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <circle cx="12" cy="8" r="1" fill="#d97706"></circle>
                  </svg>
                  <span class="tooltip-text"><strong>Test Run History:</strong><br>Filterable history of test runs with timestamps, pass rates, and detailed results. Use filters to view Last 20/50/100 runs or All.</span>
              </span>
              <span id="recent-runs-count" style="margin-left: 1rem; color: var(--color-text-secondary); font-size: 0.875rem; font-weight: normal;">(20 runs)</span>
          </h2>

          <!-- Activity Stream Filter -->
          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; margin-bottom: 1rem; padding: 0.5rem 0;">
              <span style="font-weight: 600; font-size: 0.9rem; color: var(--color-text-secondary);">Show:</span>
              <button onclick="filterActivityStream(20)" class="filter-btn active" data-activity-filter="20" style="padding: 0.35rem 0.75rem; font-size: 0.875rem;">Last 20</button>
              <button onclick="filterActivityStream(50)" class="filter-btn" data-activity-filter="50" style="padding: 0.35rem 0.75rem; font-size: 0.875rem;">Last 50</button>
              <button onclick="filterActivityStream(100)" class="filter-btn" data-activity-filter="100" style="padding: 0.35rem 0.75rem; font-size: 0.875rem;">Last 100</button>
              <button onclick="filterActivityStream(0)" class="filter-btn" data-activity-filter="all" style="padding: 0.35rem 0.75rem; font-size: 0.875rem;">All</button>
          </div>

          <!-- Scrollable table container -->
          <div style="max-height: calc(20 * 3rem); overflow-y: auto; border: 1px solid var(--color-border); border-radius: 8px;">
              <table id="activity-stream-table" style="width: 100%; border-collapse: collapse;">
                  <thead style="position: sticky; top: 0; background: var(--color-surface); z-index: 10;">
                      <tr style="border-bottom: 2px solid var(--color-border);">
                          <th style="padding: 0.75rem; text-align: left; font-weight: 600;">Date & Time</th>
                          <th style="padding: 0.75rem; text-align: left; font-weight: 600;">Pass Rate</th>
                          <th style="padding: 0.75rem; text-align: left; font-weight: 600;">Results</th>
                          <th style="padding: 0.75rem; text-align: left; font-weight: 600;">Duration</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${rows}
                  </tbody>
              </table>
          </div>
      </div>`;
  }

  private generateChartsScript(history: RunHistory): string {
    const passRateData = this.preparePassRateData(history);
    const distributionData = this.prepareDistributionData(history);
    const runs = history.runs.slice(0, 30).reverse();
    const distributionRuns = history.runs.slice(0, 30).reverse();

    return `
    <script>
        // Pass Rate Chart
        let passRateZoom = 1;
        let passRateChart;
        let currentPassRateTimestamps = [];
        const passRateCtx = document.getElementById('pass-rate-chart');
        if (passRateCtx) {
            passRateChart = new Chart(passRateCtx, {
                type: 'line',
                data: ${JSON.stringify(passRateData)},
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    const date = new Date(currentPassRateTimestamps[context[0].dataIndex]);
                                    return 'Run: ' + date.toLocaleString();
                                },
                                label: function(context) {
                                    return 'Pass Rate: ' + context.parsed.y.toFixed(1) + '%';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                display: true
                            },
                            title: { display: true, text: 'Test Run Date/Time' }
                        },
                        y: {
                            min: 0,
                            max: 108,
                            ticks: {
                                stepSize: 20,
                                callback: function(value) {
                                    return value <= 100 ? value : '';
                                }
                            },
                            title: { display: true, text: 'Pass Rate (%)' }
                        }
                    }
                }
            });
        }

        // Distribution Chart
        let distributionZoom = 1;
        let distributionChart;
        let currentDistributionTimestamps = [];
        const distributionCtx = document.getElementById('distribution-chart');
        const distributionDatasets = ${JSON.stringify(distributionData.datasets)};
        if (distributionCtx) {
            distributionChart = new Chart(distributionCtx, {
                type: 'bar',
                data: ${JSON.stringify(distributionData)},
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    const date = new Date(currentDistributionTimestamps[context[0].dataIndex]);
                                    return 'Run: ' + date.toLocaleString();
                                },
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.y + ' tests';
                                },
                                footer: function(context) {
                                    let total = 0;
                                    context.forEach(item => total += item.parsed.y);
                                    return 'Total: ' + total + ' tests';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            stacked: true,
                            ticks: {
                                display: true,
                                autoSkip: true,
                                maxRotation: 0,
                                minRotation: 0
                            },
                            title: { display: true, text: 'Test Run Date/Time' }
                        },
                        y: { stacked: true, title: { display: true, text: 'Test Count' } }
                    }
                }
            });

            // Populate custom legend
            const legendContainer = document.getElementById('distribution-legend');
            if (legendContainer) {
                distributionDatasets.forEach(dataset => {
                    const legendItem = document.createElement('div');
                    legendItem.style.display = 'flex';
                    legendItem.style.alignItems = 'center';
                    legendItem.style.gap = '0.25rem';
                    legendItem.innerHTML = '<span style="display: inline-block; width: 12px; height: 12px; background: ' + dataset.backgroundColor + '; border-radius: 2px;"></span><span>' + dataset.label + '</span>';
                    legendContainer.appendChild(legendItem);
                });
            }

            // Apply default filter (Last 20 Runs) on page load
            setTimeout(() => filterByDateRange('last20'), 100);
        }

        // Zoom functions for Pass Rate chart
        function zoomPassRateChart(action) {
            const wrapper = document.getElementById('pass-rate-chart-wrapper');
            const scrollContainer = document.getElementById('pass-rate-scroll-container');
            if (!wrapper || !passRateChart) return;

            if (action === 'in') {
                passRateZoom = Math.min(passRateZoom + 0.2, 2);
            } else if (action === 'out') {
                passRateZoom = Math.max(passRateZoom - 0.2, 0.4);
            } else if (action === 'reset') {
                passRateZoom = 1;
            }

            const newWidth = passRateZoom * 100;
            wrapper.style.width = newWidth + '%';
            wrapper.style.minWidth = newWidth + '%';

            passRateChart.update('none');

            // Scroll to center after zoom
            if (scrollContainer) {
                scrollContainer.scrollLeft = (scrollContainer.scrollWidth - scrollContainer.clientWidth) / 2;
            }
        }

        // Zoom functions for Distribution chart
        function zoomDistributionChart(action) {
            if (!distributionChart) return;

            if (action === 'in') {
                distributionZoom = Math.min(distributionZoom + 0.2, 2);
            } else if (action === 'out') {
                distributionZoom = Math.max(distributionZoom - 0.2, 0.3);
            } else if (action === 'reset') {
                distributionZoom = 1;
            }

            // Adjust bar thickness via categoryPercentage and barPercentage
            distributionChart.options.scales.x.ticks.maxRotation = distributionZoom < 0.6 ? 45 : 0;
            distributionChart.options.categoryPercentage = 0.8 * distributionZoom;
            distributionChart.options.barPercentage = 0.9 * distributionZoom;
            distributionChart.update('none');
        }

        // Date range filter function
        const allRuns = ${JSON.stringify(history.runs)};
        let currentFilter = 'last20';

        function filterByDateRange(filter) {
            currentFilter = filter;

            // Update active button
            document.querySelectorAll('[data-date-filter]').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector('[data-date-filter="' + filter + '"]').classList.add('active');

            // Filter runs based on selection
            let filteredRuns = allRuns;

            if (filter === 'last20') {
                filteredRuns = allRuns.slice(0, 20);
            } else if (filter === 'last30days') {
                const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
                filteredRuns = allRuns.filter(run => run.timestamp >= cutoff);
            } else if (filter === 'last60days') {
                const cutoff = Date.now() - (60 * 24 * 60 * 60 * 1000);
                filteredRuns = allRuns.filter(run => run.timestamp >= cutoff);
            }

            // Update Pass Rate chart
            const passRateData = filteredRuns.slice(0, 30).reverse();
            const passRateLabels = passRateData.map(r => {
                const date = new Date(r.timestamp);
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return [month + '/' + day + '/' + year, hours + ':' + minutes];
            });
            const passRateValues = passRateData.map(r => r.passRate);

            passRateChart.data.labels = passRateLabels;
            passRateChart.data.datasets[0].data = passRateValues;
            currentPassRateTimestamps = passRateData.map(r => r.timestamp);
            passRateChart.update();

            // Update Pass Rate runs count
            const passRateCountEl = document.getElementById('passrate-runs-count');
            if (passRateCountEl) {
                passRateCountEl.textContent = '(' + passRateData.length + ' runs)';
            }

            // Update Distribution chart
            const distributionData = filteredRuns.slice(0, 30).reverse();
            const distributionLabels = distributionData.map(r => {
                const date = new Date(r.timestamp);
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return [month + '/' + day + '/' + year, hours + ':' + minutes];
            });

            distributionChart.data.labels = distributionLabels;
            distributionChart.data.datasets[0].data = distributionData.map(r => r.passed);
            distributionChart.data.datasets[1].data = distributionData.map(r => r.failed);
            distributionChart.data.datasets[2].data = distributionData.map(r => r.flaky);
            distributionChart.data.datasets[3].data = distributionData.map(r => r.skipped);
            currentDistributionTimestamps = distributionData.map(r => r.timestamp);
            distributionChart.update();

            // Update Distribution runs count
            const distributionCountEl = document.getElementById('distribution-runs-count');
            if (distributionCountEl) {
                distributionCountEl.textContent = '(' + distributionData.length + ' runs)';
            }

            // Update Recent Runs table
            const recentRunsData = filteredRuns.slice(0, 20);
            updateRecentRunsTable(recentRunsData);

            // Update Recent Runs count
            const recentRunsCountEl = document.getElementById('recent-runs-count');
            if (recentRunsCountEl) {
                recentRunsCountEl.textContent = '(' + recentRunsData.length + ' runs)';
            }
        }

        function updateRecentRunsTable(runs) {
            const tbody = document.querySelector('.summary-section table tbody');
            if (!tbody) return;

            tbody.innerHTML = runs.map(run => {
                const date = new Date(run.timestamp);
                const dateStr = date.toLocaleString();
                const duration = formatDuration(run.duration);
                const passRateColor = run.passRate >= 95 ? 'var(--color-passed)' : run.passRate >= 80 ? 'var(--color-flaky)' : 'var(--color-failed)';

                return '<tr>' +
                    '<td>' + dateStr + '</td>' +
                    '<td style="color: ' + passRateColor + '; font-weight: 600;">' + run.passRate + '%</td>' +
                    '<td>' +
                        '<span style="color: var(--color-passed);">✓ ' + run.passed + '</span>' +
                        '<span style="color: var(--color-failed); margin-left: 0.5rem;">✗ ' + run.failed + '</span>' +
                        (run.flaky > 0 ? '<span style="color: var(--color-flaky); margin-left: 0.5rem;">~ ' + run.flaky + '</span>' : '') +
                        '<span style="color: var(--color-skipped); margin-left: 0.5rem;">○ ' + run.skipped + '</span>' +
                    '</td>' +
                    '<td>' + duration + '</td>' +
                '</tr>';
            }).join('');
        }

        function filterActivityStream(limit) {
            // Update active button
            document.querySelectorAll('[data-activity-filter]').forEach(btn => {
                btn.classList.remove('active');
            });
            const selector = limit === 0 ? '[data-activity-filter="all"]' : '[data-activity-filter="' + limit + '"]';
            document.querySelector(selector).classList.add('active');

            // Get all rows and show/hide based on limit
            const tbody = document.querySelector('#activity-stream-table tbody');
            if (!tbody) return;

            const allRows = tbody.querySelectorAll('tr');
            const displayLimit = limit === 0 ? allRows.length : limit;

            let visibleCount = 0;
            allRows.forEach((row, index) => {
                if (index < displayLimit) {
                    row.style.display = 'table-row';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });

            // Update count with actual visible rows
            const countEl = document.getElementById('recent-runs-count');
            if (countEl) {
                const displayText = limit === 0 ? 'All ' + visibleCount : visibleCount;
                countEl.textContent = '(' + displayText + ' runs)';
            }
        }

        // Initialize Activity Stream on page load
        document.addEventListener('DOMContentLoaded', function() {
            filterActivityStream(20);
        });

        function formatDuration(ms) {
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);

            if (hours > 0) {
                return hours + 'h ' + (minutes % 60) + 'm';
            } else if (minutes > 0) {
                return minutes + 'm ' + (seconds % 60) + 's';
            } else {
                return seconds + 's';
            }
        }

        function toggleFlakyTestsSection() {
            const content = document.getElementById('flaky-tests-content');
            const hint = document.getElementById('flaky-tests-hint');
            const icon = document.getElementById('flaky-tests-expand-icon');

            if (content.style.display === 'none') {
                content.style.display = 'block';
                hint.style.display = 'none';
                icon.style.transform = 'rotate(180deg)';
            } else {
                content.style.display = 'none';
                hint.style.display = 'block';
                icon.style.transform = 'rotate(0deg)';
            }
        }
    </script>`;
  }

  private preparePassRateData(history: RunHistory) {
    const runs = history.runs.slice(0, 30).reverse();

    return {
      labels: runs.map(run => {
        const date = new Date(run.timestamp);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return [`${month}/${day}/${year}`, `${hours}:${minutes}`];
      }),
      datasets: [{
        label: 'Pass Rate %',
        data: runs.map(run => run.passRate),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true,
      }]
    };
  }

  private prepareDistributionData(history: RunHistory) {
    const runs = history.runs.slice(0, 30).reverse();

    return {
      labels: runs.map(run => {
        const date = new Date(run.timestamp);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return [`${month}/${day}/${year}`, `${hours}:${minutes}`];
      }),
      datasets: [
        {
          label: 'Passed',
          data: runs.map(run => run.passed),
          backgroundColor: '#10b981',
        },
        {
          label: 'Failed',
          data: runs.map(run => run.failed),
          backgroundColor: '#ef4444',
        },
        {
          label: 'Flaky',
          data: runs.map(run => run.flaky),
          backgroundColor: '#f59e0b',
        },
        {
          label: 'Skipped',
          data: runs.map(run => run.skipped),
          backgroundColor: '#6b7280',
        }
      ]
    };
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
