export function renderTestList(): string {
  return `
<div class="sv-view" id="sv-section-tests" data-view="tests" style="display:none;">

  <!-- Toolbar -->
  <div class="sv-card" style="margin-bottom:1rem;">
    <div class="sv-card-body" style="padding:0.75rem 1rem; display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">

      <div class="sv-print-hide" style="position:relative;flex:1;min-width:200px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"
             style="position:absolute;left:0.65rem;top:50%;transform:translateY(-50%);">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" id="sv-test-search" placeholder="Search tests…"
               style="width:100%;padding:0.45rem 0.75rem 0.45rem 2rem;background:var(--bg-surface-2);
                      border:1px solid var(--border);border-radius:var(--radius-sm);
                      color:var(--text-primary);font-size:0.83rem;outline:none;"
               oninput="SarvaTestList.filter()">
      </div>

      <div style="display:flex;gap:0.4rem;flex-shrink:0;" id="sv-status-filters">
        <button class="sv-filter-btn active" data-filter="all"     onclick="SarvaTestList.setFilter('all',this)">All</button>
        <button class="sv-filter-btn"        data-filter="passed"  onclick="SarvaTestList.setFilter('passed',this)">Passed</button>
        <button class="sv-filter-btn"        data-filter="failed"  onclick="SarvaTestList.setFilter('failed',this)">Failed</button>
        <button class="sv-filter-btn"        data-filter="flaky"   onclick="SarvaTestList.setFilter('flaky',this)">Flaky</button>
        <button class="sv-filter-btn"        data-filter="skipped" onclick="SarvaTestList.setFilter('skipped',this)">Skipped</button>
      </div>

      <span id="sv-test-count" style="font-size:0.72rem;color:var(--text-muted);flex-shrink:0;white-space:nowrap;"></span>

      <button class="sv-dl-btn" onclick="SarvaTestList.downloadCsv()" data-sv-tip="Download visible tests as CSV"
              style="width:auto;height:auto;padding:0.3rem 0.55rem;gap:0.3rem;font-size:0.72rem;font-weight:600;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        CSV
      </button>

    </div>
  </div>

  <!-- Table header -->
  <div style="display:grid;grid-template-columns:2fr 110px 90px 90px 36px 80px 24px;gap:0.5rem;
              padding:0.4rem 1rem;font-size:0.68rem;font-weight:700;text-transform:uppercase;
              letter-spacing:0.07em;color:var(--text-muted);">
    <span data-sv-sort-col="name" onclick="SarvaTestList.setSort('name')"
          style="cursor:pointer;display:inline-flex;align-items:center;gap:0.3rem;user-select:none;">
      Test Name <span class="sv-sort-icon" style="font-size:0.65rem;opacity:0.5;">⇅</span>
    </span>
    <span data-sv-sort-col="status" onclick="SarvaTestList.setSort('status')"
          style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:0.3rem;user-select:none;">
      Status <span class="sv-sort-icon" style="font-size:0.65rem;opacity:0.5;">⇅</span>
    </span>
    <span data-sv-sort-col="duration" onclick="SarvaTestList.setSort('duration')"
          style="cursor:pointer;display:inline-flex;align-items:center;justify-content:flex-end;gap:0.3rem;user-select:none;">
      Duration <span class="sv-sort-icon" style="font-size:0.65rem;opacity:0.5;">⇅</span>
    </span>
    <span style="text-align:center;">History</span>
    <span style="text-align:center;" data-sv-tip="Trend over last 5 runs: ▲ improving · ▼ declining · — stable">Trend</span>
    <span data-sv-sort-col="retries" onclick="SarvaTestList.setSort('retries')"
          style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:0.3rem;user-select:none;">
      Retries <span class="sv-sort-icon" style="font-size:0.65rem;opacity:0.5;">⇅</span>
    </span>
    <span></span>
  </div>

  <!-- Test rows -->
  <div id="sv-test-rows" style="display:flex;flex-direction:column;gap:2px;"></div>

  <div id="sv-test-empty" style="display:none;text-align:center;color:var(--text-muted);
       padding:3rem;font-size:0.85rem;">No tests match your filter.</div>


</div>`;
}
