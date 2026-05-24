/**
 * Trends micro-app.
 * Cross-run analytics: pass rate trend, failures/flakiness, test counts,
 * run duration, and horizontal bar charts for top failing/flaky tests.
 */
const SarvaTrends = (() => {

  let _history = null;
  let _filterN  = 20;
  let _charts   = {};

  /* ── Utilities ──────────────────────────────────────────────────────────── */
  function fmtDur(ms) {
    if (!ms || ms <= 0) return '—';
    if (ms < 1000)  return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  function fmtDate(ts) {
    if (!ts) return '—';
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

  function getFiltered() {
    if (!_history || _history.length === 0) return [];
    return _filterN > 0 ? _history.slice(0, _filterN) : _history;
  }

  /* ── Chart lifecycle ────────────────────────────────────────────────────── */
  function initChart(id, renderer) {
    const el = document.getElementById(id);
    if (!el) return null;
    if (_charts[id]) { try { _charts[id].dispose(); } catch(e) {} }
    const c = echarts.init(el, null, { renderer: renderer || 'canvas' });
    _charts[id] = c;
    return c;
  }

  function colors() {
    const isDark = !document.body.classList.contains('light-mode');
    return {
      isDark,
      axis:    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      label:   isDark ? '#8b92a8' : '#4b5268',
      split:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      gridLine:isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      tipBg:   isDark ? '#1e2438' : '#fff',
      tipBdr:  isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      tipTxt:  isDark ? '#e6eaf4' : '#1a1d2e',
    };
  }

  function dataZoomCfg() {
    const { isDark } = colors();
    return [
      { type: 'inside', start: 0, end: 100 },
      {
        type: 'slider', show: true, bottom: 0, height: 14,
        borderColor:   'transparent',
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
        fillerColor:     isDark ? 'rgba(99,102,241,0.22)' : 'rgba(99,102,241,0.18)',
        handleStyle:     { color: '#6366f1', borderColor: '#6366f1', borderWidth: 0 },
        handleSize:      '70%',
        moveHandleStyle: { color: '#6366f1', opacity: 0.6 },
        emphasis:        { handleStyle: { color: '#818cf8' } },
        dataBackground:  { lineStyle: { color: 'rgba(99,102,241,0.3)', width: 1 }, areaStyle: { color: 'rgba(99,102,241,0.08)' } },
        selectedDataBackground: { lineStyle: { color: '#6366f1', width: 1 }, areaStyle: { color: 'rgba(99,102,241,0.15)' } },
        textStyle: { color: 'transparent' },
        labelFormatter: () => '',
      },
    ];
  }

  /* ── Top-level render ───────────────────────────────────────────────────── */
  function setRunFilter(n, btn) {
    _filterN = n;
    document.querySelectorAll('.sv-trends-run-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (typeof echarts !== 'undefined' && _history !== null) renderAll();
  }

  function renderAll() {
    const h       = getFiltered();
    const display = h.slice().reverse(); // oldest → newest

    const noHistory = document.getElementById('sv-trends-no-history');
    const content   = document.getElementById('sv-trends-content');

    if (h.length < 2) {
      if (noHistory) noHistory.style.display = 'block';
      if (content)   content.style.display   = 'none';
      return;
    }
    if (noHistory) noHistory.style.display = 'none';
    if (content)   content.style.display   = '';

    renderSummary(display);
    renderPassRateChart(display);
    renderStabilityChart(display);
    renderSeverityTrend(display);
    renderCountChart(display);
    renderDurationChart(display);
    renderTopFailures();
    renderTopFlaky();
    renderTrendsPrintInsights(display);
  }

  /* ── Summary cards ──────────────────────────────────────────────────────── */
  function renderSummary(display) {
    const el = document.getElementById('sv-trends-summary');
    if (!el) return;

    const rates = display.map(r => {
      const t = (r.passed||0)+(r.failed||0)+(r.flaky||0)+(r.skipped||0);
      return t > 0 ? +((r.passed / t) * 100).toFixed(1) : 0;
    });
    const best  = Math.max(...rates);
    const worst = Math.min(...rates);
    const avg   = +(rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1);
    const durs  = display.filter(r => r.duration > 0).map(r => r.duration);
    const avgDur = durs.length ? durs.reduce((a, b) => a + b, 0) / durs.length : 0;
    const avgCls = avg >= 95 ? 'passed' : avg >= 80 ? 'flaky' : 'failed';
    const avgClr = avg >= 95 ? '#22c55e' : avg >= 80 ? '#f59e0b' : '#f43f5e';

    const tipRuns   = escHtml(`<b>Runs Analyzed</b><br>• Runs included in this analysis window<br>• Use the filter above (Last 10/20/50/All) to adjust<br>• More runs = more reliable trend signal`);
    const tipBest   = escHtml(`<b>Best Pass Rate</b><br>• Highest pass rate achieved in any single run in this window<br>• A high best rate with a low avg = inconsistent suite`);
    const tipAvg    = escHtml(`<b>Avg Pass Rate</b><br>• Mean pass rate across all runs in this window<br>• Worst run in window: ${worst}%<br>• Below 80% = suite needs attention`);
    const tipDur    = escHtml(`<b>Avg Duration</b><br>• Mean run time across all runs in this window<br>• Increasing trend = new tests added or infrastructure slowdown<br>• Check Run Duration Trend chart below for details`);

    el.innerHTML = `<div class="sv-stat-grid" style="margin-bottom:1rem;">
      <div class="sv-stat-card total" style="cursor:default;" data-sv-tip="${tipRuns}">
        <div class="sv-stat-value">${display.length}</div>
        <div class="sv-stat-label">Runs Analyzed</div>
        <div class="sv-stat-sub">${_filterN === 0 ? 'All runs' : `Last ${_filterN}`}</div>
      </div>
      <div class="sv-stat-card passed" style="cursor:default;" data-sv-tip="${tipBest}">
        <div class="sv-stat-value" style="color:#22c55e">${best}%</div>
        <div class="sv-stat-label">Best Pass Rate</div>
        <div class="sv-stat-sub">Highest in window</div>
      </div>
      <div class="sv-stat-card ${avgCls}" style="cursor:default;" data-sv-tip="${tipAvg}">
        <div class="sv-stat-value" style="color:${avgClr}">${avg}%</div>
        <div class="sv-stat-label">Avg Pass Rate</div>
        <div class="sv-stat-sub">${worst}% worst</div>
      </div>
      <div class="sv-stat-card total" style="cursor:default;" data-sv-tip="${tipDur}">
        <div class="sv-stat-value">${avgDur > 0 ? fmtDur(avgDur) : '—'}</div>
        <div class="sv-stat-label">Avg Duration</div>
        <div class="sv-stat-sub">Mean run time</div>
      </div>
    </div>`;
  }

  /* ── Pass Rate Trend ────────────────────────────────────────────────────── */
  function renderPassRateChart(display) {
    const lbl = document.getElementById('sv-trends-passrate-label');
    if (lbl) lbl.textContent = `${display.length} runs`;

    const chart = initChart('sv-trends-passrate-chart', 'canvas');
    if (!chart) return;

    const { label, split, tipBg, tipBdr, tipTxt } = colors();
    const xData = display.map((_, i) => `#${i + 1}`);
    const yData = display.map(r => {
      const t = (r.passed||0)+(r.failed||0)+(r.flaky||0)+(r.skipped||0);
      return t > 0 ? +((r.passed / t) * 100).toFixed(1) : 0;
    });
    const flakyRateData = display.map(r => {
      const t = (r.passed||0)+(r.failed||0)+(r.flaky||0)+(r.skipped||0);
      return t > 0 ? +((r.flaky / t) * 100).toFixed(1) : 0;
    });
    const hasFlakyData = flakyRateData.some(v => v > 0);

    function visibleAvg(data) {
      const dz = chart.getOption().dataZoom[0];
      const n  = data.length;
      const si = Math.round((dz.start / 100) * (n - 1));
      const ei = Math.round((dz.end   / 100) * (n - 1));
      const slice = data.slice(si, ei + 1).filter(v => v !== null);
      return slice.length ? +(slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(1) : null;
    }

    chart.setOption({
      backgroundColor: 'transparent',
      legend: {
        show: hasFlakyData,
        bottom: 20, itemWidth: 18, itemHeight: 8,
        textStyle: { color: label, fontSize: 10 },
      },
      grid: { top: 12, right: 16, bottom: hasFlakyData ? 56 : 36, left: 44 },
      xAxis: {
        type: 'category', data: xData, boundaryGap: false,
        axisLine: { lineStyle: { color: label } }, axisTick: { show: false },
        axisLabel: { color: label, fontSize: 10, interval: Math.max(0, Math.ceil(display.length / 8) - 1) },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value', min: 0, max: 100,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: label, fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: split } },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: tipBg, borderColor: tipBdr,
        textStyle: { color: tipTxt, fontSize: 12 },
        formatter: params => {
          const r       = display[params[0].dataIndex];
          const avg     = visibleAvg(yData);
          const flakyR  = flakyRateData[params[0].dataIndex];
          return `<b>Run ${params[0].name}</b>`
            + (r.timestamp ? `<br/><span style="opacity:0.7;font-size:0.85em;">${fmtDate(r.timestamp)}</span>` : '')
            + `<br/>Pass Rate: <b style="color:#22c55e;">${yData[params[0].dataIndex]}%</b>`
            + (hasFlakyData ? `<br/>Flaky Rate: <b style="color:#f59e0b;">${flakyR}%</b> (${r.flaky||0} flaky)` : `<br/>${r.flaky||0} flaky`)
            + `<br/>${r.passed||0} passed &nbsp;·&nbsp; ${r.failed||0} failed`
            + (avg !== null ? `<br/><span style="opacity:0.65;font-size:0.88em;">Pass avg (visible): ${avg}%</span>` : '');
        },
      },
      dataZoom: dataZoomCfg(),
      series: [
        {
          name: 'Pass Rate', type: 'line', data: yData,
          smooth: 0.4, symbol: 'circle', symbolSize: 5,
          lineStyle: { color: '#22c55e', width: 2.5 },
          itemStyle: { color: '#22c55e', borderColor: '#fff', borderWidth: 1.5 },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: 'rgba(34,197,94,0.25)' }, { offset: 1, color: 'rgba(34,197,94,0.01)' }],
            },
          },
          markLine: {
            silent: true, symbol: ['none', 'none'],
            data: [{ type: 'average', name: 'Avg',
              lineStyle: { color: 'rgba(34,197,94,0.35)', type: 'dashed', width: 1 },
              label: {
                position: 'insideStartTop',
                formatter: p => `Avg ${p.value.toFixed(1)}%`,
                color: 'rgba(34,197,94,0.9)', fontSize: 9,
                backgroundColor: 'rgba(16,20,32,0.75)', padding: [2, 5, 2, 5], borderRadius: 3,
              },
            }],
          },
        },
        ...(hasFlakyData ? [{
          name: 'Flaky Rate', type: 'line', data: flakyRateData,
          smooth: 0.4, symbol: 'none',
          lineStyle: { color: '#f59e0b', width: 1.5, type: 'dashed' },
          itemStyle: { color: '#f59e0b' },
          areaStyle: { color: 'transparent' },
        }] : []),
      ],
    });

    SarvaEventBus.on('theme:changed', () => renderPassRateChart(display));
  }

  /* ── Failures & Flakiness ───────────────────────────────────────────────── */
  function renderStabilityChart(display) {
    const lbl = document.getElementById('sv-trends-stability-label');
    if (lbl) lbl.textContent = `${display.length} runs`;

    const chart = initChart('sv-trends-stability-chart', 'canvas');
    if (!chart) return;

    const { label, split, tipBg, tipBdr, tipTxt } = colors();
    const xData  = display.map((_, i) => `#${i + 1}`);
    const failed = display.map(r => r.failed || 0);
    const flaky  = display.map(r => r.flaky  || 0);

    const mkArea = (name, data, color, alphaFill) => ({
      name, type: 'line', data, smooth: 0.4, symbol: 'circle', symbolSize: 5,
      lineStyle: { color, width: 2 },
      itemStyle: { color },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: alphaFill }, { offset: 1, color: 'rgba(0,0,0,0)' }] },
      },
    });

    chart.setOption({
      backgroundColor: 'transparent',
      legend: { show: true, bottom: 20, itemWidth: 18, itemHeight: 8, textStyle: { color: label, fontSize: 10 } },
      grid: { top: 12, right: 16, bottom: 68, left: 36 },
      xAxis: {
        type: 'category', data: xData, boundaryGap: false,
        axisLine: { lineStyle: { color: label } }, axisTick: { show: false },
        axisLabel: { color: label, fontSize: 10, interval: Math.max(0, Math.ceil(display.length / 8) - 1) },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value', min: 0, minInterval: 1,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: label, fontSize: 10 },
        splitLine: { lineStyle: { color: split } },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: tipBg, borderColor: tipBdr,
        textStyle: { color: tipTxt, fontSize: 12 },
        formatter: params => {
          const r = display[params[0].dataIndex];
          return `<b>Run ${params[0].name}</b>`
            + (r.timestamp ? `<br/><span style="opacity:0.7;font-size:0.85em;">${fmtDate(r.timestamp)}</span>` : '')
            + params.map(p => `<br/>${p.marker}${p.seriesName}: <b>${p.value}</b>`).join('');
        },
      },
      dataZoom: dataZoomCfg(),
      series: [
        mkArea('Failed', failed, '#f43f5e', 'rgba(244,63,94,0.18)'),
        mkArea('Flaky',  flaky,  '#f59e0b', 'rgba(245,158,11,0.18)'),
      ],
    });

    let _stabilityLoop = false;
    chart.on('legendselectchanged', params => {
      if (_stabilityLoop) return;
      if (!Object.values(params.selected).some(v => v)) {
        _stabilityLoop = true;
        chart.dispatchAction({ type: 'legendSelect', name: params.name });
        _stabilityLoop = false;
      }
    });

    SarvaEventBus.on('theme:changed', () => renderStabilityChart(display));
  }

  /* ── Test Count Over Time ───────────────────────────────────────────────── */
  function renderCountChart(display) {
    const chart = initChart('sv-trends-count-chart', 'canvas');
    if (!chart) return;

    const { label, split, tipBg, tipBdr, tipTxt } = colors();
    const xData   = display.map((_, i) => `#${i + 1}`);
    const passed  = display.map(r => r.passed  || 0);
    const failed  = display.map(r => r.failed  || 0);
    const flaky   = display.map(r => r.flaky   || 0);
    const skipped = display.map(r => r.skipped || 0);

    const mkStack = (name, data, color, fillAlpha) => ({
      name, type: 'line', stack: 'total', data,
      smooth: false, symbol: 'none',
      lineStyle: { color, width: 1.5 },
      itemStyle: { color },
      areaStyle: { color: fillAlpha },
      emphasis: { focus: 'series' },
    });

    chart.setOption({
      backgroundColor: 'transparent',
      legend: { show: true, bottom: 20, itemWidth: 18, itemHeight: 8, textStyle: { color: label, fontSize: 10 } },
      grid: { top: 12, right: 16, bottom: 68, left: 36 },
      xAxis: {
        type: 'category', data: xData, boundaryGap: false,
        axisLine: { lineStyle: { color: label } }, axisTick: { show: false },
        axisLabel: { color: label, fontSize: 10, interval: Math.max(0, Math.ceil(display.length / 8) - 1) },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value', minInterval: 1,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: label, fontSize: 10 },
        splitLine: { lineStyle: { color: split } },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: tipBg, borderColor: tipBdr,
        textStyle: { color: tipTxt, fontSize: 12 },
        formatter: params => {
          const idx   = params[0].dataIndex;
          const r     = display[idx];
          const total = (r.passed||0)+(r.failed||0)+(r.flaky||0)+(r.skipped||0);
          let delta = '';
          if (idx > 0) {
            const prev = display[idx - 1];
            const prevTotal = (prev.passed||0)+(prev.failed||0)+(prev.flaky||0)+(prev.skipped||0);
            const d = total - prevTotal;
            if (d !== 0) delta = `<br/><span style="color:${d > 0 ? '#22d3ee' : '#f97316'};font-size:0.88em;">${d > 0 ? `+${d} new` : `${d} removed`} vs prev run</span>`;
          }
          return `<b>Run ${params[0].name}</b>`
            + (r.timestamp ? `<br/><span style="opacity:0.7;font-size:0.85em;">${fmtDate(r.timestamp)}</span>` : '')
            + `<br/>Total: <b>${total}</b>${delta}`
            + params.map(p => `<br/>${p.marker}${p.seriesName}: <b>${p.value}</b>`).join('');
        },
      },
      dataZoom: dataZoomCfg(),
      series: [
        mkStack('Passed',  passed,  '#22c55e', 'rgba(34,197,94,0.4)'),
        mkStack('Failed',  failed,  '#f43f5e', 'rgba(244,63,94,0.4)'),
        mkStack('Flaky',   flaky,   '#f59e0b', 'rgba(245,158,11,0.4)'),
        mkStack('Skipped', skipped, '#64748b', 'rgba(100,116,139,0.3)'),
        // Scatter markers for test count changes (+N / -N)
        {
          name: 'Changes', type: 'scatter', data: display.map((r, i) => {
            if (i === 0) return null;
            const prev = display[i - 1];
            const curr = (r.passed||0)+(r.failed||0)+(r.flaky||0)+(r.skipped||0);
            const prevT = (prev.passed||0)+(prev.failed||0)+(prev.flaky||0)+(prev.skipped||0);
            const d = curr - prevT;
            return Math.abs(d) >= 1 ? { value: curr, delta: d } : null;
          }).map(v => v ? v.value : null),
          symbol: 'triangle', symbolSize: 8,
          itemStyle: {
            color: params => {
              const d = display[params.dataIndex];
              const prev = params.dataIndex > 0 ? display[params.dataIndex - 1] : null;
              if (!prev) return 'transparent';
              const currT = (d.passed||0)+(d.failed||0)+(d.flaky||0)+(d.skipped||0);
              const prevT = (prev.passed||0)+(prev.failed||0)+(prev.flaky||0)+(prev.skipped||0);
              return currT > prevT ? '#22d3ee' : '#f97316';
            },
          },
          tooltip: { show: false },
          silent: false,
          legend: { show: false },
          legendHoverLink: false,
          z: 10,
        },
      ],
    });

    let _countLoop = false;
    chart.on('legendselectchanged', params => {
      if (_countLoop) return;
      if (!Object.values(params.selected).some(v => v)) {
        _countLoop = true;
        chart.dispatchAction({ type: 'legendSelect', name: params.name });
        _countLoop = false;
      }
    });

    SarvaEventBus.on('theme:changed', () => renderCountChart(display));
  }

  /* ── Run Duration Trend ─────────────────────────────────────────────────── */
  function renderDurationChart(display) {
    const empty = document.getElementById('sv-trends-duration-empty');
    const durs  = display.map(r => r.duration > 0 ? +(r.duration / 1000).toFixed(1) : null);
    const valid  = durs.filter(d => d !== null && d > 0);

    if (valid.length === 0) {
      const el = document.getElementById('sv-trends-duration-chart');
      if (el)    el.style.display    = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    const chart = initChart('sv-trends-duration-chart', 'canvas');
    if (!chart) return;

    const { label, split, tipBg, tipBdr, tipTxt } = colors();
    const xData  = display.map((_, i) => `#${i + 1}`);
    const avgDur = +(valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);

    chart.setOption({
      backgroundColor: 'transparent',
      grid: { top: 12, right: 16, bottom: 36, left: 48 },
      xAxis: {
        type: 'category', data: xData,
        axisLine: { lineStyle: { color: label } }, axisTick: { show: false },
        axisLabel: { color: label, fontSize: 10, interval: Math.max(0, Math.ceil(display.length / 8) - 1) },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value', min: 0,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: label, fontSize: 10, formatter: v => `${v}s` },
        splitLine: { lineStyle: { color: split } },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: tipBg, borderColor: tipBdr,
        textStyle: { color: tipTxt, fontSize: 12 },
        formatter: params => {
          const r  = display[params[0].dataIndex];
          const d  = r.duration > 0 ? fmtDur(r.duration) : '—';
          const dz = chart.getOption().dataZoom[0];
          const n  = durs.length;
          const si = Math.round((dz.start / 100) * (n - 1));
          const ei = Math.round((dz.end   / 100) * (n - 1));
          const visSlice = durs.slice(si, ei + 1).filter(v => v !== null && v > 0);
          const visAvg = visSlice.length
            ? +(visSlice.reduce((a, b) => a + b, 0) / visSlice.length).toFixed(1)
            : null;
          return `<b>Run ${params[0].name}</b>`
            + (r.timestamp ? `<br/><span style="opacity:0.7;font-size:0.85em;">${fmtDate(r.timestamp)}</span>` : '')
            + `<br/>Duration: <b>${d}</b>`
            + (visAvg !== null ? `<br/><span style="opacity:0.65;font-size:0.88em;">Avg (visible): ${visAvg}s</span>` : '');
        },
      },
      dataZoom: dataZoomCfg(),
      series: [
        {
          name: 'Duration', type: 'bar', data: durs,
          itemStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: 'rgba(99,102,241,0.75)' }, { offset: 1, color: 'rgba(99,102,241,0.35)' }] },
            borderRadius: [3, 3, 0, 0],
          },
          emphasis: { itemStyle: { color: '#818cf8' } },
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            data: [{ type: 'average', name: 'Avg',
              lineStyle: { color: 'rgba(99,102,241,0.45)', type: 'dashed', width: 1.5 },
              label: {
                position: 'insideStartTop',
                formatter: p => `Avg ${p.value.toFixed(1)}s`,
                color: 'rgba(149,152,241,0.9)',
                fontSize: 9,
                backgroundColor: 'rgba(16,20,32,0.75)',
                padding: [2, 5, 2, 5],
                borderRadius: 3,
              },
            }],
          },
        },
      ],
    });

    SarvaEventBus.on('theme:changed', () => renderDurationChart(display));
  }

  /* ── Top Failing Tests — horizontal bar ─────────────────────────────────── */
  function renderTopFailures() {
    const empty   = document.getElementById('sv-trends-top-failures-empty');
    const lbl     = document.getElementById('sv-trends-top-failures-label');
    const chartEl = document.getElementById('sv-trends-top-failures-chart');
    if (!chartEl) return;

    const filteredRunIds = new Set(getFiltered().map(r => r.id));

    // Accumulate across browser variants by merging into a Map keyed by shortName
    const map = new Map();
    (SarvaStore.testHistory || []).forEach(entry => {
      const failCount = (entry.history || []).filter(h =>
        filteredRunIds.has(h.runId) &&
        (h.status === 'failed' || h.status === 'broken') && !h.wasFlaky
      ).length;
      if (!failCount) return;
      const fullName = entry.testName || (entry.testId && entry.testId.includes(':')
        ? entry.testId.split(':').slice(1).join(':') : entry.testId) || '';
      const cur = (SarvaStore.tests || []).find(t => t.fullName === fullName || t.name === fullName);
      if (map.has(fullName)) {
        map.get(fullName).failCount += failCount;
      } else {
        map.set(fullName, { fullName, shortName: fullName.split('>').pop().trim(), failCount, uuid: cur ? cur.uuid : null });
      }
    });
    const data = Array.from(map.values());

    // Include current-run failures not yet in history (first run edge case)
    (SarvaStore.stats.finalTests || [])
      .filter(t => (t.status === 'failed' || t.status === 'broken') && !map.has(t.fullName))
      .forEach(t => data.push({ fullName: t.fullName, shortName: t.name, failCount: 1, uuid: t.uuid }));

    data.sort((a, b) => b.failCount - a.failCount);
    const top = data.slice(0, 10);

    if (lbl) lbl.textContent = data.length > top.length
      ? `top ${top.length} of ${data.length}`
      : `${top.length} test${top.length !== 1 ? 's' : ''}`;
    if (top.length === 0) {
      chartEl.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    chartEl.style.display = '';
    chartEl.style.height   = `${Math.max(120, top.length * 34)}px`;

    const chart = initChart('sv-trends-top-failures-chart', 'svg');
    if (!chart) return;

    const { label, gridLine, tipBg, tipBdr, tipTxt } = colors();
    // Reversed so highest-failure bar is at top of chart
    const names  = top.map(d => d.shortName).reverse();
    const values = top.map(d => d.failCount).reverse();
    const uuids  = top.map(d => d.uuid).reverse();
    const failLeftPad = Math.min(320, Math.max(130, Math.round(Math.max(...names.map(n => n.length)) * 6)));

    chart.setOption({
      backgroundColor: 'transparent',
      grid: { top: 4, right: 44, bottom: 4, left: failLeftPad },
      xAxis: {
        type: 'value', minInterval: 1,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: label, fontSize: 10 },
        splitLine: { lineStyle: { color: gridLine } },
      },
      yAxis: {
        type: 'category', data: names,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: label, fontSize: 10, align: 'right', width: failLeftPad - 10 },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: tipBg, borderColor: tipBdr,
        textStyle: { color: tipTxt, fontSize: 12 },
        formatter: p => {
          const d = top[top.length - 1 - p.dataIndex];
          return `<b>${escHtml(d.fullName)}</b><br/>Failed: <b style="color:#f43f5e;">${d.failCount}×</b>`;
        },
      },
      series: [{
        type: 'bar', data: values,
        cursor: uuids.some(u => u) ? 'pointer' : 'default',
        itemStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [{ offset: 0, color: 'rgba(244,63,94,0.45)' }, { offset: 1, color: '#f43f5e' }] },
          borderRadius: [0, 3, 3, 0],
        },
        emphasis: { itemStyle: { color: '#fb7185' } },
        label: { show: true, position: 'right', fontSize: 10, color: label, formatter: '{c}×' },
        barMaxWidth: 20,
      }],
    });

    chart.on('click', params => {
      const uuid = uuids[params.dataIndex];
      if (uuid && typeof SarvaTestDetail !== 'undefined') SarvaTestDetail.open(uuid);
    });

    SarvaEventBus.on('theme:changed', () => renderTopFailures());
  }

  /* ── Top Flaky Tests — horizontal bar ──────────────────────────────────── */
  function renderTopFlaky() {
    const empty   = document.getElementById('sv-trends-top-flaky-empty');
    const lbl     = document.getElementById('sv-trends-top-flaky-label');
    const chartEl = document.getElementById('sv-trends-top-flaky-chart');
    if (!chartEl) return;

    const filteredRunIds = new Set(getFiltered().map(r => r.id));

    // Accumulate across browser variants by merging into a Map keyed by fullName
    const map = new Map();
    (SarvaStore.testHistory || []).forEach(entry => {
      const hist     = (entry.history || []).filter(h => filteredRunIds.has(h.runId));
      const flakyN   = hist.filter(h => h.wasFlaky || h.status === 'flaky').length;
      if (!flakyN) return;
      const relevant = hist.filter(h => h.status !== 'skipped');
      const fullName = entry.testName || (entry.testId && entry.testId.includes(':')
        ? entry.testId.split(':').slice(1).join(':') : entry.testId) || '';
      const cur = (SarvaStore.tests || []).find(t => t.fullName === fullName || t.name === fullName);
      if (map.has(fullName)) {
        const ex = map.get(fullName);
        ex.flakyN     += flakyN;
        ex.totalRuns  += relevant.length;
        ex.rate        = ex.totalRuns > 0 ? +(ex.flakyN / ex.totalRuns * 100).toFixed(1) : 0;
      } else {
        const rate = relevant.length > 0 ? +(flakyN / relevant.length * 100).toFixed(1) : 0;
        map.set(fullName, { fullName, shortName: fullName.split('>').pop().trim(), rate, flakyN, totalRuns: relevant.length, uuid: cur ? cur.uuid : null });
      }
    });
    const data = Array.from(map.values());

    data.sort((a, b) => b.rate - a.rate);
    const top = data.slice(0, 10);

    if (lbl) lbl.textContent = data.length > top.length
      ? `top ${top.length} of ${data.length}`
      : `${top.length} test${top.length !== 1 ? 's' : ''}`;
    if (top.length === 0) {
      chartEl.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    chartEl.style.display = '';
    chartEl.style.height   = `${Math.max(120, top.length * 34)}px`;

    const chart = initChart('sv-trends-top-flaky-chart', 'svg');
    if (!chart) return;

    const { label, gridLine, tipBg, tipBdr, tipTxt } = colors();
    const names  = top.map(d => d.shortName).reverse();
    const values = top.map(d => d.rate).reverse();
    const uuids  = top.map(d => d.uuid).reverse();
    const flakyLeftPad = Math.min(320, Math.max(130, Math.round(Math.max(...names.map(n => n.length)) * 6)));

    chart.setOption({
      backgroundColor: 'transparent',
      grid: { top: 4, right: 52, bottom: 4, left: flakyLeftPad },
      xAxis: {
        type: 'value', min: 0, max: 100,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: label, fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: gridLine } },
      },
      yAxis: {
        type: 'category', data: names,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: label, fontSize: 10, align: 'right', width: flakyLeftPad - 10 },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: tipBg, borderColor: tipBdr,
        textStyle: { color: tipTxt, fontSize: 12 },
        formatter: p => {
          const d = top[top.length - 1 - p.dataIndex];
          return `<b>${escHtml(d.fullName)}</b><br/>Flakiness: <b style="color:#f59e0b;">${d.rate}%</b><br/>Flaky ${d.flakyN}× out of ${d.totalRuns} runs`;
        },
      },
      series: [{
        type: 'bar', data: values,
        cursor: uuids.some(u => u) ? 'pointer' : 'default',
        itemStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [{ offset: 0, color: 'rgba(245,158,11,0.4)' }, { offset: 1, color: '#f59e0b' }] },
          borderRadius: [0, 3, 3, 0],
        },
        emphasis: { itemStyle: { color: '#fbbf24' } },
        label: { show: true, position: 'right', fontSize: 10, color: label, formatter: p => `${p.value}%` },
        barMaxWidth: 20,
      }],
    });

    chart.on('click', params => {
      const uuid = uuids[params.dataIndex];
      if (uuid && typeof SarvaTestDetail !== 'undefined') SarvaTestDetail.open(uuid);
    });

    SarvaEventBus.on('theme:changed', () => renderTopFlaky());
  }

  /* ── Print insights (hidden in UI, shown in PDF) ─────────────────────────── */
  function renderTrendsPrintInsights(display) {
    function set(id, text) {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    }

    const rates = display.map(r => {
      const t = (r.passed||0)+(r.failed||0)+(r.flaky||0)+(r.skipped||0);
      return t > 0 ? +((r.passed / t) * 100).toFixed(1) : 0;
    });
    const avg   = +(rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1);
    const best  = Math.max(...rates);
    const worst = Math.min(...rates);
    const latest = rates[rates.length - 1];
    const prev   = rates.length >= 2 ? rates[rates.length - 2] : null;
    const trend  = prev !== null ? (latest > prev ? 'up' : latest < prev ? 'down' : 'flat') : 'flat';
    const trendText = trend === 'up' ? `improving (${prev}% → ${latest}%)` : trend === 'down' ? `declining (${prev}% → ${latest}%)` : `stable at ${latest}%`;

    set('sv-print-insight-passrate',
      `Pass rate across ${display.length} runs: avg ${avg}%, best ${best}%, worst ${worst}%. Latest run is ${trendText}.`
    );

    const totalFailed = display.reduce((s, r) => s + (r.failed||0), 0);
    const totalFlaky  = display.reduce((s, r) => s + (r.flaky||0), 0);
    const maxFailed   = Math.max(...display.map(r => r.failed||0));
    const maxFlaky    = Math.max(...display.map(r => r.flaky||0));
    const stabilityNote = totalFailed === 0 && totalFlaky === 0
      ? 'No failures or flakiness across all runs — suite is clean.'
      : `${totalFailed} total failures and ${totalFlaky} total flaky results across ${display.length} runs. Peak: ${maxFailed} failures and ${maxFlaky} flaky in a single run.`;
    set('sv-print-insight-stability', stabilityNote);

    const totals = display.map(r => (r.passed||0)+(r.failed||0)+(r.flaky||0)+(r.skipped||0));
    const minTotal = Math.min(...totals);
    const maxTotal = Math.max(...totals);
    const latestTotal = totals[totals.length - 1];
    set('sv-print-insight-count',
      `Test count across ${display.length} runs ranged from ${minTotal} to ${maxTotal}. Latest run: ${latestTotal} tests.`
    );

    const durs = display.filter(r => r.duration > 0).map(r => r.duration);
    if (durs.length > 0) {
      const avgDurS = (durs.reduce((a, b) => a + b, 0) / durs.length / 1000).toFixed(1);
      const maxDurS = (Math.max(...durs) / 1000).toFixed(1);
      const minDurS = (Math.min(...durs) / 1000).toFixed(1);
      set('sv-print-insight-duration',
        `Run duration across ${durs.length} timed runs: avg ${avgDurS}s, fastest ${minDurS}s, slowest ${maxDurS}s.`
      );
    }

    // Top Failing insight
    const filteredRunIds = new Set(display.map(r => r.id));
    const failMap = new Map();
    (SarvaStore.testHistory || []).forEach(entry => {
      const failCount = (entry.history || []).filter(h =>
        filteredRunIds.has(h.runId) && (h.status === 'failed' || h.status === 'broken') && !h.wasFlaky
      ).length;
      if (!failCount) return;
      const fullName = entry.testName || (entry.testId && entry.testId.includes(':')
        ? entry.testId.split(':').slice(1).join(':') : entry.testId) || '';
      if (failMap.has(fullName)) failMap.get(fullName).failCount += failCount;
      else failMap.set(fullName, { shortName: fullName.split('>').pop().trim(), failCount });
    });
    const failTop = Array.from(failMap.values()).sort((a, b) => b.failCount - a.failCount).slice(0, 3);
    if (failTop.length > 0) {
      const names = failTop.map(d => `"${d.shortName}" (${d.failCount}×)`).join(', ');
      set('sv-print-insight-top-failures',
        `Top ${failTop.length} most-failed test${failTop.length > 1 ? 's' : ''} in window: ${names}. These tests need immediate attention.`
      );
    } else {
      set('sv-print-insight-top-failures', 'No failures recorded in this window — suite is clean.');
    }

    // Top Flaky insight
    const flakyMap = new Map();
    (SarvaStore.testHistory || []).forEach(entry => {
      const hist   = (entry.history || []).filter(h => filteredRunIds.has(h.runId));
      const flakyN = hist.filter(h => h.wasFlaky || h.status === 'flaky').length;
      if (!flakyN) return;
      const relevant = hist.filter(h => h.status !== 'skipped');
      const fullName = entry.testName || (entry.testId && entry.testId.includes(':')
        ? entry.testId.split(':').slice(1).join(':') : entry.testId) || '';
      const rate = relevant.length > 0 ? +(flakyN / relevant.length * 100).toFixed(1) : 0;
      if (flakyMap.has(fullName)) {
        const ex = flakyMap.get(fullName);
        ex.flakyN += flakyN; ex.totalRuns += relevant.length;
        ex.rate = ex.totalRuns > 0 ? +(ex.flakyN / ex.totalRuns * 100).toFixed(1) : 0;
      } else {
        flakyMap.set(fullName, { shortName: fullName.split('>').pop().trim(), rate, flakyN, totalRuns: relevant.length });
      }
    });
    const flakyTop = Array.from(flakyMap.values()).sort((a, b) => b.rate - a.rate).slice(0, 3);
    if (flakyTop.length > 0) {
      const names = flakyTop.map(d => `"${d.shortName}" (${d.rate}%)`).join(', ');
      set('sv-print-insight-top-flaky',
        `Top ${flakyTop.length} flakiest test${flakyTop.length > 1 ? 's' : ''}: ${names}. High flakiness slows CI and masks real failures.`
      );
    } else {
      set('sv-print-insight-top-flaky', 'No flaky tests recorded in this window.');
    }
  }

  /* ── Failures by Severity over time ─────────────────────────────────────── */
  function renderSeverityTrend(display) {
    const section = document.getElementById('sv-trends-severity-section');
    const el      = document.getElementById('sv-trends-severity-chart');
    const empty   = document.getElementById('sv-trends-severity-empty');
    const lbl     = document.getElementById('sv-trends-severity-label');
    if (!el) return;

    const hasSev = display.some(r => r.severityBreakdown &&
      (r.severityBreakdown.critical || r.severityBreakdown.high ||
       r.severityBreakdown.medium   || r.severityBreakdown.low  || r.severityBreakdown.trivial));

    if (!hasSev) {
      if (section) section.style.display = 'none';
      return;
    }
    if (section) section.style.display = '';
    if (empty) empty.style.display = 'none';
    if (lbl) lbl.textContent = `${display.length} runs`;

    const chart = initChart('sv-trends-severity-chart', 'canvas');
    if (!chart) return;

    const { label, split, tipBg, tipBdr, tipTxt } = colors();

    const xData    = display.map((_, i) => `#${i + 1}`);
    const critical = display.map(r => (r.severityBreakdown && r.severityBreakdown.critical) || 0);
    const high     = display.map(r => (r.severityBreakdown && r.severityBreakdown.high)     || 0);
    const medium   = display.map(r => (r.severityBreakdown && r.severityBreakdown.medium)   || 0);
    const low      = display.map(r => (r.severityBreakdown && r.severityBreakdown.low)      || 0);
    const trivial  = display.map(r => (r.severityBreakdown && r.severityBreakdown.trivial)  || 0);

    const axisStyle = {
      axisLine:  { lineStyle: { color: label } },
      axisTick:  { show: false },
      axisLabel: { color: label, fontSize: 10 },
      splitLine: { lineStyle: { color: split } },
    };

    const mkBar = (name, data, color) => ({
      name, type: 'bar', stack: 'sev', data,
      itemStyle: { color },
      emphasis: { focus: 'series' },
    });

    chart.setOption({
      backgroundColor: 'transparent',
      legend: {
        bottom: 20, itemWidth: 10, itemHeight: 10,
        textStyle: { color: label, fontSize: 10 },
      },
      grid: { top: 12, right: 16, bottom: 68, left: 36 },
      xAxis: {
        type: 'category', data: xData,
        axisLine: { lineStyle: { color: label } }, axisTick: { show: false },
        axisLabel: { color: label, fontSize: 10, interval: Math.max(0, Math.ceil(display.length / 8) - 1) },
        splitLine: { show: false },
      },
      yAxis: { type: 'value', minInterval: 1, ...axisStyle },
      dataZoom: dataZoomCfg(),
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        backgroundColor: tipBg, borderColor: tipBdr,
        textStyle: { color: tipTxt, fontSize: 12 },
        formatter: params => {
          const r     = display[params[0].dataIndex];
          const total = params.reduce((s, p) => s + (p.value || 0), 0);
          const hasSevData = r.severityBreakdown &&
            (r.severityBreakdown.critical || r.severityBreakdown.high ||
             r.severityBreakdown.medium   || r.severityBreakdown.low  || r.severityBreakdown.trivial);
          const noDataNote = !hasSevData
            ? `<br/><span style="opacity:0.6;font-size:0.85em;font-style:italic;">No failures with severity labels in this run</span>`
            : (total === 0
              ? `<br/><span style="opacity:0.6;font-size:0.85em;font-style:italic;">All tests passed — no failures to show</span>`
              : '');
          return `<b>Run ${params[0].axisValue}</b>`
            + (r.timestamp ? `<br/><span style="opacity:0.7;font-size:0.85em;">${fmtDate(r.timestamp)}</span>` : '')
            + (hasSevData && total > 0
              ? '<br/>' + params.filter(p => p.value > 0).map(p =>
                  `${p.marker}${p.seriesName}: <b>${p.value}</b>`).join('<br/>')
                + `<br/><span style="opacity:0.65;font-size:0.88em;">Total affected: ${total}</span>`
              : noDataNote);
        },
      },
      series: [
        mkBar('Critical', critical, '#ef4444'),
        mkBar('High',     high,     '#f97316'),
        mkBar('Medium',   medium,   '#f59e0b'),
        mkBar('Low',      low,      '#3b82f6'),
        mkBar('Trivial',  trivial,  '#94a3b8'),
      ],
    });

    SarvaEventBus.on('theme:changed', () => renderSeverityTrend(display));
  }

  /* ── Boot ───────────────────────────────────────────────────────────────── */
  SarvaEventBus.on('store:ready', ({ history }) => {
    _history = history;
    if (typeof echarts !== 'undefined') renderAll();
  });

  SarvaEventBus.on('echarts:ready', () => {
    if (_history !== null) renderAll();
  });

  // Re-render when tab becomes visible (ECharts needs a visible container)
  SarvaEventBus.on('nav:change', ({ view }) => {
    if (view === 'trends' && typeof echarts !== 'undefined' && _history !== null) {
      setTimeout(renderAll, 50);
    }
  });

  return { setRunFilter };
})();

window.SarvaTrends = SarvaTrends;
