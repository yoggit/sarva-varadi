# The 6 Report Sections

Every Sarva-Varadi report is a single `index.html` — a sidebar SPA with six tabs. Open it in any browser, no server needed.

[[toc]]

---

## 1. Overview

The default landing tab when you open the report.

| Widget | What it shows |
|--------|---------------|
| **Stat cards** | Total / Passed / Failed / Flaky / Skipped counts with trend arrows vs. previous run |
| **Pass rate donut** | Visual pass rate with centre count |
| **Health Pulse** | Rolling pass rate sparkline across the last N runs — rising = improving, flat at 100% = stable |
| **Needs Attention** | Auto-shown strip when failures exceed 10% or flaky count is high |
| **New Tests** | Tests that appeared for the first time this run (hidden when empty) |
| **Absent Tests** | Tests present in the previous run but missing now (hidden when empty) |
| **Top Failing** | Ranked list of most frequently failing tests across history |
| **Top Flaky** | Ranked list of tests with highest flaky score |
| **Run metadata** | Timestamp, tool, framework, environment badge |

---

## 2. Failures

Dedicated failures view for fast triage without scrolling through the full test list.

| Section | Content |
|---------|---------|
| **Newly Failing** | Tests that passed last run but failed this run |
| **Recently Fixed** | Tests that failed last run but passed this run |
| **All Failures** | Every failed and flaky test ranked by severity label |

Severity levels: `critical` → `high` → `medium` → `low` → unlabelled.

---

## 3. Tests

Full test list with filter, search, sort, and per-test detail.

**List features:**
- Filter by status (passed / failed / flaky / skipped / all)
- Free-text search (matches test name)
- Sort by name, duration, or status
- CSV export button

**Test detail drawer** — click any test to open:
- Full step tree with collapsible nodes
- BDD hierarchy: Feature → Scenario → Step (Cucumber)
- HTTP sub-steps: method, URL, status, request/response (RestAssured)
- WebDriver sub-steps (Selenium)
- Error message + stack trace (collapsible)
- Attachments: screenshots, videos, traces (embedded)
- Per-test history chart: last 25 runs, colour-coded by outcome

---

## 4. Trends

Six ECharts charts across historical runs — oldest left, newest right.

| Chart | What it shows |
|-------|---------------|
| **Pass Rate Trend** | % passed per run with rolling average dashed line |
| **Failures & Flakiness** | Failed + flaky counts per run (stacked bars) |
| **Failures by Severity** | Stacked bars split by severity label — only shown when `@severity` tags are present |
| **Test Count Over Time** | Stacked area: passed / failed / flaky / skipped per run |
| **Run Duration Trend** | Seconds per run with rolling average |
| **Top Failing Tests** | Horizontal bar chart ranked by failure count |
| **Top Flaky Tests** | Horizontal bar chart ranked by flakiness rate |

All charts share a **run-count filter** (Last 10 / 20 / 50 / All runs) at the top of the tab.

When a historical run is active ([Run History](./run-history)), charts auto-center a window on the selected run and show a dashed marker at its position.

---

## 5. Timeline

Two charts about *when* things ran:

| Chart | What it shows |
|-------|---------------|
| **Run Cadence** | Bar chart of runs over time — spot gaps, clusters, CI frequency |
| **Execution Gantt** | Horizontal timeline of every test — start time, duration, and outcome colour-coded |

The Gantt is useful for identifying which tests take longest and whether parallelism is working as expected.

---

## 6. Run History

→ [Detailed guide](./run-history)

Filterable table of every historical run. Click any row to re-render all charts — Overview, Failures, Tests, Trends, and Timeline — against that run. A viewing banner persists across all tabs while a historical run is active.

---

## Sidebar & theme

The sidebar shows the six tabs. Each tab icon shows a badge with the count of relevant items (e.g. Failures tab shows failure count). The top-right toggle switches between **dark** and **light** theme. The setting is persisted in localStorage.
