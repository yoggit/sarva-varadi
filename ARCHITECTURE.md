# Sarva-Varadi Architecture

## Overview

Sarva-Varadi is a universal test reporter that supports multiple testing frameworks (Playwright, Selenium, RestAssured, and more coming) with a unified, beautiful UI and historical trend analysis.

## Design Principles

1. **Framework Agnostic** - Common data model across all tools
2. **File-Based** - No database or server requirements
3. **Modular** - Users install only what they need
4. **Beautiful** - Modern UI inherited from Varadi
5. **CI/CD Friendly** - Static HTML reports, easy artifact uploads
6. **Historical Context** - Track trends and detect flaky tests

## Two-Phase Execution Model

### Phase 1: Data Collection (During Test Execution)

Each framework adapter listens to test execution events and converts them to the common `SarvaTestResult` format:

```
Playwright Test  → Playwright Adapter  → SarvaTestResult JSON
Selenium Test    → Selenium Adapter    → SarvaTestResult JSON
RestAssured Test → RestAssured Adapter → SarvaTestResult JSON
```

**Output**: `sarva-varadi-results/*.json` (one file per test or suite)

### Phase 2: Report Generation (After Test Execution)

The core generator processes all JSON files and creates:
1. **Current run report** (`index.html`) - Latest execution results
2. **Trends dashboard** (`trends.html`) - Historical analysis
3. **History archive** - Stores run data for trend calculation

```
JSON Files → Report Generator → {
  index.html,
  trends.html,
  attachments/,
  history/runs.json
}
```

## Data Model

### Common Test Result Schema

```typescript
interface SarvaTestResult {
  uuid: string;                    // Unique test identifier
  tool: TestTool;                  // 'playwright' | 'selenium' | etc.
  name: string;                    // Test name
  fullName: string;                // Full path (suite > test)
  status: TestStatus;              // 'passed' | 'failed' | 'skipped' | 'flaky'
  start: number;                   // Unix timestamp (ms)
  stop: number;                    // Unix timestamp (ms)
  duration: number;                // Duration in ms
  
  steps: TestStep[];               // Test steps
  attachments: Attachment[];       // Screenshots, videos, traces
  
  statusDetails?: {                // Error information
    message?: string;
    trace?: string;
  };
  
  extra?: ToolSpecificData;        // Framework-specific metadata
}
```

### Historical Data Schema

```typescript
interface RunHistory {
  runs: RunSummary[];              // List of all runs
  testHistory: TestTrendData[];    // Per-test trend tracking
}

interface RunSummary {
  id: string;                      // "2026-05-09-143022"
  timestamp: number;               // Unix timestamp
  total: number;                   // Total tests
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  passRate: number;                // 85.5%
}

interface TestTrendData {
  testId: string;                  // "playwright:login.spec.ts>Login test"
  testName: string;
  history: TestRunOutcome[];       // Last 10 runs
  flakyScore: number;              // 0-100
  lastStatus: 'passed' | 'failed' | 'skipped';
}
```

## File Structure

```
sarva-report/
├── index.html                     # Latest run report (View 1)
├── trends.html                    # Historical trends (View 2)
├── attachments/                   # Media files
│   ├── screenshot-1.png
│   ├── video-1.webm
│   └── trace-1.zip
└── history/                       # Historical data
    ├── runs.json                 # Aggregated run metadata
    ├── 2026-05-09-143022/        # Archived run
    │   ├── data.json            # Full test results
    │   └── attachments/         # (optional) archived media
    └── 2026-05-08-091530/
        └── data.json
```

## Adapter Architecture

### Base Adapter

All framework adapters extend `BaseAdapter`:

```typescript
abstract class BaseAdapter {
  abstract adaptTest(testData: any): SarvaTestResult;
  abstract adaptStep?(stepData: any): TestStep;
  abstract adaptAttachment?(attachmentData: any): Attachment;
}
```

### Framework-Specific Adapters

#### Playwright Adapter
- Implements Playwright's `Reporter` interface
- Listens to `onTestEnd`, `onStepEnd`, etc.
- Converts Playwright's `TestResult` → `SarvaTestResult`
- Handles trace files, videos, screenshots

#### Selenium Adapter (✅ Implemented)
- Implements TestNG `ITestListener`
- Captures WebDriver actions via `WebDriverListener`
- Browser information (Chrome, Firefox, Edge)
- Screenshots on failure
- Converts TestNG results → `SarvaTestResult`
- Handles flaky test detection with retry analyzer

#### RestAssured Adapter (✅ Implemented)
- Hooks into RestAssured filters via `RestAssuredRequestCapture`
- Captures full request/response data (method, URL, headers, body)
- Hierarchical test steps with parent-child structure
- Sensitive data masking (opt-in)
- Converts TestNG listener data → `SarvaTestResult`
- Works with any TestNG-based API tests

#### Cypress Adapter (🚧 Future)
- Uses Cypress reporter API
- Handles time-travel debugging data
- Converts Cypress results → `SarvaTestResult`
- Screenshots and videos
- DOM snapshots

## History Management

### Data Collection

On each test run:
1. Generate `RunSummary` from current results
2. Archive current run to `history/<run-id>/`
3. Update `runs.json` with new summary
4. Update per-test history in `testHistory[]`

### Flaky Score Calculation

```typescript
flakyScore = (statusChangeRate * 100) + (avgRetries * 20)
```

- **Status Change Rate**: How often test status flips (pass ↔ fail)
- **Retry Rate**: Average retries per run
- **Range**: 0-100 (capped)

