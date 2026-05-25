const INFO_ICON = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
const DL_ICON   = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

export function renderOverview(): string {
  return `
<div class="sv-view" id="sv-section-overview" data-view="overview" style="display:block;">

  <!-- Executive summary — hidden in UI, shown only in print -->
  <div class="sv-print-summary" id="sv-print-executive-summary"></div>

  <!-- Needs Attention strip -->
  <div id="sv-attention-strip"></div>

  <!-- Stat cards -->
  <div class="sv-stat-grid" id="sv-stat-grid"></div>

  <!-- Coverage Changes: New Tests / Absent Tests (shown only when changes detected) -->
  <div id="sv-coverage-changes" style="display:none;margin-top:1.25rem;"></div>

  <!-- Pass rate + donut -->
  <div class="sv-grid-2" style="margin-top:1.25rem; gap:1rem;">

    <div class="sv-card">
      <div class="sv-card-header">
        <span style="display:flex;align-items:center;gap:0.4rem;">
          <span class="sv-card-title">Pass Rate</span>
          <span class="sv-info-btn" data-sv-tip="&lt;b&gt;Pass Rate&lt;/b&gt;&lt;br&gt;• % of tests that passed — your primary quality metric&lt;br&gt;• &lt;b&gt;Above 95%&lt;/b&gt; = stable · &lt;b&gt;Below 80%&lt;/b&gt; = critical attention needed&lt;br&gt;• Bar shows the Passed / Failed / Flaky / Skipped split&lt;br&gt;• Hover each segment for exact counts">${INFO_ICON}</span>
        </span>
        <span id="sv-pass-rate-value" style="font-size:1.4rem;font-weight:700;color:var(--text-primary);">—</span>
      </div>
      <div class="sv-card-body">
        <div class="sv-progress-seg" id="sv-pass-rate-bar"></div>
        <div style="display:flex;gap:1rem;margin-top:1rem;flex-wrap:wrap;" id="sv-pass-breakdown"></div>
      </div>
    </div>

    <div class="sv-card">
      <div class="sv-card-header">
        <span style="display:flex;align-items:center;gap:0.4rem;">
          <span class="sv-card-title">Distribution</span>
          <span class="sv-info-btn" data-sv-tip="&lt;b&gt;Test Distribution&lt;/b&gt;&lt;br&gt;• Donut showing outcome breakdown for this run&lt;br&gt;• Centre value = pass rate&lt;br&gt;• &lt;b&gt;Large green arc&lt;/b&gt; = healthy · &lt;b&gt;Red or amber&lt;/b&gt; = failures or instability&lt;br&gt;• Hover each slice for exact counts">${INFO_ICON}</span>
        </span>
        <button class="sv-dl-btn" onclick="SarvaOverview.downloadDistribution()" data-sv-tip="Download as PNG">${DL_ICON}</button>
      </div>
      <div class="sv-card-body" style="display:flex;align-items:center;justify-content:center;gap:1.5rem;">
        <div id="sv-donut-chart" style="width:160px;height:160px;flex-shrink:0;"></div>
        <div id="sv-donut-legend" style="display:flex;flex-direction:column;gap:0.5rem;"></div>
      </div>
      <div class="sv-print-insight" id="sv-print-insight-distribution"></div>
    </div>

  </div>

  <!-- Run count filter (affects Health Pulse + Run History) -->
  <div class="sv-print-hide" style="display:flex;align-items:center;justify-content:flex-end;gap:0.4rem;margin-top:1.25rem;">
    <span style="font-size:0.7rem;color:var(--text-muted);margin-right:0.2rem;">Show:</span>
    <button class="sv-run-filter-btn" onclick="SarvaOverview.setRunFilter(10,this)">Last 10</button>
    <button class="sv-run-filter-btn active" onclick="SarvaOverview.setRunFilter(20,this)">Last 20</button>
    <button class="sv-run-filter-btn" onclick="SarvaOverview.setRunFilter(50,this)">Last 50</button>
    <button class="sv-run-filter-btn" id="sv-filter-all-btn" onclick="SarvaOverview.setRunFilter(0,this)">All runs</button>
    <span id="sv-overview-run-label" style="font-size:0.72rem;color:var(--text-muted);margin-left:0.5rem;"></span>
  </div>

  <!-- Health Pulse line chart -->
  <div class="sv-card" style="margin-top:0.5rem;" id="sv-health-pulse-card">
    <div class="sv-card-header">
      <span style="display:flex;align-items:center;gap:0.4rem;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--status-passed)" stroke-width="2.5" style="flex-shrink:0;">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span class="sv-card-title">Health Pulse</span>
        <span class="sv-info-btn" data-sv-tip="&lt;b&gt;Health Pulse&lt;/b&gt;&lt;br&gt;• Pass rate % across last N runs&lt;br&gt;• &lt;b&gt;Rising&lt;/b&gt; = improving · &lt;b&gt;Flat at 100%&lt;/b&gt; = stable · &lt;b&gt;Declining&lt;/b&gt; = regressions&lt;br&gt;• Trend badge (↑ ↓) shows change from previous run&lt;br&gt;• Use to report suite stability trends to management">${INFO_ICON}</span>
        <span id="sv-health-trend" style="font-size:0.72rem;margin-left:0.25rem;"></span>
      </span>
      <span style="display:flex;align-items:center;gap:0.4rem;">
        <span style="font-size:0.72rem;color:var(--text-muted);" id="sv-health-runs-label"></span>
        <button class="sv-dl-btn" onclick="SarvaDownloadChart('sv-health-chart','health-pulse.png','Health Pulse')" data-sv-tip="Download as PNG">${DL_ICON}</button>
      </span>
    </div>
    <div class="sv-card-body">
      <div id="sv-health-chart" style="height:160px;"></div>
      <div id="sv-health-empty" style="display:none;text-align:center;color:var(--text-muted);padding:2rem;font-size:0.8rem;">
        Run the report multiple times to see health trends here.
      </div>
      <div class="sv-print-insight" id="sv-print-insight-health"></div>
    </div>
  </div>

  <!-- Run history stacked bars -->
  <div class="sv-card" style="margin-top:1rem;" id="sv-history-card">
    <div class="sv-card-header">
      <span style="display:flex;align-items:center;gap:0.4rem;">
        <span class="sv-card-title">Run History</span>
        <span class="sv-info-btn" data-sv-tip="&lt;b&gt;Run History&lt;/b&gt;&lt;br&gt;• Stacked bars per run — oldest left, newest right&lt;br&gt;• &lt;b&gt;All-green&lt;/b&gt; = perfect run · &lt;b&gt;Growing red&lt;/b&gt; = accumulating failures&lt;br&gt;• &lt;b&gt;Amber bars&lt;/b&gt; = flakiness increasing&lt;br&gt;• Hover a bar for counts, pass rate, and run date/time">${INFO_ICON}</span>
      </span>
      <span style="display:flex;align-items:center;gap:0.4rem;">
        <span style="font-size:0.72rem;color:var(--text-muted);" id="sv-history-runs-label"></span>
        <button class="sv-dl-btn" onclick="SarvaDownloadChart('sv-history-chart','run-history.png','Run History')" data-sv-tip="Download as PNG">${DL_ICON}</button>
      </span>
    </div>
    <div class="sv-card-body">
      <div id="sv-history-chart" style="height:180px;"></div>
      <div id="sv-history-empty" style="display:none;text-align:center;color:var(--text-muted);padding:2rem;font-size:0.8rem;">
        Run the report multiple times to see history trends here.
      </div>
      <div class="sv-print-insight" id="sv-print-insight-history"></div>
    </div>
  </div>

  <!-- Browser / Tool Breakdown (shown only when multiple groups exist) -->
  <div id="sv-browser-tool-section" style="display:none;margin-top:1rem;"></div>


</div>`;
}
