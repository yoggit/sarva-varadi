/**
 * Test Detail micro-app — drawer panel.
 * Opens when a test row is clicked. Shows per-test history trend, steps, error, attachments.
 * Clicking any history bar or row loads that run's data dynamically.
 */
const SarvaTestDetail = (() => {

  const drawer        = () => document.getElementById('sv-drawer');
  const overlay       = () => document.getElementById('sv-drawer-overlay');
  const titleEl       = () => document.getElementById('sv-drawer-title');
  const subEl         = () => document.getElementById('sv-drawer-sub');
  const bodyEl        = () => document.getElementById('sv-drawer-body');

  let _openTest      = null;  // current-run test object
  let _selectedRunId = null;  // run selected in history table/chart
  let _histChart     = null;  // echarts instance (disposed on close/reopen)
  let _histHistory   = null;  // full history array
  let _histViewN     = 20;    // runs shown in chart: 20 / 50 / 100 / 0=all
  let _currentIndex  = -1;    // position in current visible test list (for arrow nav)

  function open(uuid) {
    const test = SarvaStore.tests.find(t => t.uuid === uuid) ||
                 (SarvaStore.stats.finalTests || []).find(t => t.uuid === uuid);
    if (!test) return;

    _openTest = test;
    _selectedRunId = null;
    _histViewN = 20;
    if (_histChart) { _histChart.dispose(); _histChart = null; }
    _currentIndex = _getVisible().findIndex(t => t.uuid === uuid);
    updateNavUI();

    const status = test.status === 'broken' ? 'failed' : test.status;

    /* Latest run timestamp: newest entry in testHistory, fallback to SarvaStore.history[0] */
    const _th = SarvaStore.getTestHistory(test.tool, test.fullName);
    const latestTs = _th.length > 0
      ? _th[_th.length - 1].timestamp
      : ((SarvaStore.history || [])[0]?.timestamp || 0);
    const latestDt = latestTs ? new Date(latestTs).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }) : '';

    if (titleEl()) titleEl().textContent = test.name;
    if (subEl())   subEl().innerHTML = `
      <span style="font-size:0.65rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);">Latest Run</span>${latestDt ? `<span style="font-size:0.72rem;color:var(--text-muted);margin:0 0.35rem;">·</span><span style="font-size:0.72rem;color:var(--text-muted);">${latestDt}</span>` : ''}<span style="margin-left:0.6rem;"><span class="sv-pill ${status}">${status}</span></span><span style="margin-left:0.5rem;color:var(--text-muted);">${fmtDuration(test.duration)}</span>
    `;

    if (bodyEl()) bodyEl().innerHTML = renderBody(test);

    const testHistory = SarvaStore.getTestHistory(test.tool, test.fullName);
    _histHistory = testHistory;
    const initialSlice = _histViewN > 0 ? testHistory.slice(-_histViewN) : testHistory;
    if (testHistory.length > 1) {
      if (typeof echarts !== 'undefined') {
        renderHistoryChart(initialSlice);
      } else {
        SarvaEventBus.on('echarts:ready', () => renderHistoryChart(initialSlice));
      }
    }

    drawer()?.classList.add('open');
    overlay()?.classList.add('open');
  }

  function close() {
    drawer()?.classList.remove('open');
    overlay()?.classList.remove('open');
    if (_histChart) { _histChart.dispose(); _histChart = null; }
    _currentIndex = -1;
    const navEl = document.getElementById('sv-drawer-nav');
    if (navEl) navEl.style.display = 'none';
  }

  function setHistoryView(n) {
    if (!_histHistory) return;
    _histViewN = n;
    const sliced = n > 0 ? _histHistory.slice(-n) : _histHistory;

    /* Update run count label */
    const countEl = document.getElementById('sv-hist-run-count');
    if (countEl) countEl.textContent = sliced.length + ' runs';

    /* Re-render filter buttons with updated active state */
    document.querySelectorAll('[data-sv-hist-filter]').forEach(btn => {
      const v = +btn.getAttribute('data-sv-hist-filter');
      const active = v === n;
      btn.style.borderColor = active ? 'var(--accent)' : 'var(--border)';
      btn.style.background  = active ? 'var(--accent-glow)' : 'var(--bg-surface-3)';
      btn.style.color       = active ? 'var(--accent)' : 'var(--text-muted)';
    });

    /* Re-render chart and table */
    const wrap = document.getElementById('sv-detail-history-wrap');
    if (!wrap) return;
    wrap.innerHTML = `
      <div id="sv-detail-history-chart" style="height:120px;cursor:pointer;"
           title="Click a bar to view that run's details"></div>
      ${renderHistoryTable(sliced)}`;
    if (typeof echarts !== 'undefined') renderHistoryChart(sliced);
  }

  /* ── Render the drawer body (static skeleton + dynamic section) ───────── */
  function renderBody(test) {
    let html = '';

    /* ── Per-test trend ──────────────────────────────────────────────────── */
    const testHistory = SarvaStore.getTestHistory(test.tool, test.fullName);
    const filterBtns = testHistory.length > 1 ? `
      <div style="display:flex;gap:4px;margin-left:auto;">
        ${[20,50,100,0].map(n => {
          const label = n === 0 ? 'All' : `Last ${n}`;
          const active = n === _histViewN;
          return `<button data-sv-hist-filter="${n}" onclick="SarvaTestDetail.setHistoryView(${n})"
            style="padding:0.15rem 0.5rem;font-size:0.65rem;font-weight:600;border-radius:4px;cursor:pointer;border:1px solid ${active ? 'var(--accent)' : 'var(--border)'};background:${active ? 'var(--accent-glow)' : 'var(--bg-surface-3)'};color:${active ? 'var(--accent)' : 'var(--text-muted)'};">${label}</button>`;
        }).join('')}
      </div>` : '';
    html += `
      <div>
        <div class="sv-section-label" style="display:flex;align-items:center;justify-content:space-between;">
          <span style="display:flex;align-items:center;">
            Test History
            ${testHistory.length > 1 ? `<span id="sv-hist-run-count" style="margin-left:0.5rem;font-size:0.68rem;color:var(--text-muted);font-weight:400;">${Math.min(_histViewN > 0 ? _histViewN : testHistory.length, testHistory.length)} runs</span>` : ''}
            ${filterBtns}
          </span>
          ${testHistory.length > 1 ? `<button class="sv-dl-btn" onclick="SarvaDownloadChart('sv-detail-history-chart','test-history.png','Test History')" data-sv-tip="Download chart as PNG"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>` : ''}
        </div>
        <div id="sv-detail-history-wrap">
          ${testHistory.length > 1
            ? `<div id="sv-detail-history-chart" style="height:120px;cursor:pointer;"
                    title="Click a bar to view that run's details"></div>`
            : `<div style="color:var(--text-muted);font-size:0.8rem;padding:0.75rem;
                 background:var(--bg-surface-2);border-radius:var(--radius-sm);text-align:center;">
                 Run the tests multiple times to see per-test trends here.
               </div>`
          }
          ${testHistory.length > 0 ? renderHistoryTable(_histViewN > 0 ? testHistory.slice(-_histViewN) : testHistory) : ''}
        </div>
      </div>`;

    /* ── Dynamic section: Error / Steps / Attachments / Test Info ─────────
         Populated from current run on open; replaced by selectRun() clicks.
         flex column with gap so inner sections are spaced the same as drawer-body children. */
    html += `<div id="sv-detail-dynamic" style="display:flex;flex-direction:column;gap:1.25rem;">${renderDynamic(test, test.start, true, false)}</div>`;

    return html;
  }

  /* ── Render the run-specific content (error, steps, attachments, meta) ── */
  /* timestamp = ms epoch; isLatest = current run; isRunFlaky = run was flaky (passed after retry) */
  function renderDynamic(test, timestamp, isLatest, isRunFlaky) {
    let html = '';

    /* ── Run timestamp banner ────────────────────────────────────────────── */
    if (timestamp) {
      const dt = new Date(timestamp).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      const label = isLatest ? `Latest Run &nbsp;·&nbsp; ${dt}` : `Run · ${dt}`;
      html += `
        <div style="text-align:center;position:relative;margin:0.25rem 0 0.5rem;">
          <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:var(--border);"></div>
          <span style="position:relative;display:inline-block;background:var(--bg-surface);
                       padding:0.2rem 0.9rem;border-radius:999px;border:1px solid var(--border);
                       font-size:0.72rem;color:var(--text-muted);white-space:nowrap;">
            ${label}
          </span>
        </div>`;
    }

    /* ── Flaky retry note ────────────────────────────────────────────────── */
    /* isRunFlaky is passed from selectRun (history entry status === 'flaky')
       or from open() when the current test status is flaky                  */
    const showFlakyNote = isRunFlaky || (!isLatest ? false : test.status === 'flaky');
    if (showFlakyNote && test.statusDetails) {
      html += `
        <div style="font-size:0.75rem;color:var(--status-flaky);padding:0.4rem 0.75rem;
                    background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);
                    border-radius:var(--radius-sm);">
          ⚠ Test passed after retry — error below is from the failed first attempt
        </div>`;
    }

    /* ── Error ───────────────────────────────────────────────────────────── */
    if (test.statusDetails) {
      const isFailed  = test.status === 'failed' || test.status === 'broken';
      const copyStyle = `font-size:0.63rem;padding:0.1rem 0.45rem;border-radius:3px;border:1px solid var(--border);background:var(--bg-surface-2);color:var(--text-muted);cursor:pointer;flex-shrink:0;`;
      html += `
        <div>
          <div class="sv-section-label">Error</div>
          <div class="sv-err-block">
            <div style="position:relative;">
              <div class="sv-err-msg" style="background:var(--status-failed-bg);border:1px solid rgba(244,63,94,0.2);
                          border-radius:var(--radius-sm);padding:0.85rem;padding-right:3.5rem;font-size:0.82rem;
                          color:var(--status-failed);font-family:'SF Mono','Fira Code',monospace;
                          white-space:pre-wrap;overflow-x:auto;">
                ${escHtml(test.statusDetails.message || '')}
              </div>
              <button style="${copyStyle};position:absolute;top:0.4rem;right:0.4rem;"
                      onclick="SarvaTestDetail.copyElem(this, this.closest('.sv-err-block').querySelector('.sv-err-msg'))">Copy</button>
            </div>
            ${test.statusDetails.trace ? `
              <details style="margin-top:0.5rem;" ${isFailed ? 'open' : ''}>
                <summary style="font-size:0.75rem;color:var(--text-muted);cursor:pointer;display:flex;align-items:center;gap:0.5rem;user-select:none;">
                  Stack Trace
                  <button style="${copyStyle};margin-left:auto;"
                          onclick="event.stopPropagation();SarvaTestDetail.copyElem(this, this.closest('details').querySelector('pre'))">Copy</button>
                </summary>
                <pre style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.5rem;
                            overflow-x:auto;padding:0.75rem;background:var(--bg-surface-2);
                            border-radius:var(--radius-sm);">${escHtml(test.statusDetails.trace)}</pre>
              </details>` : ''}
          </div>
        </div>`;
    }

    /* ── Steps ───────────────────────────────────────────────────────────── */
    if (test.steps && test.steps.length > 0) {
      html += `
        <div>
          <div class="sv-section-label">Steps (${test.steps.length})</div>
          <div style="display:flex;flex-direction:column;gap:2px;">
            ${renderSteps(test.steps)}
          </div>
        </div>`;
    }

    /* ── Attachments ─────────────────────────────────────────────────────── */
    if (test.attachments && test.attachments.length > 0) {
      html += `
        <div>
          <div class="sv-section-label">Attachments</div>
          <div style="display:flex;flex-wrap:wrap;gap:0.75rem;">
            ${renderAttachments(test.attachments)}
          </div>
        </div>`;
    }

    /* ── Meta ────────────────────────────────────────────────────────────── */
    html += `
      <div>
        <div class="sv-section-label">Test Info</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
          <div style="grid-column:1/-1;">${metaRow('Suite', test.fullName)}</div>
          ${metaRow('Tool', test.tool)}
          ${test.extra?.playwright?.browser ? metaRow('Browser', test.extra.playwright.browser) : ''}
          ${test.extra?.selenium?.browserName ? metaRow('Browser', test.extra.selenium.browserName) : ''}
          ${metaRow('Started', test.start ? new Date(test.start).toLocaleTimeString() : '—')}
          ${metaRow('Duration', fmtDuration(test.duration))}
        </div>
      </div>`;

    return html;
  }

  /* ── Load and display a historical run ──────────────────────────────────
     Fetches ./history/<runId>/data.json, finds this test by fullName,
     then re-renders the dynamic section.  Falls back to current-run data
     on any error (e.g. file:// protocol, missing file).              ──── */
  async function selectRun(runId) {
    if (!_openTest || !runId) return;
    _selectedRunId = runId;

    /* Highlight the selected table row */
    document.querySelectorAll('[data-sv-run-row]').forEach(el => {
      const sel = el.getAttribute('data-sv-run-row') === runId;
      el.style.background = sel ? 'var(--bg-hover)'         : 'var(--bg-surface-2)';
      el.style.outline    = sel ? '1px solid var(--accent)'  : '';
      el.style.fontWeight = sel ? '600'                      : '';
    });

    const dynEl = document.getElementById('sv-detail-dynamic');
    if (!dynEl) return;

    /* If data already loaded from a previous click, use it immediately */
    const cached = window.SarvaRunData && window.SarvaRunData[runId];
    const histEntry = (_histHistory || []).find(h => h.runId === runId);
    const isRunFlaky = !!(histEntry && histEntry.status === 'flaky');
    if (cached) {
      const found = cached.find(t => t.fullName === _openTest.fullName);
      if (found) { dynEl.innerHTML = renderDynamic(found, _runTimestamp(runId), false, isRunFlaky); return; }
    }

    dynEl.innerHTML = `
      <div style="text-align:center;color:var(--text-muted);padding:1.5rem;font-size:0.82rem;">
        Loading run data…
      </div>`;

    /* Load via <script> tag — works with file:// (unlike fetch/XHR) */
    await new Promise(resolve => {
      const s = document.createElement('script');
      s.src = `./history/${runId}/data.js`;
      s.onload  = resolve;
      s.onerror = resolve; // resolve either way; we check below
      document.head.appendChild(s);
    });

    const runData = window.SarvaRunData && window.SarvaRunData[runId];
    if (runData) {
      const found = runData.find(t => t.fullName === _openTest.fullName);
      if (found) {
        dynEl.innerHTML = renderDynamic(found, _runTimestamp(runId), false, isRunFlaky);
        return;
      }
    }

    /* Fallback: show current run data with a note */
    dynEl.innerHTML = `
      <div style="color:var(--text-muted);font-size:0.75rem;padding:0.45rem 0.75rem;
                  background:var(--bg-surface-2);border-radius:var(--radius-sm);">
        Historical detail unavailable — showing current run
      </div>` + renderDynamic(_openTest, _openTest.start, true, _openTest.status === 'flaky');
  }

  function _runTimestamp(runId) {
    const run = (SarvaStore.history || []).find(r => r.id === runId);
    return run ? run.timestamp : 0;
  }

  function renderHistoryTable(history) {
    const last5 = history.slice(-5).reverse();
    return `
      <div style="margin-top:0.75rem;display:flex;flex-direction:column;gap:2px;">
        ${last5.map(h => `
          <div data-sv-run-row="${h.runId}"
               onclick="SarvaTestDetail.selectRun('${h.runId}')"
               style="display:flex;align-items:center;gap:0.6rem;font-size:0.75rem;
                      padding:0.3rem 0.5rem;border-radius:var(--radius-sm);
                      background:var(--bg-surface-2);cursor:pointer;
                      transition:background 0.15s,outline 0.15s;"
               onmouseenter="if(this.getAttribute('data-sv-run-row')!=='${h.runId}' || !this.style.outline) this.style.background='var(--bg-hover)'"
               onmouseleave="if(!this.style.outline||this.style.outline==='') this.style.background='var(--bg-surface-2)'">
            <span class="sv-pill ${h.status === 'broken' ? 'failed' : h.status}" style="font-size:0.65rem;">
              ${h.status}
            </span>
            <span style="color:var(--text-muted);">${h.timestamp ? new Date(h.timestamp).toLocaleString(undefined, { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}</span>
            <span style="margin-left:auto;color:var(--text-secondary);font-variant-numeric:tabular-nums;">
              ${fmtDuration(h.duration)}
            </span>
          </div>
        `).join('')}
      </div>`;
  }

  function renderHistoryChart(history) {
    const el = document.getElementById('sv-detail-history-chart');
    if (!el || typeof echarts === 'undefined') return;
    if (_histChart) { _histChart.dispose(); _histChart = null; }

    const isDark = !document.body.classList.contains('light-mode');
    const chart = echarts.init(el, null, { renderer: 'svg' });
    _histChart = chart;

    const xData = history.map((_, i) => `#${i + 1}`);
    const yDur  = history.map(h => Math.round(h.duration / 1000 * 10) / 10);
    const colors = history.map(h => {
      if (h.status === 'passed') return '#22c55e';
      if (h.status === 'failed' || h.status === 'broken') return '#f43f5e';
      if (h.status === 'flaky') return '#f59e0b';
      return '#64748b';
    });

    chart.setOption({
      backgroundColor: 'transparent',
      grid: { top: 8, right: 8, bottom: 20, left: 44 },
      xAxis: {
        type: 'category', data: xData,
        axisLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' } },
        axisTick: { show: false },
        axisLabel: { color: isDark ? '#8b92a8' : '#4b5268', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: value => Math.max(value.max * 1.1, value.max + 0.5),
        splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } },
        axisLabel: { color: isDark ? '#8b92a8' : '#4b5268', fontSize: 10, formatter: v => parseFloat(v.toFixed(1)) + 's' },
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: p => {
          const h = history[p[0].dataIndex];
          const status = h.status === 'broken' ? 'failed' : h.status;
          const dt = h.timestamp ? new Date(h.timestamp).toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          }) : '';
          return `<b>Run ${p[0].name}</b>${dt ? `<br/><span style="color:#8b92a8;font-size:0.85em;">${dt}</span>` : ''}<br/>Status: <b>${status}</b><br/>Duration: <b>${fmtDuration(h.duration)}</b><br/><span style="color:#8b92a8;font-size:0.82em;">Click to view details</span>`;
        },
        backgroundColor: isDark ? '#1e2438' : '#fff',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        textStyle: { color: isDark ? '#e6eaf4' : '#1a1d2e', fontSize: 12 },
      },
      series: [{
        type: 'bar',
        data: yDur.map((v, i) => ({ value: v, itemStyle: { color: colors[i], borderRadius: [3,3,0,0] } })),
        barMaxWidth: 20,
        barMinHeight: 3,
        emphasis: { itemStyle: { opacity: 0.75 } },
      }],
    });

    /* Click a bar → load that run's details */
    chart.on('click', params => {
      const entry = history[params.dataIndex];
      if (entry && entry.runId) selectRun(entry.runId);
    });
  }

  /* ── Keyboard / nav helpers ─────────────────────────────────────────────── */
  function _getVisible() {
    return typeof SarvaTestList !== 'undefined' && SarvaTestList.getVisible
      ? SarvaTestList.getVisible() : [];
  }

  function updateNavUI() {
    const navEl = document.getElementById('sv-drawer-nav');
    if (!navEl) return;
    const visible = _getVisible();
    const total   = visible.length;
    if (total <= 1 || _currentIndex < 0) { navEl.style.display = 'none'; return; }
    const pos     = _currentIndex + 1;
    const isFirst = _currentIndex <= 0;
    const isLast  = _currentIndex >= total - 1;
    const base    = `padding:0.25rem 0.55rem;background:var(--bg-surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.85rem;line-height:1;cursor:pointer;transition:background var(--t-fast);`;
    navEl.style.display = 'flex';
    navEl.innerHTML = `
      <button onclick="SarvaTestDetail.navigateTo(-1)" title="Previous test (↑)"
              style="${base}color:${isFirst ? 'var(--text-muted)' : 'var(--text-secondary)'};"
              ${isFirst ? 'disabled' : ''}
              onmouseenter="if(!this.disabled)this.style.background='var(--bg-hover)'"
              onmouseleave="this.style.background='var(--bg-surface-2)'">‹</button>
      <span style="font-size:0.7rem;color:var(--text-muted);white-space:nowrap;padding:0 0.15rem;">${pos} / ${total}</span>
      <button onclick="SarvaTestDetail.navigateTo(1)" title="Next test (↓)"
              style="${base}color:${isLast ? 'var(--text-muted)' : 'var(--text-secondary)'};"
              ${isLast ? 'disabled' : ''}
              onmouseenter="if(!this.disabled)this.style.background='var(--bg-hover)'"
              onmouseleave="this.style.background='var(--bg-surface-2)'">›</button>`;
  }

  function navigateTo(delta) {
    const visible = _getVisible();
    if (!visible.length) return;
    const newIdx = _currentIndex + delta;
    if (newIdx < 0 || newIdx >= visible.length) return;
    open(visible[newIdx].uuid);
    // Scroll the corresponding row into view in the test list
    document.querySelector(`[data-uuid="${visible[newIdx].uuid}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function copyElem(triggerEl, targetEl) {
    if (!targetEl) return;
    navigator.clipboard.writeText(targetEl.textContent.trim()).then(() => {
      const orig = triggerEl.textContent;
      triggerEl.textContent = 'Copied!';
      setTimeout(() => { triggerEl.textContent = orig; }, 1500);
    }, () => {});
  }

  function renderSteps(steps, level = 0) {
    return steps.map(step => {
      const status = step.status === 'broken' ? 'failed' : (step.status || 'passed');
      const icon   = status === 'passed' ? '✓' : status === 'failed' ? '✗' : status === 'skipped' ? '○' : '~';
      const color  = `var(--status-${status})`;
      const indent = level * 16;

      let html = `
        <div style="display:flex;align-items:flex-start;gap:0.5rem;padding:0.4rem 0.5rem;
                    margin-left:${indent}px;border-radius:var(--radius-sm);font-size:0.8rem;
                    background:var(--bg-surface-2);border-left:2px solid ${color};">
          <span style="color:${color};font-weight:700;flex-shrink:0;">${icon}</span>
          <span style="flex:1;color:var(--text-primary);">${escHtml(step.name)}</span>
          <span style="color:var(--text-muted);font-size:0.72rem;flex-shrink:0;">${fmtDuration(step.duration)}</span>
        </div>`;

      if (step.statusDetails?.message) {
        html += `
        <div style="margin-left:${indent + 16}px;padding:0.35rem 0.6rem;font-size:0.75rem;
                    font-family:'SF Mono','Fira Code',monospace;color:var(--text-secondary);
                    background:var(--bg-surface-3);border-radius:var(--radius-sm);
                    white-space:pre-wrap;overflow-x:auto;">
          ${escHtml(step.statusDetails.message)}
        </div>`;
      }

      if (step.steps && step.steps.length > 0) {
        html += `<div style="display:flex;flex-direction:column;gap:2px;margin-top:2px;">
                   ${renderSteps(step.steps, level + 1)}
                 </div>`;
      }

      return html;
    }).join('');
  }

  function renderAttachments(attachments) {
    return attachments.map(att => {
      const isImage = att.type === 'screenshot' || att.contentType?.startsWith('image/') || att.source?.match(/\.(png|jpg|jpeg|gif|webp)$/i) || att.name?.match(/\.(png|jpg|jpeg|gif|webp)$/i);
      const isVideo = att.type === 'video'      || att.contentType?.startsWith('video/') || att.source?.match(/\.(mp4|webm|mov)$/i)         || att.name?.match(/\.(mp4|webm|mov)$/i);
      const isTrace = att.type === 'trace' || att.name?.includes('trace');

      if (isImage) {
        return `<div style="border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border);width:min(320px,100%);">
          <a href="${att.source}" target="_blank" title="Click to view full size ↗">
            <img src="${att.source}" alt="${att.name}"
                 style="width:100%;max-height:220px;display:block;object-fit:contain;background:var(--bg-surface-2);">
          </a>
          <div style="padding:0.3rem 0.5rem;font-size:0.72rem;color:var(--text-muted);background:var(--bg-surface-2);display:flex;align-items:center;justify-content:space-between;">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(att.name)}</span>
            <span style="flex-shrink:0;color:var(--text-muted);opacity:0.6;font-size:0.65rem;margin-left:0.4rem;">↗ full size</span>
          </div>
        </div>`;
      }

      if (isVideo) {
        return `<div style="border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border);">
          <video src="${att.source}" controls style="max-width:240px;display:block;"></video>
          <div style="padding:0.3rem 0.5rem;font-size:0.72rem;color:var(--text-muted);">${escHtml(att.name)}</div>
        </div>`;
      }

      if (isTrace) {
        const traceFileName = (att.source || '').split('/').pop() || 'trace.zip';
        const viewerTip  = escHtml(`Opens trace.playwright.dev — works when report is served over HTTP (e.g. CI).\nFor local file:// reports: download and run:\nnpx playwright show-trace ${traceFileName}`);
        const downloadTip = escHtml(`Download ${traceFileName}, then open with:\nnpx playwright show-trace ${traceFileName}`);
        return `
          <div style="display:inline-flex;align-items:center;gap:0.5rem;">
            <a href="https://trace.playwright.dev/?trace=${att.source}" target="_blank"
               data-sv-tip="${viewerTip}"
               style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.45rem 0.85rem;
                      border-radius:var(--radius-sm);background:var(--accent-glow);color:var(--accent);
                      border:1px solid var(--accent);font-size:0.78rem;font-weight:500;text-decoration:none;">
              🔍 View Trace
            </a>
            <a href="${att.source}" target="_blank" download
               data-sv-tip="${downloadTip}"
               style="display:inline-flex;align-items:center;gap:0.3rem;padding:0.45rem 0.7rem;
                      border-radius:var(--radius-sm);background:var(--bg-surface-2);color:var(--text-secondary);
                      border:1px solid var(--border);font-size:0.78rem;text-decoration:none;">
              ⬇ Download
            </a>
          </div>`;
      }

      return `<a href="${att.source}" target="_blank"
               style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.45rem 0.85rem;
                      border-radius:var(--radius-sm);background:var(--bg-surface-2);color:var(--text-secondary);
                      border:1px solid var(--border);font-size:0.78rem;text-decoration:none;">
        📎 ${escHtml(att.name)}
      </a>`;
    }).join('');
  }

  function metaRow(label, value) {
    return `
      <div style="padding:0.4rem 0.6rem;background:var(--bg-surface-2);border-radius:var(--radius-sm);">
        <div style="font-size:0.68rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">${label}</div>
        <div style="font-size:0.8rem;color:var(--text-primary);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
             title="${escHtml(String(value || '—'))}">${escHtml(String(value || '—'))}</div>
      </div>`;
  }

  function fmtDuration(ms) {
    if (!ms) return '—';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Wire close handlers ────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sv-drawer-close')?.addEventListener('click', close);
    document.getElementById('sv-drawer-overlay')?.addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { close(); return; }
      if (!drawer()?.classList.contains('open')) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); navigateTo(1); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); navigateTo(-1); }
    });
  });

  return { open, close, selectRun, setHistoryView, navigateTo, copyElem };
})();

// Make accessible from inline onclick handlers
window.SarvaTestDetail = SarvaTestDetail;
