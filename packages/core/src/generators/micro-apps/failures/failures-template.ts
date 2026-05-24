const INFO_ICON = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
const CSV_ICON  = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;

export function renderFailures(): string {
  return `
<div class="sv-view" id="sv-section-failures" data-view="failures" style="display:none;">

  <!-- Failures summary bar -->
  <div id="sv-failures-summary" style="margin-bottom:1.25rem;"></div>

  <!-- Newly Failing / Recently Fixed (shown only when historical data exists) -->
  <div id="sv-newly-failing-section" style="display:none;"></div>

  <!-- Failures by Severity (shown only when severity labels exist) -->
  <div id="sv-severity-breakdown" style="display:none;margin-top:1.25rem;"></div>

  <!-- Top Failures + Top Flaky -->
  <div class="sv-grid-2" style="margin-top:1.25rem;gap:1rem;align-items:start;">

    <div class="sv-card" id="sv-top-failures-card">
      <div class="sv-card-header">
        <span style="display:flex;align-items:center;gap:0.4rem;">
          <span class="sv-card-title">Top Failures</span>
          <span class="sv-info-btn" data-sv-tip="&lt;b&gt;Top Failures&lt;/b&gt;&lt;br&gt;• Ranked by failure count across all historical runs&lt;br&gt;• Near the top = consistently unreliable, needs a dedicated fix&lt;br&gt;• Clock icon shows when it last failed&lt;br&gt;• Symbols (✓ ✗ ~ ○) show last 10 run outcomes left-to-right&lt;br&gt;• Click any row to open the full error, stack trace, and steps">${INFO_ICON}</span>
        </span>
        <span style="display:flex;align-items:center;gap:0.4rem;">
          <span style="font-size:0.72rem;color:var(--text-muted);" id="sv-top-failures-count"></span>
          <button class="sv-dl-btn" onclick="SarvaFailures.downloadFailuresCsv()" data-sv-tip="Download as CSV">${CSV_ICON}</button>
        </span>
      </div>
      <div style="padding:0;max-height:320px;overflow-y:auto;" id="sv-top-failures-list"></div>
    </div>

    <div class="sv-card" id="sv-top-flaky-card">
      <div class="sv-card-header">
        <span style="display:flex;align-items:center;gap:0.4rem;">
          <span class="sv-card-title">Top Flaky Offenders</span>
          <span class="sv-info-btn" data-sv-tip="&lt;b&gt;Top Flaky Offenders&lt;/b&gt;&lt;br&gt;• Ranked by flakiness rate — inconsistent results across runs&lt;br&gt;• &lt;b&gt;50% rate&lt;/b&gt; = fails half the time, passes only after retry&lt;br&gt;• High flakiness slows CI and masks real failures&lt;br&gt;• % score on the right = flaky rate&lt;br&gt;• Click any row to investigate the test's full history">${INFO_ICON}</span>
        </span>
        <span style="display:flex;align-items:center;gap:0.4rem;">
          <span style="font-size:0.72rem;color:var(--text-muted);" id="sv-top-flaky-count"></span>
          <button class="sv-dl-btn" onclick="SarvaFailures.downloadFlakyCsv()" data-sv-tip="Download as CSV">${CSV_ICON}</button>
        </span>
      </div>
      <div style="padding:0;max-height:320px;overflow-y:auto;" id="sv-top-flaky-list"></div>
    </div>

  </div>

</div>`;
}
