/**
 * Timeline micro-app.
 * Run Cadence: bar chart — when each run happened and how long it took.
 * Execution Gantt: ECharts custom series showing per-test parallel execution.
 *
 * Works across all adapters (Playwright, Selenium, RestAssured).
 * Gantt requires per-test start timestamps; falls back gracefully when absent.
 */
const SarvaTimeline = (() => {

  let _charts          = {};
  let _cadenceFilterN  = 20; // default: last 20 runs
  let _activeRunId     = null;
  let _centeredSlice   = null; // { sliceStart, sliceEnd } in oldest-first sorted history

  /* ── Utilities ──────────────────────────────────────────────────────────── */
  function fmtDur(ms) {
    if (!ms || ms <= 0) return '—';
    if (ms < 1000)  return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  function fmtDate(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function truncate(s, n) {
    return s && s.length > n ? s.slice(0, n - 1) + '…' : (s || '');
  }

  function initChart(id, renderer) {
    const el = document.getElementById(id);
    if (!el) return null;
    if (_charts[id]) { try { _charts[id].dispose(); } catch(e) {} }
    const c = echarts.init(el, null, { renderer: renderer || 'canvas' });
    _charts[id] = c;
    return c;
  }

  function clrs() {
    const isDark = !document.body.classList.contains('light-mode');
    return {
      isDark,
      label:  isDark ? '#8b92a8' : '#4b5268',
      split:  isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      tipBg:  isDark ? '#1e2438' : '#fff',
      tipBdr: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      tipTxt: isDark ? '#e6eaf4' : '#1a1d2e',
    };
  }

  function statusColor(s) {
    if (s === 'passed')  return '#22c55e';
    if (s === 'failed' || s === 'broken') return '#f43f5e';
    if (s === 'flaky')   return '#f59e0b';
    return '#64748b';
  }

  /* ── Run Cadence marker (vertical dashed line for selected historical run) ── */
  function _cadenceMarkerSeries(display, xData) {
    if (!_activeRunId) return [];
    const mi = display.findIndex(r => r.id === _activeRunId);
    if (mi === -1) return [];
    // run number in the full history (oldest-first counting)
    const allHistory = SarvaStore.history || [];
    const sorted     = allHistory.slice().sort((a, b) => a.timestamp - b.timestamp);
    const fullIdx    = sorted.findIndex(r => r.id === _activeRunId);
    const runNum     = fullIdx >= 0 ? fullIdx + 1 : mi + 1;
    return [{
      type: 'line', data: [], animation: false,
      lineStyle: { opacity: 0 }, itemStyle: { opacity: 0 }, symbol: 'none',
      markLine: {
        silent: true, symbol: ['none', 'none'],
        data: [{
          xAxis: xData[mi],
          lineStyle: { color: 'rgba(129,140,248,0.9)', type: 'dashed', width: 1.5 },
          label: {
            show: true, position: 'insideStartTop',
            formatter: `Run #${runNum}`,
            color: '#818cf8', fontSize: 9,
            backgroundColor: 'rgba(16,20,32,0.75)',
            padding: [2, 4, 2, 4], borderRadius: 3,
          },
        }],
      },
    }];
  }

  /* ── Run Cadence ────────────────────────────────────────────────────────── */
  function setCadenceFilter(n, btn) {
    _cadenceFilterN = n;
    _centeredSlice  = null;
    _activeRunId    = null; // suppress marker for this visit only — re-syncs on next nav:change
    document.querySelectorAll('.sv-cadence-run-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    // Hide banner locally without touching global history state (other views stay in history mode)
    const banner = document.getElementById('sv-viewing-banner');
    if (banner) banner.style.display = 'none';
    if (typeof echarts !== 'undefined') {
      renderRunCadence();
      renderTimelinePrintInsights();
    }
  }

  function _applyCadenCentering(sorted) {
    // sorted = oldest-first array from SarvaStore.history
    if (!_activeRunId || !sorted || sorted.length === 0) { _centeredSlice = null; return; }
    const hi = sorted.findIndex(r => r.id === _activeRunId);
    if (hi === -1) { _centeredSlice = null; return; }
    // In oldest-first sorted array: position hi; current window is the LAST _cadenceFilterN items
    const windowStart = _cadenceFilterN > 0 ? Math.max(0, sorted.length - _cadenceFilterN) : 0;
    const windowEnd   = sorted.length;
    if (_cadenceFilterN > 0 && hi >= windowStart && hi < windowEnd) {
      _centeredSlice = null; return; // visible in current window
    }
    // Center a 20-run window around hi in sorted (oldest-first)
    const windowSize = 20;
    let sliceStart = Math.max(0, hi - 9);
    let sliceEnd   = Math.min(sorted.length, sliceStart + windowSize);
    sliceStart = Math.max(0, sliceEnd - windowSize);
    _centeredSlice = { sliceStart, sliceEnd };
    document.querySelectorAll('.sv-cadence-run-btn').forEach(b => b.classList.remove('active'));
  }

  function renderRunCadence() {
    const allHistory = SarvaStore.history;
    const lbl     = document.getElementById('sv-cadence-label');
    const empty   = document.getElementById('sv-cadence-empty');
    const chartEl = document.getElementById('sv-cadence-chart');
    if (!chartEl) return;

    if (!allHistory || allHistory.length < 2) {
      chartEl.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    chartEl.style.display = '';

    // Sort all history oldest → newest, then apply filter (keep most recent N)
    const sorted = allHistory.slice().sort((a, b) => a.timestamp - b.timestamp);
    _applyCadenCentering(sorted);
    let history;
    if (_centeredSlice) {
      history = sorted.slice(_centeredSlice.sliceStart, _centeredSlice.sliceEnd);
      // Label shows the run number range (oldest-first: run #1 = index 0)
      const hi           = sorted.findIndex(r => r.id === _activeRunId);
      const runNumOldest = _centeredSlice.sliceStart + 1;
      const runNumNewest = _centeredSlice.sliceEnd;
      const activeRunNum = hi + 1;
      if (lbl) lbl.textContent = `Runs #${runNumOldest}–#${runNumNewest} · centered on Run #${activeRunNum}`;
    } else {
      history = _cadenceFilterN > 0 ? sorted.slice(-_cadenceFilterN) : sorted;
      if (lbl) lbl.textContent = _cadenceFilterN > 0 && allHistory.length > _cadenceFilterN
        ? `Last ${history.length} of ${allHistory.length} runs`
        : `${history.length} runs`;
    }

    // oldest → newest (already sorted)
    const display = history;

    const chart = initChart('sv-cadence-chart', 'canvas');
    if (!chart) return;

    const { label, split, tipBg, tipBdr, tipTxt } = clrs();

    // Short label: "M/D H:MMam" or "M/D/YY H:MMam" when data spans multiple years
    const years = new Set(display.map(r => r.timestamp ? new Date(r.timestamp).getFullYear() : null));
    const showYear = years.size > 1;
    const fmtShort = ts => {
      if (!ts) return '';
      const d  = new Date(ts);
      const mo = d.getMonth() + 1;
      const da = d.getDate();
      const yr = showYear ? `/${String(d.getFullYear()).slice(-2)}` : '';
      let   hr = d.getHours();
      const mi = String(d.getMinutes()).padStart(2, '0');
      const ap = hr >= 12 ? 'pm' : 'am';
      hr = hr % 12 || 12;
      return `${mo}/${da}${yr} ${hr}:${mi}${ap}`;
    };

    const xData = display.map(r => fmtShort(r.timestamp) || `#${display.indexOf(r) + 1}`);
    const durs  = display.map(r => r.duration > 0 ? +(r.duration / 1000).toFixed(1) : 0);

    const barColors = display.map(r => {
      const t = (r.passed||0) + (r.failed||0) + (r.flaky||0) + (r.skipped||0);
      const pr = t > 0 ? r.passed / t : 0;
      if (pr >= 0.95) return '#22c55e';
      if (pr >= 0.8)  return '#f59e0b';
      return '#f43f5e';
    });

    // Rotate only when bars are dense; short format needs less rotation
    const rotate   = display.length > 15 ? 30 : 0;
    const interval = display.length <= 20 ? 0 : Math.max(0, Math.ceil(display.length / 14) - 1);

    chart.setOption({
      backgroundColor: 'transparent',
      // grid.left:80 ensures first rotated label never clips, regardless of date format width
      grid: { top: 16, right: 16, bottom: rotate > 0 ? 120 : 92, left: 80 },
      xAxis: {
        type: 'category', data: xData,
        axisLine: { lineStyle: { color: label } }, axisTick: { show: false },
        axisLabel: {
          color: label, fontSize: 11,
          rotate,
          interval,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value', min: 0,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: label, fontSize: 11, formatter: v => `${v}s` },
        splitLine: { lineStyle: { color: split } },
        minInterval: 1,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: tipBg, borderColor: tipBdr,
        textStyle: { color: tipTxt, fontSize: 12 },
        formatter: p => {
          const r = display[p.dataIndex];
          const t = (r.passed||0)+(r.failed||0)+(r.flaky||0)+(r.skipped||0);
          const pr = t > 0 ? +((r.passed / t) * 100).toFixed(1) : 0;
          const dot = c => `<span style="display:inline-block;margin-right:4px;border-radius:50%;width:9px;height:9px;background:${c};flex-shrink:0;"></span>`;
          const row = (color, label, val) => val > 0
            ? `<br/>${dot(color)}${label}: <b>${val}</b>` : '';
          return `<b>${fmtDate(r.timestamp) || `Run #${p.dataIndex+1}`}</b>`
            + `<br/><span style="color:#8b92a8;font-size:0.85em;">Duration: ${fmtDur(r.duration)}</span>`
            + row('#22c55e', 'Passed',  r.passed  || 0)
            + row('#f43f5e', 'Failed',  r.failed  || 0)
            + row('#f59e0b', 'Flaky',   r.flaky   || 0)
            + row('#94a3b8', 'Skipped', r.skipped || 0)
            + `<br/><span style="color:#6366f1;">Pass rate: <b>${pr}%</b></span>`;
        },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0, zoomOnMouseWheel: true, moveOnMouseMove: true },
        { type: 'slider', xAxisIndex: 0, bottom: 8, height: 16,
          borderColor: tipBdr, fillerColor: 'rgba(99,102,241,0.15)',
          handleStyle: { color: '#6366f1' }, textStyle: { color: label, fontSize: 10 },
          showDataShadow: false, showDetail: false },
      ],
      series: [
        {
          type: 'bar', data: durs.map((v, i) => ({ value: v, itemStyle: { color: barColors[i] } })),
          itemStyle: { borderRadius: [3, 3, 0, 0] },
          emphasis: { itemStyle: { opacity: 0.8 } },
          barMaxWidth: 32,
        },
        ..._cadenceMarkerSeries(display, xData),
      ],
    });

    SarvaEventBus.on('theme:changed', () => renderRunCadence());
  }

  /* ── Execution Gantt ────────────────────────────────────────────────────── */
  function renderGantt() {
    const lbl     = document.getElementById('sv-gantt-label');
    const empty   = document.getElementById('sv-gantt-empty');
    const chartEl = document.getElementById('sv-gantt-chart');
    if (!chartEl) return;

    // Update title to reflect whether we're viewing history or the current run
    const titleEl = document.getElementById('sv-gantt-title');
    if (titleEl) {
      if (_activeRunId) {
        const allHistory = SarvaStore.history || [];
        const sorted = allHistory.slice().sort((a, b) => a.timestamp - b.timestamp);
        const hi = sorted.findIndex(r => r.id === _activeRunId);
        const runNum = hi >= 0 ? hi + 1 : '?';
        titleEl.textContent = `Execution Gantt — Run #${runNum}`;
      } else {
        titleEl.textContent = 'Execution Gantt — Current Run';
      }
    }

    const tests = (SarvaStore.stats && SarvaStore.stats.finalTests) || SarvaStore.tests || [];
    if (!tests.length) {
      chartEl.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }

    // Check if start times are meaningful (non-zero and at least somewhat varied)
    const starts = tests.map(t => t.start || 0).filter(s => s > 0);
    const hasStartTimes = starts.length > 0 && (Math.max(...starts) - Math.min(...starts)) > 0;

    if (!hasStartTimes) {
      chartEl.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    // Sort by start time
    const sorted = tests
      .filter(t => t.start > 0)
      .slice()
      .sort((a, b) => (a.start || 0) - (b.start || 0));

    const minStart = sorted[0].start;
    const maxEnd   = Math.max(...sorted.map(t => (t.start || 0) + (t.duration || 0) - minStart));

    if (lbl) lbl.textContent = `${sorted.length} tests`;

    const rowH  = 30;
    const MAX_VISIBLE = 14;
    const hasScroll = sorted.length > MAX_VISIBLE;
    const totalH = hasScroll
      ? MAX_VISIBLE * rowH + 90
      : Math.max(200, sorted.length * rowH + 90);
    chartEl.style.height = `${totalH}px`;

    const chart = initChart('sv-gantt-chart', 'canvas');
    if (!chart) return;

    const { isDark, label, split, tipBg, tipBdr, tipTxt } = clrs();

    // Category names (y-axis), same order as sorted (bottom-to-top in ECharts)
    const categories = sorted.map(t => t.name);
    const maxNameLen = Math.max(...categories.map(c => c.length));
    const leftPad    = Math.min(340, Math.max(140, Math.round(maxNameLen * 7)));

    // Each data item: [categoryIndex, startOffset, endOffset]
    const seriesData = sorted.map((t, i) => {
      const s = (t.start || 0) - minStart;
      const e = s + (t.duration || 0);
      const status = t.status === 'broken' ? 'failed' : (t.status || 'skipped');
      return {
        value: [i, s, Math.max(e, s + 2), status],
        itemStyle: { color: statusColor(status) },
        name: t.name,
        uuid: t.uuid,
        duration: t.duration,
        status,
      };
    });

    const dzStart = hasScroll ? Math.max(0, 100 - (MAX_VISIBLE / sorted.length) * 100) : 0;

    chart.setOption({
      backgroundColor: 'transparent',
      grid: { top: 8, right: hasScroll ? 36 : 16, bottom: 32, left: leftPad },
      xAxis: {
        type: 'value', min: 0, max: maxEnd,
        axisLine: { lineStyle: { color: label } }, axisTick: { show: false },
        axisLabel: {
          color: label, fontSize: 11,
          formatter: v => v < 1000 ? `${v}ms` : v < 60000 ? `${(v/1000).toFixed(0)}s` : `${(v/60000).toFixed(1)}m`,
        },
        splitLine: { lineStyle: { color: split } },
      },
      yAxis: {
        type: 'category', data: categories,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: label, fontSize: 12, align: 'right', width: leftPad - 10 },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: tipBg, borderColor: tipBdr,
        textStyle: { color: tipTxt, fontSize: 12 },
        formatter: p => {
          const d  = p.data;
          const s  = d.value[1];
          const e  = d.value[2];
          const sc = statusColor(d.status);
          const statusLabel = d.status.charAt(0).toUpperCase() + d.status.slice(1);
          return `<b>${escHtml(d.name)}</b>`
            + `<br/><span style="color:${sc};">● ${statusLabel}</span>`
            + `<br/>Start: <b>${s < 1000 ? s+'ms' : (s/1000).toFixed(2)+'s'}</b> from run start`
            + `<br/>Duration: <b>${fmtDur(d.duration)}</b>`;
        },
      },
      dataZoom: hasScroll ? [
        {
          type: 'slider',
          orient: 'vertical',
          right: 4,
          top: 8,
          bottom: 32,
          width: 18,
          start: dzStart,
          end: 100,
          yAxisIndex: 0,
          borderColor: 'transparent',
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
          fillerColor: isDark ? 'rgba(99,102,241,0.22)' : 'rgba(99,102,241,0.18)',
          handleStyle: { color: '#6366f1', borderColor: '#6366f1', borderWidth: 0 },
          handleSize: '60%',
          moveHandleStyle: { color: '#6366f1', opacity: 0.6 },
          textStyle: { color: 'transparent' },
          labelFormatter: () => '',
        },
        { type: 'inside', orient: 'vertical', yAxisIndex: 0 },
      ] : [],
      series: [{
        type: 'custom',
        renderItem: (params, api) => {
          const categoryIndex = api.value(0);
          const startPx  = api.coord([api.value(1), categoryIndex]);
          const endPx    = api.coord([api.value(2), categoryIndex]);
          const barH     = Math.min(rowH * 0.6, api.size([0, 1])[1] * 0.65);
          const width    = Math.max(2, endPx[0] - startPx[0]);
          return {
            type: 'rect',
            shape: {
              x: startPx[0],
              y: startPx[1] - barH / 2,
              width,
              height: barH,
            },
            style: api.style({ fill: api.visual('color'), stroke: 'none' }),
            emphasis: { style: { opacity: 0.75 } },
          };
        },
        data: seriesData,
        encode: { x: [1, 2], y: 0 },
        itemStyle: {},
      }],
    });

    chart.on('click', params => {
      const uuid = params.data && params.data.uuid;
      if (uuid && typeof SarvaTestDetail !== 'undefined') SarvaTestDetail.open(uuid);
    });

    // Legend — manual because custom series don't auto-generate one
    renderGanttLegend(chartEl);

    SarvaEventBus.on('theme:changed', () => renderGantt());
  }

  function renderGanttLegend(chartEl) {
    let leg = document.getElementById('sv-gantt-legend');
    if (!leg) {
      leg = document.createElement('div');
      leg.id = 'sv-gantt-legend';
      leg.style.cssText = 'display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;padding:0.5rem 0 0;font-size:0.75rem;';
      chartEl.after(leg);
    }
    const { label } = clrs();
    const items = [
      { status: 'passed',  label: 'Passed' },
      { status: 'failed',  label: 'Failed' },
      { status: 'flaky',   label: 'Flaky'  },
      { status: 'skipped', label: 'Skipped'},
    ];
    leg.innerHTML = items.map(item => `
      <span style="display:flex;align-items:center;gap:0.3rem;color:${label};">
        <span style="width:12px;height:10px;background:${statusColor(item.status)};border-radius:2px;display:inline-block;flex-shrink:0;"></span>
        ${item.label}
      </span>`).join('');
  }

  /* ── Boot ───────────────────────────────────────────────────────────────── */
  /* ── Print insights (hidden in UI, shown in PDF) ─────────────────────────── */
  function renderTimelinePrintInsights() {
    function set(id, text) {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    }

    const allHistory = SarvaStore.history;
    const sorted = (allHistory || []).slice().sort((a, b) => a.timestamp - b.timestamp);
    // Use centered slice if active, otherwise the standard filter window
    let cadenceHistory;
    let windowLabel;
    if (_centeredSlice) {
      cadenceHistory = sorted.slice(_centeredSlice.sliceStart, _centeredSlice.sliceEnd);
      const hi = sorted.findIndex(r => r.id === _activeRunId);
      windowLabel = `Runs #${_centeredSlice.sliceStart + 1}–#${_centeredSlice.sliceEnd} · centered on Run #${hi + 1}`;
    } else {
      cadenceHistory = _cadenceFilterN > 0 ? sorted.slice(-_cadenceFilterN) : sorted;
      windowLabel = _cadenceFilterN > 0 && sorted.length > _cadenceFilterN
        ? `Last ${cadenceHistory.length} of ${sorted.length} runs` : `${cadenceHistory.length} runs`;
    }

    if (cadenceHistory.length >= 2) {
      const durs = cadenceHistory.filter(r => r.duration > 0).map(r => r.duration);
      const avgS = durs.length ? (durs.reduce((a, b) => a + b, 0) / durs.length / 1000).toFixed(1) : null;
      const rates = cadenceHistory.map(r => {
        const t = (r.passed||0)+(r.failed||0)+(r.flaky||0)+(r.skipped||0);
        return t > 0 ? +((r.passed / t) * 100).toFixed(1) : null;
      }).filter(v => v !== null);
      const avgRate = rates.length ? +(rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1) : null;
      const greenCount = rates.filter(r => r >= 95).length;
      const redCount   = rates.filter(r => r < 80).length;
      const healthSummary = redCount > 0
        ? `${redCount} run${redCount > 1 ? 's' : ''} had pass rate below 80% — investigate those runs.`
        : greenCount === rates.length
          ? 'All runs maintained 95%+ pass rate — suite is stable.'
          : 'Most runs are healthy; a few dipped below 95%.';
      const durNote = avgS ? ` Average run duration: ${avgS}s.` : '';
      set('sv-print-insight-cadence',
        `${windowLabel}. Average pass rate: ${avgRate !== null ? avgRate + '%' : '—'}.${durNote} ${healthSummary}`
      );
    }

    const tests = SarvaStore.stats ? (SarvaStore.stats.finalTests || []) : [];
    const timedTests = tests.filter(t => t.start && t.duration > 0);
    if (timedTests.length > 0) {
      const totalDur = timedTests.reduce((s, t) => s + t.duration, 0);
      const longest  = timedTests.reduce((a, b) => b.duration > a.duration ? b : a);
      const hasOverlap = timedTests.some((t, i) => {
        const tEnd = t.start + t.duration;
        return timedTests.slice(i + 1).some(u => u.start < tEnd && (u.start + u.duration) > t.start);
      });
      const parallelNote = hasOverlap ? 'Parallel execution detected.' : 'Tests ran sequentially.';
      set('sv-print-insight-gantt',
        `${timedTests.length} tests with timing data. Total cumulative test time: ${(totalDur / 1000).toFixed(1)}s. Slowest: "${longest.name}" (${(longest.duration / 1000).toFixed(1)}s). ${parallelNote}`
      );
    }
  }

  function renderAll() {
    renderRunCadence();
    renderGantt();
    renderTimelinePrintInsights();
  }

  SarvaEventBus.on('store:ready', () => {
    if (typeof echarts !== 'undefined') renderAll();
  });

  SarvaEventBus.on('echarts:ready', () => {
    renderAll();
  });

  // Lazy-render when tab becomes visible
  SarvaEventBus.on('nav:change', ({ view }) => {
    if (view === 'timeline' && typeof echarts !== 'undefined') {
      // Re-sync history mode from global state (restores after a view-local filter reset)
      _activeRunId = (typeof SarvaRunSwitch !== 'undefined') ? SarvaRunSwitch.activeRunId : null;
      if (_activeRunId) _applyCadenCentering((SarvaStore.history || []).slice().sort((a, b) => a.timestamp - b.timestamp));
      setTimeout(renderAll, 50);
    }
  });

  SarvaEventBus.on('run:switched', ({ runId }) => {
    _activeRunId = runId;
    if (typeof echarts !== 'undefined') {
      if (!runId) {
        // Restore: reset to default Last 20 filter
        _cadenceFilterN = 20;
        document.querySelectorAll('.sv-cadence-run-btn').forEach(b => {
          b.classList.toggle('active', b.textContent.trim() === 'Last 20');
        });
      }
      renderAll();
    }
  });

  return { setCadenceFilter };

})();

window.SarvaTimeline = SarvaTimeline;