**Example**:
- Test runs: ✅ ❌ ✅ ✅ ❌ ✅ ❌ ✅ ✅ ✅
- Status changes: 6 out of 9 transitions = 67%
- Average retries: 1.2 per run = 24 points
- **Flaky Score**: 67 + 24 = 91 (highly flaky ⚠️)

### Automatic Cleanup

Two cleanup strategies:
1. **maxRuns**: Keep only last N runs (default: 30)
2. **retentionDays**: Delete runs older than N days (default: 90)

Cleanup runs automatically after each test execution.

## Report Generation

### View 1: Latest Run (`index.html`)

**Components**:
- Header with logo, title, theme toggle
- Navigation: [Latest Run] [Trends →] buttons
- Mini-trend widget (last 7 runs line chart)
- Summary cards (passed/failed/skipped/flaky counts)
- Search and filter controls
- Test list with expandable details
- Attachments viewer (screenshots, videos, traces)

**Technology**:
- Self-contained HTML with embedded CSS/JS
- Chart.js for mini-trend visualization
- Vanilla JS for interactivity (no frameworks)

### View 2: Trends Dashboard (`trends.html`)

**Components**:
- Header with navigation: [← Latest Run] [Trends] buttons
- Pass rate over time (line chart)
- Test distribution per run (stacked bar chart)
- Flakiest tests ranking (top 10 with scores)
- Recent runs table with clickable links
- Per-test history modal (show individual test trend)

**Technology**:
- Chart.js for visualizations
- Data loaded from `history/runs.json`
- Responsive design with CSS Grid

## Package Structure

### Monorepo Layout

```
sarva-varadi/
├── packages/
│   ├── core/                      # @sarva-varadi/core
│   ├── playwright/                # @sarva-varadi/playwright ✅
│   ├── selenium/                  # @sarva-varadi/selenium ✅
│   ├── rest-assured/              # @sarva-varadi/rest-assured ✅
│   └── cypress/                   # @sarva-varadi/cypress 🚧 (future)
├── demo-playwright/
├── demo-selenium/
├── demo-restassured/
└── docs/
```

### Installation Patterns

**Playwright users**:
```bash
npm install --save-dev @sarva-varadi/core @sarva-varadi/playwright
```

**Selenium users** (Maven):
```xml
<dependency>
    <groupId>io.github.yoggit</groupId>
    <artifactId>sarva-varadi-core</artifactId>
</dependency>
<dependency>
    <groupId>io.github.yoggit</groupId>
    <artifactId>sarva-varadi-selenium</artifactId>
</dependency>
```

## Tool-Specific Capabilities

### Framework Detection

The HTML report detects the test tool from `test.tool` field and shows/hides relevant sections:

**Playwright-specific**:
- Trace viewer links (trace.playwright.dev)
- Retry count badges
- Browser name/version

**Selenium-specific** (✅ Implemented):
- WebDriver action logs (clicks, navigation, form inputs)
- Browser + platform info (Chrome, Firefox, Edge)
- Screenshots on failure
- Selenium version

**RestAssured-specific** (✅ Implemented):
- Request/response JSON viewers
- HTTP method + endpoint (GET, POST, PUT, etc.)
- Status code badges
- Request/response headers
- Hierarchical test steps

**Cypress-specific** (🚧 Future):
- Time-travel debugging links
- Spec file references
- DOM snapshots

## Configuration

```typescript
{
  outputFolder: 'sarva-report',
  title: 'My Test Report',
  
  // History tracking
  history: {
    enabled: true,
    maxRuns: 30,
    retentionDays: 90,
    trackPerTest: true,
  },
  
  // Trends visualization
  trends: {
    enabled: true,
    showInMainReport: true,  // Mini-trend widget
  },
}
```

## Future Enhancements (Phase 3+)

### CLI Tool
```bash
# Generate report from existing data
npx sarva generate sarva-varadi-results/ -o sarva-report/

# Merge parallel execution results
npx sarva merge shard-1/results shard-2/results -o merged-report/

# Compare two runs
npx sarva compare run-1/ run-2/ -o comparison-report/
```

### Real-Time Reporting
- WebSocket-based live updates
- Progress bar during execution
- Optional local server mode

### Cloud Sync (Opt-in)
- Upload reports to S3/Azure/GCS
- Share public links
- Retain history in cloud storage

### Advanced Analytics
- Test duration trends per test
- Slowest tests identification
- CI/CD pipeline integration metrics
- Cost analysis (execution time × worker cost)

## Performance Considerations

- **Large test suites**: JSON files are small (~1-5KB per test)
- **History storage**: Configurable retention limits
- **Report generation**: < 2 seconds for 1000 tests
- **Browser rendering**: Lazy-load test details on expand
- **Attachments**: Store separately, load on demand

## Comparison Matrix

| Aspect | Allure | ReportPortal | Sarva-Varadi |
|--------|--------|--------------|--------------|
| Architecture | Two-phase | Real-time + DB | Two-phase |
| Storage | Files | PostgreSQL | Files |
| Setup | Java CLI | Docker stack | npm install |
| Frameworks | 30+ | Many | 4+ (growing) |
| UI Modern | ⚠️ | ⚠️ | ✅ |
| Flaky Detection | Manual | ML-based | Score-based |
| Historical | Basic | Advanced | File-based |
| CI/CD | ✅ | Complex | ✅ |

## Summary

Sarva-Varadi provides:
- **Lightweight** universal reporter (no servers, no databases)
- **Beautiful** modern UI with dark/light themes
- **Historical** trend tracking with flaky test detection
- **Modular** installation (install only what you need)
- **Framework agnostic** with consistent experience
- **CI/CD friendly** static HTML artifacts
