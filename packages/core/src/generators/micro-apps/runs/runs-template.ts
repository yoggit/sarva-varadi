export function renderRuns(): string {
  return `
  <div class="sv-view" id="sv-section-runs" data-view="runs" style="display:none;">
    <div class="sv-runs-header">
      <div class="sv-runs-header-title">
        <h2>Run History</h2>
        <span id="sv-runs-count-label" class="sv-runs-count-label"></span>
      </div>
      <div class="sv-runs-filters">
        <div class="sv-runs-filter-pill">
          <select id="sv-runs-filter-status" onchange="SarvaRuns.applyFilters()">
            <option value="">All Status</option>
            <option value="pass">All Passing</option>
            <option value="fail">Has Failures</option>
            <option value="flaky">Has Flaky</option>
          </select>
          <button class="sv-runs-filter-clear-x" onclick="SarvaRuns.clearFilter('status')" title="Clear">✕</button>
        </div>

        <div class="sv-runs-filter-pill">
          <input id="sv-runs-filter-search" type="text" placeholder="Env or run #"
                 oninput="SarvaRuns.applyFilters()">
          <button class="sv-runs-filter-clear-x" onclick="SarvaRuns.clearFilter('search')" title="Clear">✕</button>
        </div>

        <div class="sv-runs-filter-group">
          <span class="sv-runs-filter-label">Date</span>
          <span class="sv-info-btn" data-sv-tip="&lt;b&gt;Date Range Filter&lt;/b&gt;&lt;br&gt;• Defaults to the &lt;b&gt;last 30 days&lt;/b&gt; on load to keep the list fast&lt;br&gt;• Clear ✕ or widen the range to see older runs&lt;br&gt;• &lt;b&gt;Clear All&lt;/b&gt; resets back to the 30-day default"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></span>
          <input type="date" id="sv-runs-filter-date-from" onchange="SarvaRuns.applyFilters()">
          <span class="sv-runs-filter-sep">–</span>
          <input type="date" id="sv-runs-filter-date-to" onchange="SarvaRuns.applyFilters()">
          <button class="sv-runs-filter-clear-x" onclick="SarvaRuns.clearFilter('date')" title="Clear">✕</button>
        </div>

        <div class="sv-runs-filter-group">
          <span class="sv-runs-filter-label">Pass %</span>
          <input type="number" id="sv-runs-filter-pass-min" min="0" max="100" placeholder="min"
                 oninput="SarvaRuns.applyFilters()">
          <span class="sv-runs-filter-sep">–</span>
          <input type="number" id="sv-runs-filter-pass-max" min="0" max="100" placeholder="max"
                 oninput="SarvaRuns.applyFilters()">
          <button class="sv-runs-filter-clear-x" onclick="SarvaRuns.clearFilter('pass')" title="Clear">✕</button>
        </div>

        <div class="sv-runs-filter-group">
          <span class="sv-runs-filter-label">Duration (s)</span>
          <input type="number" id="sv-runs-filter-dur-min" min="0" placeholder="min"
                 oninput="SarvaRuns.applyFilters()">
          <span class="sv-runs-filter-sep">–</span>
          <input type="number" id="sv-runs-filter-dur-max" min="0" placeholder="max"
                 oninput="SarvaRuns.applyFilters()">
          <button class="sv-runs-filter-clear-x" onclick="SarvaRuns.clearFilter('dur')" title="Clear">✕</button>
        </div>

        <button class="sv-runs-clear-all" onclick="SarvaRuns.clearAllFilters()">Clear all</button>
      </div>
    </div>

    <div class="sv-card">
      <table class="sv-runs-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Env</th>
            <th colspan="2">Pass Rate</th>
            <th style="text-align:right">Passed</th>
            <th style="text-align:right">Failed</th>
            <th style="text-align:right">Flaky</th>
            <th style="text-align:right">Skipped</th>
            <th>Duration</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="sv-runs-tbody">
          <tr><td colspan="11" class="sv-runs-empty">Loading run history…</td></tr>
        </tbody>
      </table>
    </div>
  </div>`;
}
