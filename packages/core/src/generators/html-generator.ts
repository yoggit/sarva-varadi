import { SarvaTestResult, RunMetadata, SarvaReporterOptions } from '../types';
import { AssetsLoader } from './assets-loader';

export class HTMLGenerator {
  constructor(private options: Required<SarvaReporterOptions>) {}

  generate(tests: SarvaTestResult[], metadata: RunMetadata): string {
    const stats = this.calculateStats(tests);
    const styles = AssetsLoader.getStyles();
    const scripts = AssetsLoader.getScripts();
    const toolName = this.getToolName(tests);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sarva-Varadi → Latest</title>
    <style>${styles}</style>
</head>
<body>
    <div class="container">
        ${this.generateHeader(stats, metadata, toolName)}
        ${this.generateSummary(stats)}
        ${this.generateRetriesSection(tests, stats)}
        ${this.generateTestList(tests)}
    </div>
    <script>${scripts}</script>
</body>
</html>`;
  }

  private calculateStats(tests: SarvaTestResult[]) {
    // Group tests by unique identifier (fullName) and take only the final result
    const uniqueTests = new Map<string, SarvaTestResult>();

    tests.forEach(test => {
      const key = test.fullName;
      const existing = uniqueTests.get(key);

      // Keep the test with the latest/final status (later in the array = final attempt)
      if (!existing || test.start >= existing.start) {
        uniqueTests.set(key, test);
      }
    });

    const finalTests = Array.from(uniqueTests.values());
    const totalRetries = tests.length - finalTests.length;

    return {
      total: finalTests.length,
      passed: finalTests.filter(t => t.status === 'passed').length,
      failed: finalTests.filter(t => t.status === 'failed' || t.status === 'broken').length,
      flaky: finalTests.filter(t => t.status === 'flaky').length,
      skipped: finalTests.filter(t => t.status === 'skipped').length,
      retries: totalRetries,
    };
  }

  private getToolName(tests: SarvaTestResult[]): string {
    if (tests.length === 0) return '';
    const tool = tests[0].tool;
    const toolNames: Record<string, string> = {
      'playwright': 'Playwright',
      'selenium': 'Selenium',
      'cypress': 'Cypress',
      'rest-assured': 'RestAssured'
    };
    return toolNames[tool] || tool;
  }

  private generateHeader(stats: any, metadata: RunMetadata, toolName: string): string {
    const statusClass = stats.failed > 0 ? 'failed' : stats.flaky > 0 ? 'flaky' : 'passed';
    const titleText = toolName ? `Sarva-Varadi → ${toolName} Report` : this.options.title;

    return `
    <header class="header">
        <div class="header-content">
            <div class="header-left">
                <h1 class="title">
                    <img src="./logo.svg" alt="Sarva-Varadi" class="logo" style="height: 60px; width: auto;">
                    <span class="title-text">${titleText}</span>
                </h1>
                <div class="nav-tabs" style="margin-top: 0.5rem;">
                    <a href="index.html" class="nav-tab active">Latest Run</a>
                    <a href="trends.html" class="nav-tab">Trends →</a>
                </div>
            </div>
            <div class="header-right" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="theme-toggle">
                        <input type="checkbox" id="themeToggle" class="theme-toggle-checkbox">
                        <label for="themeToggle" class="theme-toggle-label">
                            <span class="theme-toggle-icon">🌙</span>
                            <span class="theme-toggle-icon">☀️</span>
                        </label>
                    </div>
                    <div class="subtitle">
                        Last Run on <span id="timestamp" data-time="${new Date(metadata.timestamp).toISOString()}"></span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="status-badge status-${statusClass}">
                        ${statusClass.toUpperCase()}
                    </div>
                    <div class="duration">
                        ⏱️ ${this.formatDuration(metadata.duration)}
                    </div>
                </div>
            </div>
        </div>
    </header>`;
  }

  private generateSummary(stats: any): string {
    const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;

    return `
    <section class="summary-and-filters">
        <div class="summary-section">
            <h2 class="section-header">Summary</h2>
            <div class="summary-cards">
                <div class="summary-card card-total">
                    <div class="card-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                        </svg>
                    </div>
                    <div class="card-content">
                        <div class="card-value">${stats.total}</div>
                        <div class="card-label">Total Tests</div>
                    </div>
                </div>

                <div class="summary-card card-passed">
                    <div class="card-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9 12l2 2 4-4"></path>
                        </svg>
                    </div>
                    <div class="card-content">
                        <div class="card-value">${stats.passed}</div>
                        <div class="card-label">Passed</div>
                    </div>
                </div>

                <div class="summary-card card-failed">
                    <div class="card-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                    </div>
                    <div class="card-content">
                        <div class="card-value">${stats.failed}</div>
                        <div class="card-label">Failed</div>
                    </div>
                </div>

                <div class="summary-card card-flaky">
                    <div class="card-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                    <div class="card-content">
                        <div class="card-value">${stats.flaky}</div>
                        <div class="card-label">Flaky</div>
                    </div>
                </div>

                <div class="summary-card card-skipped">
                    <div class="card-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                    </div>
                    <div class="card-content">
                        <div class="card-value">${stats.skipped}</div>
                        <div class="card-label">Skipped</div>
                    </div>
                </div>

                <div class="summary-card card-rate">
                    <div class="card-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                    </div>
                    <div class="card-content">
                        <div class="card-value">${passRate}%
                            <span class="info-tooltip" style="position: relative; display: inline-flex; cursor: help; margin-left: 0.25rem; vertical-align: super; font-size: 0.5em;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <circle cx="12" cy="8" r="1" fill="#d97706"></circle>
                                </svg>
                                <span class="tooltip-text">Pass Rate = (Passed Tests ÷ Total Tests) × 100. Calculated based on final test status after retries.</span>
                            </span>
                        </div>
                        <div class="card-label">Pass Rate</div>
                    </div>
                </div>
            </div>

            <div class="progress-bar">
                <div class="progress-fill" style="width: ${passRate}%"></div>
            </div>
        </div>

        <div class="filters-section">
            <div class="search-box">
                <input type="text" id="searchInput" class="search-input" placeholder="🔎 Search tests...">
            </div>
            <div class="filter-buttons">
                <button class="filter-btn active" data-filter="all">All</button>
                <button class="filter-btn" data-filter="passed">Passed</button>
                <button class="filter-btn" data-filter="failed">Failed</button>
                <button class="filter-btn" data-filter="flaky">Flaky</button>
                <button class="filter-btn" data-filter="skipped">Skipped</button>
            </div>
            <div class="expand-collapse-controls">
                <button class="control-btn" onclick="expandAll()">▼ Expand All</button>
                <button class="control-btn" onclick="collapseAll()">▲ Collapse All</button>
            </div>
        </div>
    </section>`;
  }

  private generateRetriesSection(tests: SarvaTestResult[], stats: any): string {
    if (stats.retries === 0) return '';

    const retriedTests = tests.filter(t => t.extra?.playwright?.retries && t.extra.playwright.retries > 0);

    if (retriedTests.length === 0) return '';

    const retriedItems = retriedTests.map(test => {
      const browserName = this.getBrowserName(test);
      const testTitle = browserName ? `${test.name} - ${browserName}` : test.name;
      const retryCount = test.extra?.playwright?.retries || 0;
      return `
        <div style="padding: 0.5rem 0; border-bottom: 1px solid var(--color-border);">
          <span style="font-weight: 500;">${this.escapeHtml(testTitle)}</span>
          <span style="margin-left: 1rem; color: var(--color-text-secondary);">
            🔄 ${retryCount} ${retryCount === 1 ? 'retry' : 'retries'}
          </span>
        </div>`;
    }).join('');

    return `
    <section class="summary-and-filters" style="margin-top: 1rem;">
        <div class="summary-section" style="padding: 0.5rem 1rem;">
            <h2 class="section-header" style="display: flex; align-items: center; cursor: pointer; margin: 0; padding: 0.5rem 0;" onclick="toggleRetriesSection()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
                </svg>
                Retried Tests (${retriedTests.length})
                <span class="info-tooltip" style="position: relative; display: inline-flex; cursor: help; margin-left: 0.25rem; vertical-align: super; font-size: 0.7em;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <circle cx="12" cy="8" r="1" fill="#d97706"></circle>
                    </svg>
                    <span class="tooltip-text">Tests that failed initially and were automatically retried. Shows the number of retry attempts for each test.</span>
                </span>
                <span id="retries-hint" style="margin-left: 1rem; color: #f59e0b; font-style: italic; font-size: 0.9rem; font-weight: normal;">
                    Click to expand and see details
                </span>
                <span id="retries-expand-icon" style="margin-left: auto; font-size: 1.2rem;">▼</span>
            </h2>
            <div id="retries-content" style="padding: 1rem; display: none;">
                ${retriedItems}
            </div>
        </div>
    </section>`;
  }

  private groupTestsByName(tests: SarvaTestResult[]): Map<string, SarvaTestResult[]> {
    const grouped = new Map<string, SarvaTestResult[]>();

    tests.forEach(test => {
      const key = test.name; // Group by test name (without browser suffix)
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(test);
    });

    return grouped;
  }

  private getWorstStatus(tests: SarvaTestResult[]): string {
    // Priority: failed > flaky > skipped > passed
    if (tests.some(t => t.status === 'failed' || t.status === 'broken')) return 'failed';
    if (tests.some(t => t.status === 'flaky')) return 'flaky';
    if (tests.some(t => t.status === 'skipped')) return 'skipped';
    return 'passed';
  }

  private generateTestList(tests: SarvaTestResult[]): string {
    const grouped = this.groupTestsByName(tests);
    const groupedItems: string[] = [];

    grouped.forEach((browserTests, testName) => {
      // If only one browser/variant, show as single item
      if (browserTests.length === 1) {
        groupedItems.push(this.generateTestItem(browserTests[0]));
      } else {
        // Multiple browsers - show as grouped item
        groupedItems.push(this.generateGroupedTestItem(testName, browserTests));
      }
    });

    return `
    <section class="tests-section">
        <div class="tests-list">
            ${groupedItems.join('')}
        </div>
    </section>`;
  }

  private generateGroupedTestItem(testName: string, browserTests: SarvaTestResult[]): string {
    const worstStatus = this.getWorstStatus(browserTests);
    const statusIcon = this.getStatusIcon(worstStatus);
    const groupId = `group-${browserTests[0].uuid}`;
    const totalDuration = browserTests.reduce((sum, t) => sum + t.duration, 0);
    const toolBadge = this.getToolBadge(browserTests[0].tool);

    // Generate browser badges with status
    const browserBadges = browserTests.map(test => {
      const browser = this.getBrowserName(test) || 'unknown';
      const statusColor = test.status === 'passed' ? 'var(--color-passed)' :
                         test.status === 'failed' || test.status === 'broken' ? 'var(--color-failed)' :
                         test.status === 'flaky' ? 'var(--color-flaky)' :
                         'var(--color-skipped)';
      return `<span class="browser-badge" style="background: ${statusColor}; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-right: 0.25rem;">${browser}</span>`;
    }).join('');

    const browserItems = browserTests.map(test => this.generateBrowserTestItem(test)).join('');

    return `
    <div class="test-item test-group" data-status="${worstStatus}" data-all-statuses="${browserTests.map(t => t.status).join(' ')}" data-testid="${groupId}">
        <div class="test-header" onclick="toggleTest('${groupId}')">
            <div class="test-header-left">
                <span class="status-icon status-${worstStatus}">${statusIcon}</span>
                <div class="test-info">
                    <div class="test-title">${this.escapeHtml(testName)}${toolBadge}</div>
                    <div class="test-meta">
                        <span class="test-location">📁 ${this.escapeHtml(browserTests[0].fullName)}</span>
                        <span style="margin-left: 1rem;">${browserBadges}</span>
                    </div>
                </div>
            </div>
            <div class="test-header-right">
                <span class="test-duration">⏱️ ${this.formatDuration(totalDuration)}</span>
                <span class="expand-icon">▼</span>
            </div>
        </div>

        <div class="test-details" id="details-${groupId}">
            <div class="test-details-content">
                <div class="browser-results">
                    ${browserItems}
                </div>
            </div>
        </div>
    </div>`;
  }

  private generateBrowserTestItem(test: SarvaTestResult): string {
    const statusIcon = this.getStatusIcon(test.status);
    const browserName = this.getBrowserName(test) || 'unknown';

    return `
    <div class="browser-test-item" data-testid="${test.uuid}" style="margin-bottom: 1rem; border-left: 3px solid var(--color-${test.status}); padding-left: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border);">
        <div class="test-header" style="cursor: pointer;" onclick="toggleBrowserTest('${test.uuid}')">
            <div class="test-header-left">
                <span class="status-icon status-${test.status}">${statusIcon}</span>
                <div class="test-info">
                    <div class="test-title" style="font-weight: 500;">${browserName}</div>
                    <div class="test-meta">
                        <span class="test-duration">⏱️ ${this.formatDuration(test.duration)}</span>
                        ${test.extra?.playwright?.retries && test.extra.playwright.retries > 0 ? `<span class="test-retries" style="margin-left: 1rem;">🔄 ${test.extra.playwright.retries} ${test.extra.playwright.retries === 1 ? 'retry' : 'retries'}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="test-header-right">
                <span class="expand-icon browser-expand-icon-${test.uuid}">▼</span>
            </div>
        </div>
        <div class="browser-test-details" id="browser-details-${test.uuid}" style="display: none; margin-top: 1rem;">
            ${this.generateTestDetails(test)}
        </div>
    </div>`;
  }

  private generateTestItem(test: SarvaTestResult): string {
    const statusIcon = this.getStatusIcon(test.status);
    const toolBadge = this.getToolBadge(test.tool);
    const browserName = this.getBrowserName(test);
    const testTitle = browserName ? `${test.name} - ${browserName}` : test.name;

    return `
    <div class="test-item" data-status="${test.status}" data-testid="${test.uuid}">
        <div class="test-header" onclick="toggleTest('${test.uuid}')">
            <div class="test-header-left">
                <span class="status-icon status-${test.status}">${statusIcon}</span>
                <div class="test-info">
                    <div class="test-title">${this.escapeHtml(testTitle)}${toolBadge}</div>
                    <div class="test-meta">
                        <span class="test-location">📁 ${this.escapeHtml(test.fullName)}</span>
                        ${test.extra?.playwright?.retries && test.extra.playwright.retries > 0 ? `<span class="test-retries">🔄 ${test.extra.playwright.retries} ${test.extra.playwright.retries === 1 ? 'retry' : 'retries'}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="test-header-right">
                <span class="test-duration">⏱️ ${this.formatDuration(test.duration)}</span>
                <span class="expand-icon">▼</span>
            </div>
        </div>

        <div class="test-details" id="details-${test.uuid}">
            ${this.generateTestDetails(test)}
        </div>
    </div>`;
  }

  private generateTestDetails(test: SarvaTestResult): string {
    let html = '<div class="test-details-content">';

    // Test Steps section
    if (test.steps && test.steps.length > 0) {
      html += `
        <div class="details-section steps-section">
            <h3 class="section-title">📋 Test Steps</h3>
            <div class="steps-list">
                ${this.generateSteps(test.steps)}
            </div>
        </div>`;
    }

    // Error section
    if (test.statusDetails) {
      html += `
        <div class="details-section error-section">
            <h3 class="section-title">❌ Error</h3>
            <div class="error-message">${this.escapeHtml(test.statusDetails.message || '')}</div>
            ${this.options.showStackTrace && test.statusDetails.trace ? `
                <details class="stack-trace">
                    <summary>Stack Trace</summary>
                    <pre>${this.escapeHtml(test.statusDetails.trace)}</pre>
                </details>
            ` : ''}
        </div>`;
    }

    // Attachments section
    if (test.attachments && test.attachments.length > 0) {
      html += `
        <div class="details-section attachments-section">
            <h3 class="section-title">📎 Attachments</h3>
            <div class="attachments-grid">
                ${this.generateAttachments(test.attachments)}
            </div>
        </div>`;
    }

    // Tool-specific section
    html += this.generateToolSpecificSection(test);

    html += '</div>';
    return html;
  }

  private generateSteps(steps: any[], level: number = 0): string {
    return steps.map(step => {
      let html = `
        <div class="step-item" style="margin-left: ${level * 20}px;">
            <div class="step-header">
                <span class="step-status status-${step.status}">${this.getStatusIcon(step.status)}</span>
                <span class="step-title">${this.escapeHtml(step.name)}</span>
                <span class="step-duration">${this.formatDuration(step.duration)}</span>
            </div>`;

      // Add status details message if present (for Headers/Body content)
      if (step.statusDetails && step.statusDetails.message) {
        html += `
            <div class="step-details" style="margin-left: 20px; margin-top: 8px; padding: 8px; background: rgba(100,100,100,0.1); border-radius: 4px; font-family: monospace; font-size: 0.85em; white-space: pre-wrap;">
                ${this.escapeHtml(step.statusDetails.message)}
            </div>`;
      }

      // Recursively render nested steps
      if (step.steps && step.steps.length > 0) {
        html += this.generateSteps(step.steps, level + 1);
      }

      html += `
        </div>`;

      return html;
    }).join('');
  }

  private generateAttachments(attachments: any[]): string {
    return attachments.map(att => {
      const isImage = att.type?.startsWith('image/') ||
                     att.contentType?.startsWith('image/') ||
                     att.name?.match(/\.(png|jpg|jpeg|gif|webp)$/i);

      const isVideo = att.type?.startsWith('video/') ||
                     att.contentType?.startsWith('video/') ||
                     att.name?.match(/\.(mp4|webm|mov)$/i);

      if (isImage) {
        return `<div class="attachment-item">
            <a href="${att.source}" target="_blank" title="Click to open in new tab">
                <img src="${att.source}" alt="${att.name}" class="attachment-image">
            </a>
            <div class="attachment-name">${att.name}</div>
        </div>`;
      } else if (isVideo) {
        return `<div class="attachment-item">
            <video src="${att.source}" controls class="attachment-video"></video>
            <div class="attachment-name">${att.name}</div>
        </div>`;
      } else if (att.name.includes('trace')) {
        return `<div class="attachment-item">
            <a href="https://trace.playwright.dev/?trace=${att.source}" target="_blank" class="attachment-link">
                🔍 View Trace
            </a>
            <div class="attachment-name">${att.name}</div>
        </div>`;
      }
      return `<div class="attachment-item">
          <a href="${att.source}" target="_blank" class="attachment-link">${att.name}</a>
      </div>`;
    }).join('');
  }

  private generateToolSpecificSection(test: SarvaTestResult): string {
    if (test.tool === 'playwright' && test.extra?.playwright) {
      const pw = test.extra.playwright;
      return `
        <div class="details-section tool-specific-section">
            <h3 class="section-title">🎭 Playwright Details</h3>
            <div class="tool-info">
                ${pw.browser ? `<div><strong>Browser:</strong> ${pw.browser}</div>` : ''}
                ${pw.project ? `<div><strong>Project:</strong> ${pw.project}</div>` : ''}
            </div>
        </div>`;
    }
    return '';
  }

  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      passed: '✓',
      failed: '✗',
      broken: '✗',
      skipped: '○',
      flaky: '~',
    };
    return icons[status] || '?';
  }

  private getBrowserName(test: SarvaTestResult): string | null {
    if (test.extra?.playwright?.browser) {
      return test.extra.playwright.browser;
    }
    if (test.extra?.selenium?.browserName) {
      return test.extra.selenium.browserName;
    }
    return null;
  }

  private getToolBadge(tool: string): string {
    const colors: Record<string, string> = {
      playwright: '#2EAD33',
      selenium: '#43B02A',
      cypress: '#17202C',
      'rest-assured': '#5B9BD5',
    };

    return `<span class="tool-badge" style="background: ${colors[tool] || '#666'}; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; color: white; margin-left: 0.5rem;">${tool}</span>`;
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const seconds = (ms / 1000).toFixed(2);
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
