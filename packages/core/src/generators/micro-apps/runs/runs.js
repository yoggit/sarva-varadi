/**
 * Runs micro-app — filterable historical run list.
 * Clicking a row loads that run's data.js and swaps the store state in-place.
 */
const SarvaRuns = (() => {

  let _allRuns      = [];
  let _activeId     = null;
  let _initialized  = false;

  function _localDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function _setDefaultDateRange() {
    const from = document.getElementById('sv-runs-filter-date-from');
    const to   = document.getElementById('sv-runs-filter-date-to');
    if (!from || !to) return;
    const today = new Date();
    const past  = new Date(today);
    past.setDate(today.getDate() - 29); // last 30 days (today inclusive)
    from.value = _localDateStr(past);
    to.value   = _localDateStr(today);
  }

  /* ── Utilities ──────────────────────────────────────────────────────────── */
  function fmtDate(ts) {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function fmtDur(ms) {
    if (!ms || ms <= 0) return '—';
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  function passRateColor(rate) {
    if (rate >= 90) return 'var(--status-passed)';
    if (rate >= 70) return 'var(--status-flaky)';
    return 'var(--status-failed)';
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function envChip(run) {
    const env = run.environment || {};
    const display = env.name || env.branch || (env.commit ? env.commit.slice(0, 7) : '') || '';
    const full    = [env.name, env.branch, env.commit ? env.commit.slice(0, 7) : null].filter(Boolean).join(' · ');
    if (!display) return '<span style="color:var(--text-muted)">—</span>';
    const label = display.length > 14 ? display.slice(0, 13) + '…' : display;
    return `<span class="sv-runs-env-chip" title="${escHtml(full || display)}">${escHtml(label)}</span>`;
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  function renderRows(runs) {
    const tbody = document.getElementById('sv-runs-tbody');
    if (!tbody) return;

    // Update count label
    const lbl = document.getElementById('sv-runs-count-label');
    if (lbl) {
      const total = _allRuns.length;
      if (runs && runs.length > 0) {
        lbl.textContent = runs.length === total
          ? `${total} run${total !== 1 ? 's' : ''}`
          : `${runs.length} of ${total} runs`;
      } else {
        lbl.textContent = '';
      }
    }

    if (!runs || runs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="11" class="sv-runs-empty">No runs match the current filters.</td></tr>';
      return;
    }

    const total = _allRuns.length;

    tbody.innerHTML = runs.map((run) => {
      const globalIdx = _allRuns.indexOf(run);
      const runNum    = total - globalIdx;
      const isLatest  = globalIdx === 0;
      const isActive  = run.id === _activeId;
      const rate      = run.passRate != null ? +run.passRate : 0;
      const color     = passRateColor(rate);

      const actionCell = isLatest
        ? `<span class="sv-runs-chip-current">Current</span>`
        : `<button class="sv-runs-btn-view" onclick="SarvaRuns.viewRun(${escHtml(JSON.stringify(run.id))})">View →</button>`;

      return `
        <tr class="${isActive ? 'sv-runs-row--active' : ''}">
          <td class="sv-runs-num">#${runNum}</td>
          <td class="sv-runs-date">${fmtDate(run.timestamp)}</td>
          <td class="sv-runs-env">${envChip(run)}</td>
          <td>
            <div class="sv-runs-passrate-wrap">
              <div class="sv-runs-passrate-bar-bg">
                <div class="sv-runs-passrate-bar" style="width:${Math.min(100, rate)}%;background:${color};"></div>
              </div>
            </div>
          </td>
          <td class="sv-runs-passrate-val" style="color:${color};">${rate}%</td>
          <td class="sv-runs-count" style="text-align:right;"><span style="color:var(--status-passed);">${run.passed || 0}</span></td>
          <td class="sv-runs-count" style="text-align:right;"><span style="color:var(--status-failed);">${run.failed || 0}</span></td>
          <td class="sv-runs-count" style="text-align:right;"><span style="color:var(--status-flaky);">${run.flaky || 0}</span></td>
          <td class="sv-runs-count" style="text-align:right;"><span style="color:var(--text-muted);">${run.skipped || 0}</span></td>
          <td class="sv-runs-dur">${fmtDur(run.duration)}</td>
          <td class="sv-runs-action">${actionCell}</td>
        </tr>`;
    }).join('');
  }

  /* ── Filters ────────────────────────────────────────────────────────────── */
  function applyFilters() {
    const status   = (document.getElementById('sv-runs-filter-status')    || {}).value || '';
    const search   = ((document.getElementById('sv-runs-filter-search')   || {}).value || '').toLowerCase().trim();
    const dateFrom = (document.getElementById('sv-runs-filter-date-from') || {}).value || '';
    const dateTo   = (document.getElementById('sv-runs-filter-date-to')   || {}).value || '';
    const passMin  = (document.getElementById('sv-runs-filter-pass-min')  || {}).value;
    const passMax  = (document.getElementById('sv-runs-filter-pass-max')  || {}).value;
    const durMin   = (document.getElementById('sv-runs-filter-dur-min')   || {}).value;
    const durMax   = (document.getElementById('sv-runs-filter-dur-max')   || {}).value;

    let runs = _allRuns.slice();

    if (status === 'pass')  runs = runs.filter(r => (r.failed || 0) === 0 && (r.flaky || 0) === 0);
    if (status === 'fail')  runs = runs.filter(r => (r.failed || 0) > 0);
    if (status === 'flaky') runs = runs.filter(r => (r.flaky  || 0) > 0);

    // Parse date strings as local midnight to avoid UTC offset shifting the boundary day
    const parseLocalDay = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };
    if (dateFrom) runs = runs.filter(r => r.timestamp >= parseLocalDay(dateFrom));
    if (dateTo)   runs = runs.filter(r => r.timestamp <  parseLocalDay(dateTo) + 86400000);

    if (passMin !== '') runs = runs.filter(r => (r.passRate || 0) >= +passMin);
    if (passMax !== '') runs = runs.filter(r => (r.passRate || 0) <= +passMax);

    // Compare against displayed 1-decimal seconds to avoid raw-ms vs rounded-display mismatch
    if (durMin !== '') runs = runs.filter(r => +((r.duration || 0) / 1000).toFixed(1) >= +durMin);
    if (durMax !== '') runs = runs.filter(r => +((r.duration || 0) / 1000).toFixed(1) <= +durMax);

    if (search) {
      runs = runs.filter(r => {
        const env = r.environment || {};
        const gi  = _allRuns.indexOf(r);
        const num = String(_allRuns.length - gi);
        const hay = [num, env.name, env.branch, env.commit, env.ci].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(search);
      });
    }

    renderRows(runs);
  }

  /* ── Clear helpers ──────────────────────────────────────────────────────── */
  function clearFilter(which) {
    const g = id => document.getElementById(id);
    if (which === 'status') { const el = g('sv-runs-filter-status'); if (el) el.value = ''; }
    if (which === 'search') { const el = g('sv-runs-filter-search'); if (el) el.value = ''; }
    if (which === 'date')   { ['sv-runs-filter-date-from','sv-runs-filter-date-to'].forEach(i => { const el = g(i); if (el) el.value = ''; }); }
    if (which === 'pass')   { ['sv-runs-filter-pass-min','sv-runs-filter-pass-max'].forEach(i => { const el = g(i); if (el) el.value = ''; }); }
    if (which === 'dur')    { ['sv-runs-filter-dur-min','sv-runs-filter-dur-max'].forEach(i => { const el = g(i); if (el) el.value = ''; }); }
    applyFilters();
  }

  function clearAllFilters() {
    ['sv-runs-filter-status','sv-runs-filter-search',
     'sv-runs-filter-pass-min','sv-runs-filter-pass-max',
     'sv-runs-filter-dur-min','sv-runs-filter-dur-max'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    _setDefaultDateRange(); // restore default 30-day window instead of clearing date entirely
    applyFilters();
  }

  /* ── View a run ─────────────────────────────────────────────────────────── */
  function viewRun(runId) {
    const run = _allRuns.find(r => r.id === runId);
    if (!run) return;
    _activeId = runId;
    applyFilters(); // re-render to highlight the active row
    SarvaRunSwitch.switchToRun(runId, run);
  }

  /* ── Init ───────────────────────────────────────────────────────────────── */
  SarvaEventBus.on('store:ready', ({ history }) => {
    _allRuns = history || [];
    if (!_initialized) {
      _initialized = true;
      _setDefaultDateRange();
    }
    applyFilters();
  });

  SarvaEventBus.on('run:switched', ({ runId }) => {
    _activeId = runId;
    applyFilters();
  });

  return { applyFilters, viewRun, clearFilter, clearAllFilters };

})();

window.SarvaRuns = SarvaRuns;
