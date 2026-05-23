/**
 * Test List micro-app.
 * Renders filterable/searchable test rows with inline sparklines.
 * Clicking a row opens the Test Detail drawer.
 */
const SarvaTestList = (() => {

  let _tests   = [];
  let _filter  = 'all';
  let _sortCol = null;   // 'name' | 'status' | 'duration' | 'retries'
  let _sortDir = 'asc';  // 'asc' | 'desc'

  function calcTrend(hist) {
    // hist is oldest-first; compare last 2 runs vs the 3 before them
    const relevant = (hist || []).filter(h => h.status !== 'skipped').slice(-5);
    if (relevant.length < 3) return null;
    const score = h => h.status === 'passed' ? 1 : (h.status === 'flaky' || h.wasFlaky) ? 0.5 : 0;
    const recent = relevant.slice(-2).map(score);
    const older  = relevant.slice(0, -2).map(score);
    const avgR = recent.reduce((a, b) => a + b, 0) / recent.length;
    const avgO = older.reduce((a, b) => a + b, 0)  / older.length;
    const diff = avgR - avgO;
    if (diff > 0.2)  return 'up';
    if (diff < -0.2) return 'down';
    return 'stable';
  }

  function renderTrend(hist) {
    const t = calcTrend(hist);
    if (!t) return `<span style="color:var(--text-muted);opacity:0.35;font-size:0.78rem;cursor:default;" data-sv-tip="Not enough data yet (need 3+ runs)">·</span>`;
    const n = hist.filter(h => h.status !== 'skipped').length;
    if (t === 'up')     return `<span style="color:var(--status-passed);font-size:0.88rem;cursor:default;line-height:1;" data-sv-tip="Improving — pass rate rising over last ${Math.min(n,5)} runs">▲</span>`;
    if (t === 'down')   return `<span style="color:var(--status-failed);font-size:0.88rem;cursor:default;line-height:1;" data-sv-tip="Declining — more failures in recent runs (last ${Math.min(n,5)})">▼</span>`;
    return `<span style="color:var(--text-muted);font-size:0.82rem;cursor:default;line-height:1;" data-sv-tip="Stable — consistent results across last ${Math.min(n,5)} runs">—</span>`;
  }

  function renderSparkline(testHistory) {
    if (!testHistory || testHistory.length === 0) {
      return `<span style="color:var(--text-muted);font-size:0.72rem;">—</span>`;
    }
    const last10 = testHistory.slice(-10);
    const bars = last10.map(h => {
      const status = h.status === 'broken' ? 'failed' : (h.status || 'skipped');
      const height = status === 'passed' ? 16 : status === 'failed' ? 12 : status === 'flaky' ? 14 : 8;
      const label  = status === 'passed' ? 'Passed' : status === 'failed' ? 'Failed' : status === 'flaky' ? 'Flaky' : 'Skipped';
      const color  = status === 'passed' ? '#22c55e' : status === 'failed' ? '#f43f5e' : status === 'flaky' ? '#f59e0b' : '#64748b';
      const dt     = h.timestamp ? new Date(h.timestamp).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      }) : '';
      const dur    = h.duration ? (h.duration < 1000 ? `${h.duration}ms` : `${(h.duration / 1000).toFixed(1)}s`) : '';
      const tip    = `<b style="color:${color};">${label}</b>${dt ? `<br>${dt}` : ''}${dur ? `<br>${dur}` : ''}`;
      return `<span class="sv-spark-bar ${status}" style="height:${height}px;" data-sv-tip="${escHtml(tip)}"></span>`;
    }).join('');
    return `<span class="sv-sparkline">${bars}</span>`;
  }

  function renderRows(tests) {
    const container = document.getElementById('sv-test-rows');
    const empty     = document.getElementById('sv-test-empty');
    if (!container) return;

    /* Result count label */
    const countEl = document.getElementById('sv-test-count');
    if (countEl) {
      countEl.textContent = tests.length === _tests.length
        ? `${_tests.length} tests`
        : `${tests.length} of ${_tests.length} tests`;
    }

    if (tests.length === 0) {
      container.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    container.innerHTML = tests.map(t => {
      const status   = t.status === 'broken' ? 'failed' : t.status;
      const retries  = t.extra?.playwright?.retries || 0;
      const suite    = t.fullName !== t.name ? t.fullName.replace(t.name, '').replace(/\s*>\s*$/, '').trim() : '';
      const testHist = SarvaStore.getTestHistory(t.tool, t.fullName);

      // Clock icon: last run entry (history is oldest-first, so last = most recent)
      const lastH    = testHist.length > 0 ? testHist[testHist.length - 1] : null;
      const lastDt   = lastH && lastH.timestamp ? new Date(lastH.timestamp).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      }) : null;
      const clockLabel = lastH
        ? (lastH.status === 'failed' ? 'Last Failed' : lastH.status === 'flaky' ? 'Last Flaky' : lastH.status === 'skipped' ? 'Last Skipped' : 'Last Run')
        : null;
      const clockColor = lastH
        ? (lastH.status === 'failed' ? 'var(--status-failed)' : lastH.status === 'flaky' ? 'var(--status-flaky)' : lastH.status === 'skipped' ? 'var(--status-skipped)' : 'var(--status-passed)')
        : null;
      const clockTip  = lastDt ? escHtml(`<b>${clockLabel}:</b> ${lastDt}`) : null;
      const clockIcon = clockTip
        ? `<span data-sv-tip="${clockTip}" style="color:${clockColor};opacity:0.75;cursor:default;flex-shrink:0;display:inline-flex;align-items:center;margin-left:0.25rem;" onclick="event.stopPropagation()"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>`
        : '';

      return `
      <div class="sv-test-row ${status}" data-status="${status}" data-uuid="${t.uuid}"
           onclick="SarvaTestDetail.open('${t.uuid}')">
        <div style="overflow:hidden;">
          <div class="sv-test-name" style="display:flex;align-items:center;gap:0;min-width:0;"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1;">${escHtml(t.name)}</span>${severityBadge(t.labels)}${toolBadge(t.tool)}${browserBadge(t)}${clockIcon}</div>
          ${suite ? `<div class="sv-test-suite sv-truncate">${escHtml(suite)}</div>` : ''}
        </div>
        <div style="text-align:center;">
          <span class="sv-pill ${status}">${status === 'passed' ? '✓' : status === 'failed' ? '✗' : status === 'flaky' ? '~' : '○'} ${status}</span>
        </div>
        <div class="sv-test-duration">${fmtDuration(t.duration)}</div>
        <div style="display:flex;align-items:center;justify-content:center;">
          ${renderSparkline(testHist)}
        </div>
        <div style="display:flex;align-items:center;justify-content:center;" onclick="event.stopPropagation()">
          ${renderTrend(testHist)}
        </div>
        <div class="sv-test-retries ${retries > 0 ? 'has-retries' : ''}">
          ${retries > 0 ? `<span style="display:inline-flex;align-items:center;gap:0.25rem;color:var(--status-flaky);font-weight:600;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>${retries}</span>` : '—'}
        </div>
        <div class="sv-test-chevron">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>`;
    }).join('');
  }

  const _statusOrder = { failed: 0, broken: 0, flaky: 1, skipped: 2, passed: 3 };

  function getVisible() {
    const q = (document.getElementById('sv-test-search')?.value || '').toLowerCase().trim();
    let result = _tests.filter(t => {
      const statusMatch = _filter === 'all' || t.status === _filter || (t.status === 'broken' && _filter === 'failed');
      const searchMatch = !q || t.name.toLowerCase().includes(q) || t.fullName.toLowerCase().includes(q);
      return statusMatch && searchMatch;
    });

    if (_sortCol) {
      const dir = _sortDir === 'asc' ? 1 : -1;
      result = [...result].sort((a, b) => {
        switch (_sortCol) {
          case 'name':     return dir * a.name.localeCompare(b.name);
          case 'status':   return dir * ((_statusOrder[a.status] ?? 4) - (_statusOrder[b.status] ?? 4));
          case 'duration': return dir * ((a.duration || 0) - (b.duration || 0));
          case 'retries':  return dir * ((a.extra?.playwright?.retries || 0) - (b.extra?.playwright?.retries || 0));
          default:         return 0;
        }
      });
    }
    return result;
  }

  function filter() {
    renderRows(getVisible());
  }

  function setFilter(f, btn) {
    _filter = f;
    document.querySelectorAll('.sv-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    filter();
  }

  function updateSortIcons() {
    document.querySelectorAll('[data-sv-sort-col]').forEach(el => {
      const c    = el.getAttribute('data-sv-sort-col');
      const icon = el.querySelector('.sv-sort-icon');
      if (!icon) return;
      if (c === _sortCol) {
        icon.textContent   = _sortDir === 'asc' ? '↑' : '↓';
        icon.style.opacity = '1';
        el.style.color     = 'var(--text-primary)';
      } else {
        icon.textContent   = '⇅';
        icon.style.opacity = '0.5';
        el.style.color     = '';
      }
    });
  }

  function setSort(col) {
    if (_sortCol === col) {
      if (_sortDir === 'asc') {
        _sortDir = 'desc';            // 2nd click: reverse
      } else {
        _sortCol = null;              // 3rd click: clear back to run order
        _sortDir = 'asc';
      }
    } else {
      _sortCol = col;
      _sortDir = 'asc';              // 1st click on new column
    }
    updateSortIcons();
    filter();
  }

  function updateFilterCounts() {
    const counts = { all: _tests.length, passed: 0, failed: 0, flaky: 0, skipped: 0 };
    _tests.forEach(t => {
      const s = t.status === 'broken' ? 'failed' : t.status;
      if (s in counts) counts[s]++;
    });
    document.querySelectorAll('.sv-filter-btn[data-filter]').forEach(btn => {
      const f = btn.getAttribute('data-filter');
      if (f && f in counts) {
        const label = f.charAt(0).toUpperCase() + f.slice(1);
        btn.textContent = counts[f] > 0 ? `${label} (${counts[f]})` : label;
      }
    });
  }

  /* ── Utils ──────────────────────────────────────────────────────────────────── */
  function fmtDuration(ms) {
    if (!ms) return '—';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function severityBadge(labels) {
    // Supports both {name:'severity', value:'high'} and Cucumber tag format {name:'tag', value:'severity:high'}
    const direct = (labels || []).find(l => l.name === 'severity');
    const tagged = !direct && (labels || []).find(l => l.name === 'tag' && (l.value || '').startsWith('severity:'));
    const sev = direct ? (direct.value || '').toLowerCase() : tagged ? tagged.value.slice(9).toLowerCase() : '';
    if (!sev) return '';
    return `<span class="sv-severity-badge ${escHtml(sev)}">${escHtml(sev)}</span>`;
  }

  function toolBadge(tool) {
    if (!tool) return '';
    const map = { playwright:'playwright', selenium:'selenium', 'rest-assured':'rest-assured', cypress:'cypress', cucumber:'cucumber' };
    const cls = map[tool] || '';
    return `<span class="sv-tool-badge ${cls}">${tool}</span>`;
  }

  function browserBadge(t) {
    const browser = t.extra?.playwright?.browser || t.extra?.selenium?.browserName;
    if (browser) return `<span class="sv-browser-badge">${browser}</span>`;
    // Fallback: extract from fullName first segment (e.g. "chromium > spec > test")
    const seg = t.fullName ? t.fullName.split('>')[0].trim() : '';
    if (seg && !seg.includes('.') && !seg.includes('/') && seg !== t.name) {
      return `<span class="sv-browser-badge">${seg}</span>`;
    }
    return '';
  }

  /* ── Boot ───────────────────────────────────────────────────────────────────── */
  SarvaEventBus.on('store:ready', ({ stats }) => {
    _tests = stats.finalTests || [];
    updateFilterCounts();
    renderRows(_tests);
  });

  function downloadCsv() {
    const rows = getVisible();
    const esc = v => {
      const s = String(v == null ? '' : v);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const fmtDur = ms => ms > 0 ? (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`) : '';
    const header = ['Name', 'Suite', 'Status', 'Duration', 'Retries', 'Browser', 'Tool', 'Full Name'];
    const lines  = [header.join(',')];
    rows.forEach(t => {
      const status  = t.status === 'broken' ? 'failed' : (t.status || '');
      const suite   = t.fullName !== t.name ? t.fullName.replace(t.name, '').replace(/\s*>\s*$/, '').trim() : '';
      const retries = t.extra?.playwright?.retries || 0;
      const browser = t.extra?.playwright?.browser || t.extra?.selenium?.browserName ||
        (t.fullName ? t.fullName.split('>')[0].trim() : '') || '';
      lines.push([t.name, suite, status, fmtDur(t.duration), retries, browser, t.tool || '', t.fullName].map(esc).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `sarva-tests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { filter, setFilter, setSort, getVisible, downloadCsv };
})();

// Make accessible from inline onclick handlers
window.SarvaTestList = SarvaTestList;
