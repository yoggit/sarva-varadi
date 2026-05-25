# Architecture

Sarva-Varadi uses a **two-phase execution model** inspired by Allure: collect during tests, generate after.

[[toc]]

---

## Two-phase model

```
Phase 1: Data Collection (during test execution)
─────────────────────────────────────────────────
Framework test → Adapter → test-results.json (SarvaTestResult format)

Phase 2: Report Generation (after all tests complete)
──────────────────────────────────────────────────────
test-results.json + history/ → ReportGenerator → {
  index.html       (6-tab SPA — the main report)
  trends.html      (standalone trends page)
  history/         (run archive folders + runs.json index)
}
```

The `SarvaTestResult` JSON schema is the single integration contract. Any tool that writes this schema gets the full report — Failures view, Trends, Run History, Gantt, PDF export, flaky detection — automatically.

---

## Adapter pattern

```
┌──────────────────────────────┐
│  Playwright (TS/JS)          │──→ @sarva-varadi/playwright  ──┐
│  Selenium + TestNG (Java)    │──→ sarva-varadi-selenium     ──┤
│  Selenium + Cucumber (Java)  │──→ sarva-varadi-cucumber     ──┤
│  RestAssured + TestNG (Java) │──→ sarva-varadi-restassured  ──┼──→ SarvaTestResult JSON → @sarva-varadi/core → index.html
│  RestAssured + JUnit (Java)  │──→ sarva-varadi-restassured- ──┤
│                              │     junit                    ──┤
│  RestAssured + Cucumber(Java)│──→ sarva-varadi-cucumber     ──┘
└──────────────────────────────┘
```

---

## Report SPA architecture

The generated `index.html` embeds all CSS, JavaScript, fonts, and data inline — no network requests at runtime.

```
packages/core/src/generators/
  shell/
    shell-template.ts   ← sidebar nav, topbar, theme toggle, print button
    shell.css           ← all CSS (light/dark vars, layout, print @page rules)
    shell.js            ← SarvaRunSwitch (run hot-swap), print helpers, PNG download
  shared/
    state-store.js      ← SarvaStore.init(tests, metadata, history) — read by all micro-apps
    event-bus.js        ← SarvaEventBus — coordinates ECharts 'echarts:ready' event
  micro-apps/
    overview/           ← stat cards, pass rate donut, health pulse, top failing/flaky
    failures/           ← failures view: newly failing, recently fixed, ranked by severity
    test-list/          ← test list with filter/search/sort, per-test history chart
    test-detail/        ← test detail drawer (steps, attachments, per-test history)
    trends/             ← 6 ECharts charts with run-count filter and centered-mode label
    timeline/           ← run cadence bar chart + execution Gantt
    runs/               ← filterable run history table; click any row to hot-swap all charts
```

### State flow

1. `SarvaStore.init(tests, metadata, history)` is called on `DOMContentLoaded` (data embedded in `index.html`)
2. Each micro-app reads from `SarvaStore` via event subscription
3. ECharts is loaded async from CDN; `SarvaEventBus.emit('echarts:ready')` triggers chart renders
4. `SarvaRunSwitch.switchToRun(runId)` hot-swaps `SarvaStore` state and re-emits `store:ready` — every micro-app re-renders without a page reload

---

## History model

```
sarva-report/
  index.html
  trends.html
  history/
    run-<timestamp>-<uuid>/    ← one folder per run
      meta.json                ← run metadata (date, counts, pass rate, duration)
      tests.json               ← full test results for that run
    runs.json                  ← index rebuilt by CLI from folder list
```

- No database — just files
- `maxRuns` and `retentionDays` control retention; oldest folders are deleted first
- In CI: fetch `history/` from the previous deployment before running tests so it accumulates

---

## Package structure

```
sarva-varadi/
├── packages/
│   ├── core/                      # @sarva-varadi/core — Node.js CLI + report generator
│   ├── playwright/                # @sarva-varadi/playwright — Playwright reporter plugin
│   ├── selenium/                  # @sarva-varadi/selenium — Maven artifact (JitPack)
│   ├── rest-assured/              # @sarva-varadi/rest-assured — Maven artifact (JitPack)
│   ├── rest-assured-junit/        # @sarva-varadi/rest-assured-junit — JUnit 5 extension
│   └── cucumber/                  # Cucumber BDD plugin (Selenium + RestAssured)
├── java/
│   └── sarva-varadi-restassured-junit/   # Java extension source
├── demo-playwright/               # Live Playwright demo (25-run history via CI)
├── demo-selenium/
├── demo-restassured/
├── demo-restassured-junit/
├── demo-selenium-cucumber/
├── demo-restassured-cucumber/
└── docs/                          # This documentation site (VitePress)
```

---

## Adding a new framework

1. Implement a listener/plugin that converts test events → `SarvaTestResult[]` JSON
2. Write the JSON to `<outputDir>/test-results.json`
3. Call the Node.js CLI (`@sarva-varadi/core`) after tests to generate the report
4. Add a demo project in `demo-<framework>/`

The core generator is completely framework-agnostic — no changes needed there.
