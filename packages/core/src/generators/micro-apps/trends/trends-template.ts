const INFO_ICON = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
const DL_ICON   = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

export function renderTrends(): string {
  return `
<div class="sv-view" id="sv-section-trends" data-view="trends" style="display:none;">

  <!-- Run count filter -->
  <div class="sv-print-hide" style="display:flex;align-items:center;justify-content:flex-end;gap:0.4rem;margin-bottom:1.25rem;">
    <span style="font-size:0.7rem;color:var(--text-muted);margin-right:0.2rem;">Show:</span>
    <button class="sv-trends-run-btn" onclick="SarvaTrends.setRunFilter(10,this)">Last 10</button>
    <button class="sv-trends-run-btn active" onclick="SarvaTrends.setRunFilter(20,this)">Last 20</button>
    <button class="sv-trends-run-btn" onclick="SarvaTrends.setRunFilter(50,this)">Last 50</button>
    <button class="sv-trends-run-btn" onclick="SarvaTrends.setRunFilter(0,this)">All runs</button>
  </div>

  <!-- No-history fallback -->
  <div id="sv-trends-no-history" style="display:none;">
    <div class="sv-card">
      <div class="sv-card-body" style="text-align:center;padding:3rem;color:var(--text-muted);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:1rem;opacity:0.4;">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <div style="font-size:0.9rem;font-weight:600;color:var(--text-secondary);">No Historical Data</div>
        <div style="font-size:0.8rem;margin-top:0.4rem;">Run the report multiple times to see cross-run trends here.</div>
      </div>
    </div>
  </div>

  <!-- Main content -->
  <div id="sv-trends-content">

    <!-- Summary stat cards -->
    <div id="sv-trends-summary"></div>

    <!-- Pass Rate Trend + Failures/Flakiness -->
    <div class="sv-grid-2" style="gap:1rem;">
      <div class="sv-card">
        <div class="sv-card-header">
          <span style="display:flex;align-items:center;gap:0.4rem;">
            <span class="sv-card-title">Pass Rate Trend</span>
            <span class="sv-info-btn" data-sv-tip="&lt;b&gt;Pass Rate Trend&lt;/b&gt;&lt;br&gt;• % across filtered runs — oldest left → newest right&lt;br&gt;• Rising = suite improving · Flat at 100% = stable&lt;br&gt;• Declining = regressions accumulating&lt;br&gt;• Dashed line shows the average pass rate">${INFO_ICON}</span>
          </span>
          <span style="display:flex;align-items:center;gap:0.4rem;">
            <span style="font-size:0.72rem;color:var(--text-muted);" id="sv-trends-passrate-label"></span>
            <button class="sv-dl-btn" onclick="SarvaDownloadChart('sv-trends-passrate-chart','pass-rate-trend.png','Pass Rate Trend')" data-sv-tip="Download as PNG">${DL_ICON}</button>
          </span>
        </div>
        <div class="sv-card-body">
          <div id="sv-trends-passrate-chart" style="height:200px;"></div>
          <div class="sv-print-insight" id="sv-print-insight-passrate"></div>
        </div>
      </div>
      <div class="sv-card">
        <div class="sv-card-header">
          <span style="display:flex;align-items:center;gap:0.4rem;">
            <span class="sv-card-title">Failures &amp; Flakiness</span>
            <span class="sv-info-btn" data-sv-tip="&lt;b&gt;Failures &amp; Flakiness&lt;/b&gt;&lt;br&gt;• Count of failed and flaky tests per run&lt;br&gt;• Rising red = accumulating failures · Rising amber = growing instability&lt;br&gt;• Both flat at zero = ideal">${INFO_ICON}</span>
          </span>
          <span style="display:flex;align-items:center;gap:0.4rem;">
            <span style="font-size:0.72rem;color:var(--text-muted);" id="sv-trends-stability-label"></span>
            <button class="sv-dl-btn" onclick="SarvaDownloadChart('sv-trends-stability-chart','failures-flakiness.png','Failures & Flakiness')" data-sv-tip="Download as PNG">${DL_ICON}</button>
          </span>
        </div>
        <div class="sv-card-body">
          <div id="sv-trends-stability-chart" style="height:200px;"></div>
          <div class="sv-print-insight" id="sv-print-insight-stability"></div>
        </div>
      </div>
    </div>

    <!-- Failures by Severity over time -->
    <div style="margin-top:1rem;" id="sv-trends-severity-section">
      <div class="sv-card">
        <div class="sv-card-header">
          <span style="display:flex;align-items:center;gap:0.4rem;">
            <span class="sv-card-title">Failures by Severity</span>
            <span class="sv-info-btn" data-sv-tip="&lt;b&gt;Failures by Severity&lt;/b&gt;&lt;br&gt;• Stacked bars showing failed+flaky counts per severity level per run&lt;br&gt;• Critical (red) at the bottom — highest-priority issues&lt;br&gt;• Rising red/orange = critical regressions accumulating&lt;br&gt;• Only shown when severity labels are present in run data">${INFO_ICON}</span>
          </span>
          <span style="display:flex;align-items:center;gap:0.4rem;">
            <span style="font-size:0.72rem;color:var(--text-muted);" id="sv-trends-severity-label"></span>
            <button class="sv-dl-btn" onclick="SarvaDownloadChart('sv-trends-severity-chart','failures-by-severity.png','Failures by Severity')" data-sv-tip="Download as PNG">${DL_ICON}</button>
          </span>
        </div>
        <div class="sv-card-body">
          <div id="sv-trends-severity-chart" style="height:200px;"></div>
          <div id="sv-trends-severity-empty" style="display:none;text-align:center;padding:2.5rem;color:var(--text-muted);font-size:0.8rem;">Add <code>@severity</code> labels to your tests to see the breakdown here.</div>
        </div>
      </div>
    </div>

    <!-- Test Count + Duration -->
    <div class="sv-grid-2" style="margin-top:1rem;gap:1rem;">
      <div class="sv-card">
        <div class="sv-card-header">
          <span style="display:flex;align-items:center;gap:0.4rem;">
            <span class="sv-card-title">Test Count Over Time</span>
            <span class="sv-info-btn" data-sv-tip="&lt;b&gt;Test Count Over Time&lt;/b&gt;&lt;br&gt;• Stacked area showing test counts by outcome per run&lt;br&gt;• Growing green = expanding stable suite&lt;br&gt;• Growing red = accumulating failures · Shrinking total = tests removed">${INFO_ICON}</span>
          </span>
          <button class="sv-dl-btn" onclick="SarvaDownloadChart('sv-trends-count-chart','test-count.png','Test Count Over Time')" data-sv-tip="Download as PNG">${DL_ICON}</button>
        </div>
        <div class="sv-card-body">
          <div id="sv-trends-count-chart" style="height:200px;"></div>
          <div class="sv-print-insight" id="sv-print-insight-count"></div>
        </div>
      </div>
      <div class="sv-card">
        <div class="sv-card-header">
          <span style="display:flex;align-items:center;gap:0.4rem;">
            <span class="sv-card-title">Run Duration Trend</span>
            <span class="sv-info-btn" data-sv-tip="&lt;b&gt;Run Duration Trend&lt;/b&gt;&lt;br&gt;• How long each run took in seconds&lt;br&gt;• Increasing bars = new tests added or infrastructure slowdowns&lt;br&gt;• Dashed line shows the rolling average">${INFO_ICON}</span>
          </span>
          <button class="sv-dl-btn" onclick="SarvaDownloadChart('sv-trends-duration-chart','run-duration.png','Run Duration Trend')" data-sv-tip="Download as PNG">${DL_ICON}</button>
        </div>
        <div class="sv-card-body">
          <div id="sv-trends-duration-chart" style="height:200px;"></div>
          <div id="sv-trends-duration-empty" style="display:none;text-align:center;padding:2rem;color:var(--text-muted);font-size:0.8rem;">No duration data available.</div>
          <div class="sv-print-insight" id="sv-print-insight-duration"></div>
        </div>
      </div>
    </div>

    <!-- Top Failures + Top Flaky horizontal bars -->
    <div class="sv-grid-2" style="margin-top:1rem;gap:1rem;align-items:start;">
      <div class="sv-card">
        <div class="sv-card-header">
          <span style="display:flex;align-items:center;gap:0.4rem;">
            <span class="sv-card-title">Top Failing Tests</span>
            <span class="sv-info-btn" data-sv-tip="&lt;b&gt;Top Failing Tests&lt;/b&gt;&lt;br&gt;• Ranked by failure count in the selected window (Last 10 / 20 / 50 / All)&lt;br&gt;• Up to 10 shown — highest failure count first · header shows total qualifying&lt;br&gt;• Longer bar = more consistently failing&lt;br&gt;• Change the filter above to adjust the window&lt;br&gt;• Click a bar to open the test detail">${INFO_ICON}</span>
          </span>
          <span style="display:flex;align-items:center;gap:0.4rem;">
            <span style="font-size:0.72rem;color:var(--text-muted);" id="sv-trends-top-failures-label"></span>
            <button class="sv-dl-btn" onclick="SarvaDownloadChart('sv-trends-top-failures-chart','top-failing.png','Top Failing Tests')" data-sv-tip="Download as PNG">${DL_ICON}</button>
          </span>
        </div>
        <div class="sv-card-body" style="padding:0.75rem 1rem;">
          <div id="sv-trends-top-failures-chart"></div>
          <div id="sv-trends-top-failures-empty" style="display:none;text-align:center;padding:1.5rem;color:var(--text-muted);font-size:0.8rem;">No failures recorded across runs 🎉</div>
          <div class="sv-print-insight" id="sv-print-insight-top-failures"></div>
        </div>
      </div>
      <div class="sv-card">
        <div class="sv-card-header">
          <span style="display:flex;align-items:center;gap:0.4rem;">
            <span class="sv-card-title">Top Flaky Tests</span>
            <span class="sv-info-btn" data-sv-tip="&lt;b&gt;Top Flaky Tests&lt;/b&gt;&lt;br&gt;• Ranked by flakiness rate in the selected window (Last 10 / 20 / 50 / All)&lt;br&gt;• Rate = flaky occurrences ÷ total runs · Higher % = more inconsistent&lt;br&gt;• Up to 10 shown — highest rate first · header shows total qualifying&lt;br&gt;• Change the filter above to adjust the window&lt;br&gt;• Click a bar to open the test detail">${INFO_ICON}</span>
          </span>
          <span style="display:flex;align-items:center;gap:0.4rem;">
            <span style="font-size:0.72rem;color:var(--text-muted);" id="sv-trends-top-flaky-label"></span>
            <button class="sv-dl-btn" onclick="SarvaDownloadChart('sv-trends-top-flaky-chart','top-flaky.png','Top Flaky Tests')" data-sv-tip="Download as PNG">${DL_ICON}</button>
          </span>
        </div>
        <div class="sv-card-body" style="padding:0.75rem 1rem;">
          <div id="sv-trends-top-flaky-chart"></div>
          <div id="sv-trends-top-flaky-empty" style="display:none;text-align:center;padding:1.5rem;color:var(--text-muted);font-size:0.8rem;">No flaky tests recorded 🎉</div>
          <div class="sv-print-insight" id="sv-print-insight-top-flaky"></div>
        </div>
      </div>
    </div>

  </div><!-- sv-trends-content -->


</div>`;
}
