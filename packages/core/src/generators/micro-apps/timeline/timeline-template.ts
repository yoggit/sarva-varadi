const INFO_ICON = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
const DL_ICON   = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

export function renderTimeline(): string {
  return `
<div class="sv-view" id="sv-section-timeline" data-view="timeline" style="display:none;">

  <!-- Run Cadence -->
  <div class="sv-card">
    <div class="sv-card-header">
      <span style="display:flex;align-items:center;gap:0.4rem;">
        <span class="sv-card-title">Run Cadence</span>
        <span class="sv-info-btn" data-sv-tip="&lt;b&gt;Run Cadence&lt;/b&gt;&lt;br&gt;• Each bar = one historical run&lt;br&gt;• Bar height = total duration · Colour = pass rate (green → amber → red)&lt;br&gt;• Spot irregular schedules, unusually long runs, or quality regressions">${INFO_ICON}</span>
      </span>
      <span class="sv-print-hide" style="display:flex;align-items:center;gap:0.4rem;">
        <span style="font-size:0.7rem;color:var(--text-muted);margin-right:0.2rem;">Show:</span>
        <button class="sv-cadence-run-btn" onclick="SarvaTimeline.setCadenceFilter(10,this)">Last 10</button>
        <button class="sv-cadence-run-btn active" onclick="SarvaTimeline.setCadenceFilter(20,this)">Last 20</button>
        <button class="sv-cadence-run-btn" onclick="SarvaTimeline.setCadenceFilter(50,this)">Last 50</button>
        <button class="sv-cadence-run-btn" onclick="SarvaTimeline.setCadenceFilter(0,this)">All runs</button>
        <span style="font-size:0.72rem;color:var(--text-muted);margin-left:0.5rem;" id="sv-cadence-label"></span>
        <button class="sv-dl-btn" onclick="SarvaDownloadChart('sv-cadence-chart','run-cadence.png','Run Cadence')" data-sv-tip="Download as PNG">${DL_ICON}</button>
      </span>
    </div>
    <div class="sv-card-body">
      <div id="sv-cadence-chart" style="height:300px;"></div>
      <div id="sv-cadence-empty" style="display:none;text-align:center;padding:2rem;color:var(--text-muted);font-size:0.8rem;">
        Run the report multiple times to see run cadence here.
      </div>
      <div class="sv-print-insight" id="sv-print-insight-cadence"></div>
    </div>
  </div>

  <!-- Execution Gantt -->
  <div class="sv-card" style="margin-top:1rem;">
    <div class="sv-card-header">
      <span style="display:flex;align-items:center;gap:0.4rem;">
        <span class="sv-card-title" id="sv-gantt-title">Execution Gantt — Current Run</span>
        <span class="sv-info-btn" data-sv-tip="&lt;b&gt;Execution Gantt&lt;/b&gt;&lt;br&gt;• Each row = one test, bar = start → end time (relative to first test)&lt;br&gt;• Overlapping bars = parallel execution&lt;br&gt;• Colour: green Passed · red Failed · amber Flaky · grey Skipped&lt;br&gt;• Hover a bar for exact timing">${INFO_ICON}</span>
      </span>
      <span style="display:flex;align-items:center;gap:0.4rem;">
        <span style="font-size:0.72rem;color:var(--text-muted);" id="sv-gantt-label"></span>
        <button class="sv-dl-btn" onclick="SarvaDownloadChart('sv-gantt-chart','execution-gantt.png','Execution Gantt')" data-sv-tip="Download as PNG">${DL_ICON}</button>
      </span>
    </div>
    <div class="sv-card-body" style="padding:0.5rem 1rem 1rem;">
      <div id="sv-gantt-chart"></div>
      <div id="sv-gantt-empty" style="display:none;text-align:center;padding:2rem;color:var(--text-muted);font-size:0.8rem;">
        No per-test timing data available for this run.<br>
        <span style="font-size:0.75rem;opacity:0.7;">Timing is captured automatically by Playwright. For Selenium and REST Assured, ensure your adapter records <code>start</code> timestamps.</span>
      </div>
      <div class="sv-print-insight" id="sv-print-insight-gantt"></div>
    </div>
  </div>


</div>`;
}
