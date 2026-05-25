import{c as s,Q as e,j as n,m as t}from"./chunks/framework.dywCjXaF.js";const u=JSON.parse('{"title":"Architecture","description":"","frontmatter":{},"headers":[],"relativePath":"architecture.md","filePath":"architecture.md"}'),r={name:"architecture.md"};function p(l,a,i,o,c,d){return e(),n("div",null,[...a[0]||(a[0]=[t(`<h1 id="architecture" tabindex="-1">Architecture <a class="header-anchor" href="#architecture" aria-label="Permalink to &quot;Architecture&quot;">​</a></h1><p>Sarva-Varadi uses a <strong>two-phase execution model</strong> inspired by Allure: collect during tests, generate after.</p><nav class="table-of-contents"><ul><li><a href="#two-phase-model">Two-phase model</a></li><li><a href="#adapter-pattern">Adapter pattern</a></li><li><a href="#report-spa-architecture">Report SPA architecture</a><ul><li><a href="#state-flow">State flow</a></li></ul></li><li><a href="#history-model">History model</a></li><li><a href="#package-structure">Package structure</a></li><li><a href="#adding-a-new-framework">Adding a new framework</a></li></ul></nav><hr><h2 id="two-phase-model" tabindex="-1">Two-phase model <a class="header-anchor" href="#two-phase-model" aria-label="Permalink to &quot;Two-phase model&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Phase 1: Data Collection (during test execution)</span></span>
<span class="line"><span>─────────────────────────────────────────────────</span></span>
<span class="line"><span>Framework test → Adapter → test-results.json (SarvaTestResult format)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Phase 2: Report Generation (after all tests complete)</span></span>
<span class="line"><span>──────────────────────────────────────────────────────</span></span>
<span class="line"><span>test-results.json + history/ → ReportGenerator → {</span></span>
<span class="line"><span>  index.html       (6-tab SPA — the main report)</span></span>
<span class="line"><span>  trends.html      (standalone trends page)</span></span>
<span class="line"><span>  history/         (run archive folders + runs.json index)</span></span>
<span class="line"><span>}</span></span></code></pre></div><p>The <code>SarvaTestResult</code> JSON schema is the single integration contract. Any tool that writes this schema gets the full report — Failures view, Trends, Run History, Gantt, PDF export, flaky detection — automatically.</p><hr><h2 id="adapter-pattern" tabindex="-1">Adapter pattern <a class="header-anchor" href="#adapter-pattern" aria-label="Permalink to &quot;Adapter pattern&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>┌──────────────────────────────┐</span></span>
<span class="line"><span>│  Playwright (TS/JS)          │──→ @sarva-varadi/playwright  ──┐</span></span>
<span class="line"><span>│  Selenium + TestNG (Java)    │──→ sarva-varadi-selenium     ──┤</span></span>
<span class="line"><span>│  Selenium + Cucumber (Java)  │──→ sarva-varadi-cucumber     ──┤</span></span>
<span class="line"><span>│  RestAssured + TestNG (Java) │──→ sarva-varadi-restassured  ──┼──→ SarvaTestResult JSON → @sarva-varadi/core → index.html</span></span>
<span class="line"><span>│  RestAssured + JUnit (Java)  │──→ sarva-varadi-restassured- ──┤</span></span>
<span class="line"><span>│                              │     junit                    ──┤</span></span>
<span class="line"><span>│  RestAssured + Cucumber(Java)│──→ sarva-varadi-cucumber     ──┘</span></span>
<span class="line"><span>└──────────────────────────────┘</span></span></code></pre></div><hr><h2 id="report-spa-architecture" tabindex="-1">Report SPA architecture <a class="header-anchor" href="#report-spa-architecture" aria-label="Permalink to &quot;Report SPA architecture&quot;">​</a></h2><p>The generated <code>index.html</code> embeds all CSS, JavaScript, fonts, and data inline — no network requests at runtime.</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>packages/core/src/generators/</span></span>
<span class="line"><span>  shell/</span></span>
<span class="line"><span>    shell-template.ts   ← sidebar nav, topbar, theme toggle, print button</span></span>
<span class="line"><span>    shell.css           ← all CSS (light/dark vars, layout, print @page rules)</span></span>
<span class="line"><span>    shell.js            ← SarvaRunSwitch (run hot-swap), print helpers, PNG download</span></span>
<span class="line"><span>  shared/</span></span>
<span class="line"><span>    state-store.js      ← SarvaStore.init(tests, metadata, history) — read by all micro-apps</span></span>
<span class="line"><span>    event-bus.js        ← SarvaEventBus — coordinates ECharts &#39;echarts:ready&#39; event</span></span>
<span class="line"><span>  micro-apps/</span></span>
<span class="line"><span>    overview/           ← stat cards, pass rate donut, health pulse, top failing/flaky</span></span>
<span class="line"><span>    failures/           ← failures view: newly failing, recently fixed, ranked by severity</span></span>
<span class="line"><span>    test-list/          ← test list with filter/search/sort, per-test history chart</span></span>
<span class="line"><span>    test-detail/        ← test detail drawer (steps, attachments, per-test history)</span></span>
<span class="line"><span>    trends/             ← 6 ECharts charts with run-count filter and centered-mode label</span></span>
<span class="line"><span>    timeline/           ← run cadence bar chart + execution Gantt</span></span>
<span class="line"><span>    runs/               ← filterable run history table; click any row to hot-swap all charts</span></span></code></pre></div><h3 id="state-flow" tabindex="-1">State flow <a class="header-anchor" href="#state-flow" aria-label="Permalink to &quot;State flow&quot;">​</a></h3><ol><li><code>SarvaStore.init(tests, metadata, history)</code> is called on <code>DOMContentLoaded</code> (data embedded in <code>index.html</code>)</li><li>Each micro-app reads from <code>SarvaStore</code> via event subscription</li><li>ECharts is loaded async from CDN; <code>SarvaEventBus.emit(&#39;echarts:ready&#39;)</code> triggers chart renders</li><li><code>SarvaRunSwitch.switchToRun(runId)</code> hot-swaps <code>SarvaStore</code> state and re-emits <code>store:ready</code> — every micro-app re-renders without a page reload</li></ol><hr><h2 id="history-model" tabindex="-1">History model <a class="header-anchor" href="#history-model" aria-label="Permalink to &quot;History model&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>sarva-report/</span></span>
<span class="line"><span>  index.html</span></span>
<span class="line"><span>  trends.html</span></span>
<span class="line"><span>  history/</span></span>
<span class="line"><span>    run-&lt;timestamp&gt;-&lt;uuid&gt;/    ← one folder per run</span></span>
<span class="line"><span>      meta.json                ← run metadata (date, counts, pass rate, duration)</span></span>
<span class="line"><span>      tests.json               ← full test results for that run</span></span>
<span class="line"><span>    runs.json                  ← index rebuilt by CLI from folder list</span></span></code></pre></div><ul><li>No database — just files</li><li><code>maxRuns</code> and <code>retentionDays</code> control retention; oldest folders are deleted first</li><li>In CI: fetch <code>history/</code> from the previous deployment before running tests so it accumulates</li></ul><hr><h2 id="package-structure" tabindex="-1">Package structure <a class="header-anchor" href="#package-structure" aria-label="Permalink to &quot;Package structure&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>sarva-varadi/</span></span>
<span class="line"><span>├── packages/</span></span>
<span class="line"><span>│   ├── core/                      # @sarva-varadi/core — Node.js CLI + report generator</span></span>
<span class="line"><span>│   ├── playwright/                # @sarva-varadi/playwright — Playwright reporter plugin</span></span>
<span class="line"><span>│   ├── selenium/                  # @sarva-varadi/selenium — Maven artifact (JitPack)</span></span>
<span class="line"><span>│   ├── rest-assured/              # @sarva-varadi/rest-assured — Maven artifact (JitPack)</span></span>
<span class="line"><span>│   ├── rest-assured-junit/        # @sarva-varadi/rest-assured-junit — JUnit 5 extension</span></span>
<span class="line"><span>│   └── cucumber/                  # Cucumber BDD plugin (Selenium + RestAssured)</span></span>
<span class="line"><span>├── java/</span></span>
<span class="line"><span>│   └── sarva-varadi-restassured-junit/   # Java extension source</span></span>
<span class="line"><span>├── demo-playwright/               # Live Playwright demo (25-run history via CI)</span></span>
<span class="line"><span>├── demo-selenium/</span></span>
<span class="line"><span>├── demo-restassured/</span></span>
<span class="line"><span>├── demo-restassured-junit/</span></span>
<span class="line"><span>├── demo-selenium-cucumber/</span></span>
<span class="line"><span>├── demo-restassured-cucumber/</span></span>
<span class="line"><span>└── docs/                          # This documentation site (VitePress)</span></span></code></pre></div><hr><h2 id="adding-a-new-framework" tabindex="-1">Adding a new framework <a class="header-anchor" href="#adding-a-new-framework" aria-label="Permalink to &quot;Adding a new framework&quot;">​</a></h2><ol><li>Implement a listener/plugin that converts test events → <code>SarvaTestResult[]</code> JSON</li><li>Write the JSON to <code>&lt;outputDir&gt;/test-results.json</code></li><li>Call the Node.js CLI (<code>@sarva-varadi/core</code>) after tests to generate the report</li><li>Add a demo project in <code>demo-&lt;framework&gt;/</code></li></ol><p>The core generator is completely framework-agnostic — no changes needed there.</p>`,27)])])}const m=s(r,[["render",p]]);export{u as __pageData,m as default};
