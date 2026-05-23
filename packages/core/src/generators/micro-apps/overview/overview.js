/**
 * Overview micro-app.
 * Renders stat cards, segmented pass rate, donut, health pulse, stacked run history,
 * top failures, top flaky offenders (with sparklines).
 */
const SarvaOverview = (() => {

  let _cachedStats   = null;
  let _cachedHistory = null;
  let _filterN       = 20; // default: last 20 runs
  let _healthChart   = null;
  let _historyChart  = null;
  let _healthSeriesVisible = { passRate: true, duration: true };
  let _preventLegendLoop   = false;

  function getFilteredHistory() {
    if (!_cachedHistory) return [];
    return _filterN > 0 ? _cachedHistory.slice(0, _filterN) : _cachedHistory;
  }

  function setRunFilter(n, btn) {
    _filterN = n;
    document.querySelectorAll('.sv-run-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (typeof echarts !== 'undefined') {
      const h = getFilteredHistory();
      renderHealthPulse(h);
      renderHistoryChart(h);
    }
  }

  /* ── Needs Attention strip ───────────────────────────────────────────────────── */
  function renderAttentionStrip(stats) {
    const el = document.getElementById('sv-attention-strip');
    if (!el) return;

    const chips = [];

    if (stats.failed > 0) {
      chips.push({ label: `${stats.failed} failing`, color: 'var(--status-failed)', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)',
        onclick: `SarvaOverview.goToTests('failed')`,
        tip: escHtml(`${stats.failed} test${stats.failed !== 1 ? 's' : ''} failed — blocks release, needs immediate investigation.`) });
    }
    if (stats.flaky > 0) {
      chips.push({ label: `${stats.flaky} flaky`, color: 'var(--status-flaky)', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)',
        onclick: `SarvaOverview.goToTests('flaky')`,
        tip: escHtml(`${stats.flaky} test${stats.flaky !== 1 ? 's' : ''} passed only after retries — address before they become consistent failures.`) });
    }
    if (stats.skipped > 0) {
      chips.push({ label: `${stats.skipped} skipped`, color: 'var(--text-muted)', bg: 'var(--bg-surface-3)', border: 'var(--border)',
        onclick: `SarvaOverview.goToTests('skipped')`,
        tip: escHtml(`${stats.skipped} test${stats.skipped !== 1 ? 's' : ''} not executed — verify these are intentionally skipped.`) });
    }
    if (_cachedHistory && _cachedHistory.length > 1) {
      const prev = _cachedHistory[1];
      const pt = (prev.passed||0)+(prev.failed||0)+(prev.flaky||0)+(prev.skipped||0);
      const prevRate = pt > 0 ? +((prev.passed / pt) * 100).toFixed(1) : 0;
      const diff = +(stats.passRate - prevRate).toFixed(1);
      if (diff <= -5) {
        const absDiff = Math.abs(diff);
        chips.push({ label: `Pass rate ↓${absDiff}%`, color: 'var(--status-failed)', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)',
          onclick: `SarvaOverview.goToTests('failed')`,
          tip: escHtml(`Pass rate dropped ${absDiff}% vs previous run (${prevRate}% → ${+(+stats.passRate).toFixed(1)}%).`) });
      }
    }

    if (chips.length === 0 && stats.failed === 0 && stats.flaky === 0) {
      el.innerHTML = `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.45rem 0.9rem;background:rgba(34,197,94,0.07);border-radius:var(--radius);border:1px solid rgba(34,197,94,0.2);margin-bottom:1rem;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--status-passed)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
        <span style="font-size:0.77rem;color:var(--status-passed);font-weight:600;">All tests passing</span>
        ${stats.skipped > 0 ? `<span style="font-size:0.72rem;color:var(--text-muted);">· ${stats.skipped} skipped</span>` : ''}
      </div>`;
      return;
    }
    if (chips.length === 0) { el.innerHTML = ''; return; }

    el.innerHTML = `<div style="display:flex;gap:0.45rem;flex-wrap:wrap;margin-bottom:1rem;align-items:center;">
      <span style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);white-space:nowrap;">Needs attention</span>
      ${chips.map(c => `<span onclick="${c.onclick}" style="cursor:pointer;display:inline-flex;align-items:center;gap:0.3rem;
             font-size:0.75rem;font-weight:600;padding:0.2rem 0.65rem;border-radius:20px;
             background:${c.bg};color:${c.color};border:1px solid ${c.border};transition:opacity 0.15s;"
            onmouseenter="this.style.opacity='0.7'" onmouseleave="this.style.opacity='1'"
            data-sv-tip="${c.tip}">${c.label}</span>`).join('')}
    </div>`;
  }

  /* ── Stat Cards ─────────────────────────────────────────────────────────────── */
  function renderStatCards(stats) {
    const grid = document.getElementById('sv-stat-grid');
    if (!grid) return;

    const prevRun = _cachedHistory && _cachedHistory.length > 1 ? _cachedHistory[1] : null;

    function deltaSub(curr, prev, key, higherIsBad) {
      if (!prev) return null;
      const d = curr - (prev[key] || 0);
      if (d === 0) return `<span style="color:var(--text-muted);font-size:0.72rem;">= same as last run</span>`;
      const good = higherIsBad != null ? (higherIsBad ? d < 0 : d > 0) : null;
      const color = good === true ? 'var(--status-passed)' : good === false ? 'var(--status-failed)' : 'var(--text-muted)';
      return `<span style="color:${color};font-weight:600;">${d > 0 ? '↑' : '↓'} ${Math.abs(d)}</span><span style="color:var(--text-muted);font-size:0.62rem;"> vs last run</span>`;
    }

    const deltaLine = (key, label, prevVal) => prevRun
      ? `<br><span style='font-size:0.8em;opacity:0.7;'>↑/↓ below = change vs previous run &nbsp;·&nbsp; Previous: ${prevVal !== undefined ? prevVal : (prevRun[key] || 0)} ${label}</span>`
      : '';

    const cards = [
      { cls: 'total',   icon: iconGrid(),  label: 'Total Tests', filter: 'all',
        value: stats.total,
        sub: stats.retries > 0
          ? `${stats.retries} retr${stats.retries !== 1 ? 'ies' : 'y'} · ${stats.flaky} recovered`
          : 'No retries',
        tip: escHtml('<b>Total Tests</b><br>• Unique test cases in this run<br>• Retries are counted separately in the sub-line<br>• Growing count over time = expanding test coverage'),
      },
      { cls: 'passed',  icon: iconCheck(), label: 'Passed', filter: 'passed',
        value: stats.passed,
        sub: `${stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(0) : 0}% of total`,
        delta: deltaSub(stats.passed, prevRun, 'passed', false),
        tip: escHtml('<b>Passed</b><br>• Completed successfully on first attempt<br>• Aim for this to equal Total · ↑ positive trend · ↓ regressions appeared<br>• Click to see all passed tests') + deltaLine('passed', 'passed', prevRun && prevRun.passed),
      },
      { cls: 'failed',  icon: iconX(),     label: 'Failed', filter: 'failed',
        value: stats.failed,
        sub: stats.failed === 0 ? 'Clean run ✓' : 'Need attention',
        delta: deltaSub(stats.failed, prevRun, 'failed', true),
        tip: escHtml('<b>Failed</b><br>• Could not recover even after retries — blocks releases<br>• Zero = green build · ↑ = more failures · ↓ = improvement<br>• Click to see all failed tests') + deltaLine('failed', 'failed', prevRun && prevRun.failed),
      },
      { cls: 'flaky',   icon: iconWave(),  label: 'Flaky', filter: 'flaky',
        value: stats.flaky,
        sub: stats.flaky === 0 ? 'No flakiness' : 'Unstable tests',
        delta: deltaSub(stats.flaky, prevRun, 'flaky', true),
        tip: escHtml('<b>Flaky</b><br>• Failed but passed after retries — not blocking<br>• Masks real issues and slows CI · ↑ = instability · ↓ = resolved<br>• Click to see flaky tests') + deltaLine('flaky', 'flaky', prevRun && prevRun.flaky),
      },
      { cls: 'skipped', icon: iconMinus(), label: 'Skipped', filter: 'skipped',
        value: stats.skipped,
        sub: 'Not executed',
        delta: deltaSub(stats.skipped, prevRun, 'skipped', null),
        tip: escHtml('<b>Skipped</b><br>• Not executed — marked as skip or excluded by config<br>• Rising count may indicate tests suppressed to avoid failures<br>• ↑ = more skipped · ↓ = tests reinstated · click to review') + deltaLine('skipped', 'skipped', prevRun && prevRun.skipped),
      },
    ];

    grid.innerHTML = cards.map(c => `
      <div class="sv-stat-card ${c.cls}"
           style="cursor:pointer;position:relative;"
           data-sv-tip="${c.tip}"
           onclick="SarvaOverview.goToTests('${c.filter}')"
           onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 16px rgba(0,0,0,0.18)'"
           onmouseleave="this.style.transform='';this.style.boxShadow=''">
        <div class="sv-stat-icon">${c.icon}</div>
        <div class="sv-stat-value">${c.value}</div>
        <div class="sv-stat-label">${c.label}</div>
        <div class="sv-stat-sub">${c.delta || c.sub}</div>
      </div>`).join('');
  }

  /* ── Pass Rate — segmented bar ───────────────────────────────────────────────── */
  function renderPassRate(stats) {
    const val = document.getElementById('sv-pass-rate-value');
    const bar = document.getElementById('sv-pass-rate-bar');
    const bd  = document.getElementById('sv-pass-breakdown');
    if (!val) return;
    val.textContent = `${stats.passRate}%`;

    const total = stats.total || 1;
    if (bar) {
      const segs = [
        { cls: 'passed',  n: stats.passed },
        { cls: 'failed',  n: stats.failed },
        { cls: 'flaky',   n: stats.flaky },
        { cls: 'skipped', n: stats.skipped },
      ].filter(s => s.n > 0);
      bar.innerHTML = segs.map(s => {
        const label = s.cls.charAt(0).toUpperCase() + s.cls.slice(1);
        const pct   = (s.n / total * 100).toFixed(1);
        const tip   = escHtml(`<b>${label}</b>${s.n} tests · ${pct}%`);
        return `<div class="sv-progress-seg-fill ${s.cls}" style="width:${pct}%;cursor:default;" data-sv-tip="${tip}"></div>`;
      }).join('');
    }

    if (bd) {
      const items = [
        { cls: 'passed',  label: 'Passed',  n: stats.passed },
        { cls: 'failed',  label: 'Failed',  n: stats.failed },
        { cls: 'flaky',   label: 'Flaky',   n: stats.flaky },
        { cls: 'skipped', label: 'Skipped', n: stats.skipped },
      ];
      bd.innerHTML = items.filter(i => i.n > 0).map(i => `
        <span class="sv-flex sv-gap-sm" style="font-size:0.78rem;">
          <span style="width:8px;height:8px;border-radius:50%;background:var(--status-${i.cls});display:inline-block;flex-shrink:0;margin-top:4px;"></span>
          <span style="color:var(--text-secondary);">${i.label}</span>
          <span style="font-weight:600;color:var(--text-primary);">${i.n}</span>
        </span>`).join('');
    }
  }

  /* ── Donut with center % ────────────────────────────────────────────────────── */
  function renderDonut(stats) {
    const el = document.getElementById('sv-donut-chart');
    if (!el || typeof echarts === 'undefined') return;

    const isDark = !document.body.classList.contains('light-mode');
    const chart  = echarts.init(el, null, { renderer: 'svg' });

    const data = [
      { name: 'Passed',  value: stats.passed,  itemStyle: { color: '#22c55e' } },
      { name: 'Failed',  value: stats.failed,  itemStyle: { color: '#f43f5e' } },
      { name: 'Flaky',   value: stats.flaky,   itemStyle: { color: '#f59e0b' } },
      { name: 'Skipped', value: stats.skipped, itemStyle: { color: '#64748b' } },
    ].filter(d => d.value > 0);

    const txtColor = isDark ? '#e6eaf4' : '#1a1d2e';
    const mutedColor = isDark ? '#8b92a8' : '#4b5268';
    chart.setOption({
      backgroundColor: 'transparent',
      graphic: [{
        type: 'text', left: 'center', top: 'middle',
        style: {
          text: `${stats.passRate}%`,
          textAlign: 'center',
          textVerticalAlign: 'middle',
          fill: txtColor,
          fontSize: 20,
          fontWeight: 'bold',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      }],
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: isDark ? '#1e2438' : '#fff',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        textStyle: { color: txtColor, fontSize: 12 },
      },
      series: [{
        type: 'pie',
        radius: ['52%', '82%'],
        center: ['50%', '50%'],
        data,
        label: { show: false },
        emphasis: { scale: true, scaleSize: 5 },
        itemStyle: { borderRadius: 3, borderWidth: 2, borderColor: isDark ? '#161b27' : '#fff' },
      }],
    });

    const legend = document.getElementById('sv-donut-legend');
    if (legend) {
      legend.innerHTML = data.map(d => `
        <div class="sv-flex sv-gap-sm" style="font-size:0.78rem;">
          <span style="width:10px;height:10px;border-radius:2px;background:${d.itemStyle.color};display:inline-block;flex-shrink:0;margin-top:3px;"></span>
          <span style="color:var(--text-secondary);">${d.name}</span>
          <span style="font-weight:600;color:var(--text-primary);margin-left:auto;padding-left:0.5rem;">${d.value}</span>
        </div>`).join('');
    }

    SarvaEventBus.on('theme:changed', () => { chart.dispose(); renderDonut(stats); });
  }

  /* ── Health Pulse — pass rate % over time ────────────────────────────────────── */
  function renderHealthPulse(history) {
    const el    = document.getElementById('sv-health-chart');
    const empty = document.getElementById('sv-health-empty');
    const label = document.getElementById('sv-health-runs-label');
    if (!el || typeof echarts === 'undefined') return;

    // Oldest first (history is newest-first from store)
    const display = history.slice().reverse();

    if (display.length < 2) {
      if (el)    el.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }

    if (label) label.textContent = `Last ${display.length} runs`;

    /* Trend badge: delta between the two most recent runs */
    const trendEl = document.getElementById('sv-health-trend');
    if (trendEl && display.length >= 2) {
      const last = display[display.length - 1];   // newest (display is oldest-first after reverse)
      const prev = display[display.length - 2];   // immediately previous run
      const tLast = (last.passed||0)+(last.failed||0)+(last.flaky||0)+(last.skipped||0);
      const tPrev = (prev.passed||0)+(prev.failed||0)+(prev.flaky||0)+(prev.skipped||0);
      const rLast = tLast > 0 ? +((last.passed / tLast) * 100).toFixed(1) : 0;
      const rPrev = tPrev > 0 ? +((prev.passed / tPrev) * 100).toFixed(1) : 0;
      const diff  = +(rLast - rPrev).toFixed(1);
      const totalRuns = _cachedHistory ? _cachedHistory.length : display.length;
      const prevLabel = `#${totalRuns - 1}: ${rPrev}%`;
      const lastLabel = `#${totalRuns} (latest): ${rLast}%`;
      if (diff > 0) {
        const tip = `↑ Pass rate improved<br><span style='font-size:0.82em;opacity:0.85;'>${escHtml(prevLabel)} → ${escHtml(lastLabel)}<br>Change: +${diff}%</span>`;
        trendEl.innerHTML = `<span style="color:var(--status-passed);font-weight:600;cursor:default;" data-sv-tip="${tip}">↑ +${diff}%</span>`;
      } else if (diff < 0) {
        const tip = `↓ Pass rate dropped<br><span style='font-size:0.82em;opacity:0.85;'>${escHtml(prevLabel)} → ${escHtml(lastLabel)}<br>Change: −${Math.abs(diff)}%</span>`;
        trendEl.innerHTML = `<span style="color:var(--status-failed);font-weight:600;cursor:default;" data-sv-tip="${tip}">↓ ${Math.abs(diff)}%</span>`;
      } else {
        const tip = `= No change<br><span style='font-size:0.82em;opacity:0.85;'>${escHtml(prevLabel)} → ${escHtml(lastLabel)}<br>Pass rate unchanged from previous run.</span>`;
        trendEl.innerHTML = `<span style="color:var(--text-muted);font-size:0.68rem;cursor:default;" data-sv-tip="${tip}">= stable</span>`;
      }
    }

    const isDark = !document.body.classList.contains('light-mode');
    if (_healthChart) { try { _healthChart.dispose(); } catch (e) {} _healthChart = null; }
    _healthChart = echarts.init(el, null, { renderer: 'canvas' });
    const chart = _healthChart;

    const fmtDate = ts => {
      if (!ts) return '—';
      return new Date(ts).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    };

    const xData = display.map((_, i) => `#${i + 1}`);
    const yData = display.map(r => {
      const t = (r.passed || 0) + (r.failed || 0) + (r.flaky || 0) + (r.skipped || 0);
      return t > 0 ? +((r.passed / t) * 100).toFixed(1) : 0;
    });
    const durData = display.map(r => r.duration > 0 ? +(r.duration / 1000).toFixed(1) : null);
    const hasDuration = durData.some(d => d !== null && d > 0);

    const axisColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const labelColor = isDark ? '#8b92a8' : '#4b5268';
    const splitColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

    chart.setOption({
      backgroundColor: 'transparent',
      legend: {
        show: hasDuration,
        bottom: 20,
        itemWidth: 18, itemHeight: 8,
        textStyle: { color: labelColor, fontSize: 10 },
        inactiveColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
        selected: { 'Pass Rate': _healthSeriesVisible.passRate, 'Duration': _healthSeriesVisible.duration },
      },
      grid: { top: 12, right: hasDuration ? 48 : 16, bottom: hasDuration ? 68 : 36, left: 44 },
      xAxis: {
        type: 'category',
        data: xData,
        boundaryGap: false,
        axisLine:  { lineStyle: { color: axisColor } },
        axisTick:  { show: false },
        axisLabel: {
          color: labelColor, fontSize: 10,
          interval: Math.max(0, Math.ceil(display.length / 8) - 1),
        },
        splitLine: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          min: 0, max: 100,
          axisLine:  { show: false },
          axisTick:  { show: false },
          axisLabel: { color: labelColor, fontSize: 10, formatter: '{value}%' },
          splitLine: { lineStyle: { color: splitColor } },
        },
        ...(hasDuration ? [{
          type: 'value',
          position: 'right',
          axisLine:  { show: false },
          axisTick:  { show: false },
          axisLabel: { color: 'rgba(99,102,241,0.6)', fontSize: 9, formatter: v => `${v}s` },
          splitLine: { show: false },
        }] : []),
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1e2438' : '#fff',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        textStyle: { color: isDark ? '#e6eaf4' : '#1a1d2e', fontSize: 12 },
        formatter: params => {
          const r = display[params[0].dataIndex];
          const dt = fmtDate(r.timestamp);
          const durSec = r.duration > 0 ? (r.duration / 1000).toFixed(1) : null;
          return `<b>Run ${params[0].name}</b>${dt !== '—' ? `<br/><span style="color:#8b92a8;font-size:0.85em;">${dt}</span>` : ''}`
            + `<br/>Pass Rate: <b style="color:#22c55e;">${yData[params[0].dataIndex]}%</b>`
            + (durSec ? `<br/>Duration: <b style="color:rgba(99,102,241,0.9);">${durSec}s</b>` : '');
        },
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        {
          type: 'slider',
          show: true,
          bottom: 0,
          height: 14,
          borderColor: 'transparent',
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
          fillerColor: isDark ? 'rgba(99,102,241,0.22)' : 'rgba(99,102,241,0.18)',
          handleStyle: {
            color: '#6366f1',
            borderColor: '#6366f1',
            borderWidth: 0,
            shadowBlur: 4,
            shadowColor: 'rgba(99,102,241,0.5)',
          },
          handleSize: '70%',
          moveHandleStyle: { color: '#6366f1', opacity: 0.6 },
          emphasis: { handleStyle: { color: '#818cf8' } },
          dataBackground: {
            lineStyle: { color: 'rgba(99,102,241,0.3)', width: 1 },
            areaStyle: { color: 'rgba(99,102,241,0.08)' },
          },
          selectedDataBackground: {
            lineStyle: { color: '#6366f1', width: 1 },
            areaStyle: { color: 'rgba(99,102,241,0.15)' },
          },
          textStyle: { color: 'transparent' },
          labelFormatter: () => '',
        },
      ],
      series: [
        {
        name: 'Pass Rate',
        type: 'line',
        yAxisIndex: 0,
        data: yData,
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#22c55e', width: 2.5 },
        itemStyle: { color: '#22c55e', borderColor: '#fff', borderWidth: 1.5 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(34,197,94,0.22)' },
              { offset: 1, color: 'rgba(34,197,94,0.01)' },
            ],
          },
        },
      },
      ...(hasDuration ? [{
        name: 'Duration',
        type: 'line',
        yAxisIndex: 1,
        data: durData,
        smooth: 0.4,
        symbol: 'none',
        lineStyle: { color: 'rgba(99,102,241,0.45)', width: 1.5, type: 'dashed' },
        itemStyle: { color: 'rgba(99,102,241,0.45)' },
        areaStyle: { color: 'transparent' },
        tooltip: { show: true },
      }] : []),
      ],
    });

    chart.on('datazoom', () => {
      if (!_historyChart) return;
      const [dz] = _healthChart.getOption().dataZoom;
      _historyChart.setOption({ dataZoom: [{ start: dz.start, end: dz.end }, { start: dz.start, end: dz.end }] });
    });
    if (hasDuration) {
      chart.on('legendselectchanged', params => {
        if (_preventLegendLoop) return;
        const anyVisible = Object.values(params.selected).some(v => v);
        if (!anyVisible) {
          // Revert: re-select the one just deselected so at least one stays visible
          _preventLegendLoop = true;
          chart.dispatchAction({ type: 'legendSelect', name: params.name });
          _preventLegendLoop = false;
          return;
        }
        _healthSeriesVisible.passRate = !!params.selected['Pass Rate'];
        _healthSeriesVisible.duration = !!params.selected['Duration'];
        const durNowVisible = _healthSeriesVisible.duration;
        chart.setOption({
          grid:  { right: durNowVisible ? 48 : 16 },
          yAxis: [{ min: 0, max: 100 }, { axisLabel: { show: durNowVisible } }],
        });
      });
    }
    SarvaEventBus.on('theme:changed', () => {
      if (_healthChart) { try { _healthChart.dispose(); } catch (e) {} _healthChart = null; }
      renderHealthPulse(history);
    });
  }

  /* ── Run History — Stacked Bars (oldest left → newest right) ────────────────── */
  function renderHistoryChart(history) {
    const el    = document.getElementById('sv-history-chart');
    const empty = document.getElementById('sv-history-empty');
    const label = document.getElementById('sv-history-runs-label');
    if (!el || typeof echarts === 'undefined') return;

    // Oldest first (history is newest-first from store)
    const display = history.slice().reverse();

    if (display.length < 2) {
      if (el)    el.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }

    if (label) label.textContent = `Last ${display.length} runs`;
    const isDark = !document.body.classList.contains('light-mode');
    if (_historyChart) { try { _historyChart.dispose(); } catch (e) {} _historyChart = null; }
    _historyChart = echarts.init(el, null, { renderer: 'svg' });
    const chart = _historyChart;

    const xData   = display.map((_, i) => `#${i + 1}`);
    const passed  = display.map(r => r.passed  || 0);
    const failed  = display.map(r => r.failed  || 0);
    const flaky   = display.map(r => r.flaky   || 0);
    const skipped = display.map(r => r.skipped || 0);

    const axisStyle = {
      axisLine:  { lineStyle: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' } },
      axisTick:  { show: false },
      axisLabel: { color: isDark ? '#8b92a8' : '#4b5268', fontSize: 11 },
      splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' } },
    };

    const mkBar = (name, data, color) => ({
      name, type: 'bar', stack: 'total', data,
      itemStyle: { color },
      emphasis: { focus: 'series' },
    });

    chart.setOption({
      backgroundColor: 'transparent',
      grid: { top: 10, right: 16, bottom: 68, left: 36 },
      xAxis: { type: 'category', data: xData, ...axisStyle },
      yAxis: { type: 'value', ...axisStyle },
      legend: {
        bottom: 20, itemWidth: 10, itemHeight: 10,
        textStyle: { color: isDark ? '#8b92a8' : '#4b5268', fontSize: 11 },
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        {
          type: 'slider',
          show: true,
          bottom: 2,
          height: 14,
          borderColor: 'transparent',
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
          fillerColor: isDark ? 'rgba(99,102,241,0.22)' : 'rgba(99,102,241,0.18)',
          handleStyle: {
            color: '#6366f1', borderColor: '#6366f1', borderWidth: 0,
            shadowBlur: 4, shadowColor: 'rgba(99,102,241,0.5)',
          },
          handleSize: '70%',
          moveHandleStyle: { color: '#6366f1', opacity: 0.6 },
          emphasis: { handleStyle: { color: '#818cf8' } },
          dataBackground: {
            lineStyle: { color: 'rgba(99,102,241,0.3)', width: 1 },
            areaStyle: { color: 'rgba(99,102,241,0.08)' },
          },
          selectedDataBackground: {
            lineStyle: { color: '#6366f1', width: 1 },
            areaStyle: { color: 'rgba(99,102,241,0.15)' },
          },
          textStyle: { color: 'transparent' },
          labelFormatter: () => '',
        },
      ],
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        confine: true,
        backgroundColor: isDark ? '#1e2438' : '#fff',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        textStyle: { color: isDark ? '#e6eaf4' : '#1a1d2e', fontSize: 12 },
        formatter: params => {
          const r = display[params[0].dataIndex];
          const total = (r.total || (r.passed||0)+(r.failed||0)+(r.flaky||0)+(r.skipped||0));
          const pr = total > 0 ? (((r.passed||0) / total) * 100).toFixed(1) : 0;
          const dt = r.timestamp ? new Date(r.timestamp).toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          }) : '';
          return `<b>Run ${params[0].axisValue}</b>${dt ? `<br/><span style="color:#8b92a8;font-size:0.85em;">${dt}</span>` : ''}<br/>` +
            params.filter(p => p.value > 0).map(p =>
              `${p.marker}${p.seriesName}: <b>${p.value}</b>`).join('<br/>') +
            `<br/><span style="color:#6366f1;">Pass rate: <b>${pr}%</b></span>`;
        },
      },
      series: [
        mkBar('Passed',  passed,  '#22c55e'),
        mkBar('Failed',  failed,  '#f43f5e'),
        mkBar('Flaky',   flaky,   '#f59e0b'),
        mkBar('Skipped', skipped, '#64748b'),
      ],
    });

    chart.on('datazoom', () => {
      if (!_healthChart) return;
      const [dz] = _historyChart.getOption().dataZoom;
      _healthChart.setOption({ dataZoom: [{ start: dz.start, end: dz.end }, { start: dz.start, end: dz.end }] });
    });

    let _historyLegendLoop = false;
    chart.on('legendselectchanged', params => {
      if (_historyLegendLoop) return;
      if (!Object.values(params.selected).some(v => v)) {
        _historyLegendLoop = true;
        chart.dispatchAction({ type: 'legendSelect', name: params.name });
        _historyLegendLoop = false;
      }
    });

    SarvaEventBus.on('theme:changed', () => {
      if (_historyChart) { try { _historyChart.dispose(); } catch (e) {} _historyChart = null; }
      renderHistoryChart(history);
    });
  }

  /* ── Top Failures — ranked by cross-run failure count ──────────────────────── */
  function renderTopFailures(finalTests) {
    const list  = document.getElementById('sv-top-failures-list');
    const count = document.getElementById('sv-top-failures-count');
    if (!list) return;

    // Build ranked list from testHistory (cross-run), falling back to current run only
    const seen = new Set();
    const failData = [];

    (SarvaStore.testHistory || []).forEach(entry => {
      const failCount = (entry.history || []).filter(h => (h.status === 'failed' || h.status === 'broken') && !h.wasFlaky).length;
      if (failCount === 0) return;
      const name = entry.testName || entry.testId;
      if (seen.has(name)) return;
      seen.add(name);

      // Resolve exact fullName from testId (strips "tool:" prefix) to handle multi-browser variants
      const histFullName = entry.testId && entry.testId.includes(':')
        ? entry.testId.split(':').slice(1).join(':') : null;
      // Find uuid: prefer exact browser variant match, fallback to name match
      const cur = (histFullName && (
        finalTests.find(t => t.fullName === histFullName) ||
        (SarvaStore.tests || []).find(t => t.fullName === histFullName)
      )) ||
        finalTests.find(t => t.fullName === name || t.name === name) ||
        (SarvaStore.tests || []).find(t => t.fullName === name || t.name === name);
      const curStatus = cur ? (cur.status === 'broken' ? 'failed' : cur.status) : null;
      const firstSeg  = histFullName ? histFullName.split('>')[0].trim() : '';
      const browser   = firstSeg && !firstSeg.includes('.') && !firstSeg.includes('/') ? firstSeg : null;
      failData.push({
        uuid:         cur ? cur.uuid : null,
        name:         cur ? cur.name : name,
        fullName:     name,
        duration:     cur ? cur.duration : null,
        failCount,
        totalRuns:    (entry.history || []).length,
        currentFail:  curStatus === 'failed',
        currentStatus: curStatus,
        browser,
      });
    });

    // Also add current-run failures not yet in history (edge case: first run)
    finalTests.filter(t => t.status === 'failed' || t.status === 'broken').forEach(t => {
      if (!seen.has(t.fullName)) {
        const s = t.status === 'broken' ? 'failed' : t.status;
        failData.push({ uuid: t.uuid, name: t.name, fullName: t.fullName,
          duration: t.duration, failCount: 1, totalRuns: 1, currentFail: true, currentStatus: s });
      }
    });

    failData.sort((a, b) => b.failCount - a.failCount);
    const top = failData;

    if (count) count.textContent = `${top.length} tests`;
    if (top.length === 0) {
      list.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:2rem;font-size:0.8rem;">No failures detected 🎉</div>`;
      return;
    }

    list.innerHTML = top.map((f, i) => {
      // Last 10 run symbols with hover date/time (same approach as Top Flaky)
      // Match testHistory by the stored fullName (which came from entry.testName at failData build time)
      // Also try testId exact match for multi-browser precision
      const histEntry = (SarvaStore.testHistory || []).find(t =>
        (t.testName === f.fullName || t.testName === f.name) &&
        (t.history || []).some(h => (h.status === 'failed' || h.status === 'broken') && !h.wasFlaky)
      ) || (SarvaStore.testHistory || []).find(t =>
        t.testName === f.fullName || t.testName === f.name ||
        t.testId   === f.fullName || t.testId   === f.name
      );
      const last10 = histEntry ? histEntry.history.slice(0, 10).reverse() : [];
      const symbols = last10.map(h => {
        const run = (SarvaStore.history || []).find(r => r.id === h.runId);
        const dt  = run && run.timestamp ? new Date(run.timestamp).toLocaleString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        }) : '';
        const isFlaky  = h.wasFlaky || h.status === 'flaky';
        const isFailed = h.status === 'failed' || h.status === 'broken';
        let label, color, sym;
        if (isFlaky)        { label = 'Flaky (passed after retry)'; color = 'var(--status-flaky)';   sym = '~'; }
        else if (isFailed)  { label = 'Failed';                     color = 'var(--status-failed)';  sym = '✗'; }
        else if (h.status === 'passed') { label = 'Passed';         color = 'var(--status-passed)';  sym = '✓'; }
        else                { label = 'Skipped';                    color = 'var(--status-skipped)'; sym = '○'; }
        const tip = dt ? `<b>${label}</b>${dt}` : `<b>${label}</b>`;
        return `<span data-sv-tip="${escHtml(tip)}" style="color:${color};font-size:0.75rem;cursor:default;line-height:1;">${sym}</span>`;
      }).join('');

      // Most recent failure timestamp (history is newest-first)
      const lastFailH   = histEntry && (histEntry.history || []).find(h => (h.status === 'failed' || h.status === 'broken') && !h.wasFlaky);
      const lastFailRun = lastFailH && (SarvaStore.history || []).find(r => r.id === lastFailH.runId);
      const lastFailAt  = lastFailRun && lastFailRun.timestamp
        ? new Date(lastFailRun.timestamp).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : null;

      return `
      <div style="display:flex;align-items:center;gap:0.75rem;padding:0.65rem 1.25rem;
                  border-bottom:1px solid var(--border);${f.uuid ? 'cursor:pointer;' : ''}"
           ${f.uuid ? `onclick="SarvaTestDetail.open('${f.uuid}')"` : ''}
           onmouseenter="this.style.background='var(--bg-hover)'"
           onmouseleave="this.style.background=''">
        <span style="color:var(--text-muted);font-size:0.72rem;width:1rem;flex-shrink:0;">${i + 1}</span>
        <span class="sv-pill ${f.currentStatus || 'skipped'}" style="flex-shrink:0;">${f.currentStatus === 'failed' ? '✗' : f.currentStatus === 'flaky' ? '~' : f.currentStatus === 'passed' ? '✓' : '○'}</span>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:0.4rem;min-width:0;">
            <span class="sv-truncate" style="font-size:0.82rem;">${escHtml(f.name)}</span>
            ${lastFailAt ? `<span data-sv-tip="${escHtml('<b>Last Failed:</b>' + lastFailAt + (f.browser ? '<br>Browser: ' + f.browser : ''))}" style="color:var(--status-failed);opacity:0.7;cursor:default;flex-shrink:0;display:inline-flex;align-items:center;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>` : ''}
            ${f.duration ? `<span style="font-size:0.7rem;color:var(--text-muted);flex-shrink:0;margin-left:auto;">${fmtDuration(f.duration)}</span>` : ''}
          </div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;display:flex;align-items:center;gap:0.4rem;">
            <span>Failed in ${f.failCount} of ${f.totalRuns} runs</span>
            ${symbols ? `<span style="display:inline-flex;gap:1px;align-items:center;margin-left:0.25rem;">${symbols}</span>` : ''}
          </div>
        </div>
        ${f.uuid ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>` : ''}
      </div>`;
    }).join('');
  }

  /* ── Top Flaky Offenders — with last-10 sparkline symbols ───────────────────── */
  function renderTopFlaky() {
    const list  = document.getElementById('sv-top-flaky-list');
    const count = document.getElementById('sv-top-flaky-count');
    if (!list) return;

    const topFlaky = (SarvaStore.testHistory || [])
      .filter(t => t.flakyScore > 0 || t.wasEverFlaky)
      .sort((a, b) => b.flakyScore - a.flakyScore);

    if (count) count.textContent = `${topFlaky.length} tests`;

    if (topFlaky.length === 0) {
      list.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:2rem;font-size:0.8rem;">No flaky tests detected 🎉</div>`;
      return;
    }

    list.innerHTML = topFlaky.map((t, i) => {
      // flakyScore is already 0-100 integer — use directly
      const score     = Math.round(t.flakyScore || 0);
      const runs      = t.history ? t.history.length : 0;
      const flakyRuns = t.history ? t.history.filter(h => h.wasFlaky || h.status === 'flaky').length : 0;

      // Last 10 run symbols (history is newest-first; show oldest→newest left→right)
      const last10 = t.history ? t.history.slice(0, 10).reverse() : [];
      const symbols = last10.map(h => {
        const run = (SarvaStore.history || []).find(r => r.id === h.runId);
        const dt = run && run.timestamp ? new Date(run.timestamp).toLocaleString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        }) : '';
        const isFlaky  = h.wasFlaky || h.status === 'flaky';
        const isFailed = h.status === 'failed' || h.status === 'broken';
        let label, color, sym;
        if (isFlaky)       { label = 'Flaky (passed after retry)'; color = 'var(--status-flaky)';   sym = '~'; }
        else if (h.status === 'passed') { label = 'Passed';  color = 'var(--status-passed)';  sym = '✓'; }
        else if (isFailed) { label = 'Failed';               color = 'var(--status-failed)';  sym = '✗'; }
        else               { label = 'Skipped';              color = 'var(--status-skipped)'; sym = '○'; }
        const tip = dt ? `<b>${label}</b>${dt}` : `<b>${label}</b>`;
        return `<span data-sv-tip="${escHtml(tip)}" style="color:${color};font-size:0.75rem;cursor:default;line-height:1;">${sym}</span>`;
      }).join('');

      // Most recent flaky timestamp (history is newest-first)
      const lastFlakyH   = t.history && t.history.find(h => h.wasFlaky || h.status === 'flaky');
      const lastFlakyRun = lastFlakyH && (SarvaStore.history || []).find(r => r.id === lastFlakyH.runId);
      const lastFlakyAt  = lastFlakyRun && lastFlakyRun.timestamp
        ? new Date(lastFlakyRun.timestamp).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : null;

      const flakyHistId   = t.testId && t.testId.includes(':') ? t.testId.split(':').slice(1).join(':') : null;
      const flakyFirstSeg = flakyHistId ? flakyHistId.split('>')[0].trim() : '';
      const flakyBrowser  = flakyFirstSeg && !flakyFirstSeg.includes('.') && !flakyFirstSeg.includes('/') ? flakyFirstSeg : null;

      const flakyFullName = t.testId && t.testId.includes(':') ? t.testId.split(':').slice(1).join(':') : t.testName;
      const flakyCur = (SarvaStore.tests || []).find(tc => tc.fullName === flakyFullName || tc.name === t.testName);
      const flakyUuid = flakyCur?.uuid;

      // Latest run status (history is newest-first)
      const latestH      = t.history && t.history.length > 0 ? t.history[0] : null;
      const latestIsFlaky = latestH && (latestH.wasFlaky || latestH.status === 'flaky');
      const latestStatus = !latestH ? 'skipped'
        : latestIsFlaky                                         ? 'flaky'
        : (latestH.status === 'failed' || latestH.status === 'broken') ? 'failed'
        : latestH.status === 'passed'                          ? 'passed'
        : 'skipped';
      const latestSym    = latestStatus === 'failed' ? '✗' : latestStatus === 'flaky' ? '~' : latestStatus === 'passed' ? '✓' : '○';

      return `
      <div style="display:flex;align-items:center;gap:0.75rem;padding:0.65rem 1.25rem;
                  border-bottom:1px solid var(--border);${flakyUuid ? 'cursor:pointer;' : ''}"
           ${flakyUuid ? `onclick="SarvaTestDetail.open('${flakyUuid}')"` : ''}
           onmouseenter="this.style.background='var(--bg-hover)'"
           onmouseleave="this.style.background=''">
        <span style="color:var(--text-muted);font-size:0.72rem;width:1rem;flex-shrink:0;">${i + 1}</span>
        <span class="sv-pill ${latestStatus}" style="flex-shrink:0;">${latestSym}</span>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:0.4rem;min-width:0;">
            <span class="sv-truncate" style="font-size:0.82rem;">${escHtml(t.testName)}</span>
            ${lastFlakyAt ? `<span data-sv-tip="${escHtml('<b>Last Flaky:</b>' + lastFlakyAt + (flakyBrowser ? '<br>Browser: ' + flakyBrowser : ''))}" style="color:var(--status-flaky);opacity:0.7;cursor:default;flex-shrink:0;display:inline-flex;align-items:center;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>` : ''}
          </div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;display:flex;align-items:center;gap:0.4rem;">
            <span>Unstable in ${flakyRuns} of ${runs} runs</span>
            ${symbols ? `<span style="display:inline-flex;gap:1px;align-items:center;margin-left:0.25rem;">${symbols}</span>` : ''}
          </div>
        </div>
        <div style="flex-shrink:0;text-align:right;margin-right:0.25rem;">
          <div style="font-size:0.85rem;font-weight:700;color:var(--status-flaky);">${score}%</div>
          <div style="font-size:0.68rem;color:var(--text-muted);">flaky rate</div>
        </div>
        ${flakyUuid ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>` : ''}
      </div>`;
    }).join('');
  }

  /* ── Newly Failing / Recently Fixed ────────────────────────────────────────── */
  function renderNewlyFailing() {
    const section = document.getElementById('sv-newly-failing-section');
    if (!section) return;

    const INFO_ICON_SM = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;

    const newlyFailing = [];
    const recentlyFixed = [];

    (SarvaStore.testHistory || []).forEach(entry => {
      const h = entry.history || [];
      if (h.length < 2) return;
      const recent = h[0];

      // Resolve the matching test — prefer exact fullName match (browser-specific),
      // fall back to name match. Extract browser label from testId for display.
      const fullName = entry.testId && entry.testId.includes(':')
        ? entry.testId.split(':').slice(1).join(':') : entry.testName;
      const cur = (SarvaStore.tests || []).find(t => t.fullName === fullName)
               || (SarvaStore.tests || []).find(t => t.name === entry.testName);

      // Extract browser from testId (e.g. "playwright:chromium > ..." → "chromium")
      let browser = '';
      if (entry.testId && entry.testId.includes(':')) {
        const seg = entry.testId.split(':')[1] || '';
        const knownBrowsers = ['chromium', 'firefox', 'webkit', 'chrome', 'safari', 'edge'];
        const b = seg.split('>')[0].trim().toLowerCase();
        if (knownBrowsers.some(kb => b.includes(kb))) browser = b;
      }
      const displayName = (entry.testName || fullName) + (browser ? ` (${browser})` : '');

      const isFailed = s => (s === 'failed' || s === 'broken');
      const isPassed = e => e.status === 'passed' || e.wasFlaky;

      if (isFailed(recent.status) && !recent.wasFlaky) {
        // Newly Failing: current run = failed AND the immediately previous run = passed
        if (h.length >= 2 && isPassed(h[1])) {
          const prevRun = (SarvaStore.history || []).find(r => r.id === h[1].runId);
          newlyFailing.push({
            name: displayName,
            uuid: cur?.uuid,
            lastPassAt: prevRun?.timestamp || null,
          });
        }
      } else if (recent.status === 'passed' && !recent.wasFlaky) {
        // Recently Fixed: current run = a clean pass (not flaky) AND the immediately previous run = failed
        if (h.length >= 2 && isFailed(h[1].status) && !h[1].wasFlaky) {
          const totalFails = h.filter(e => isFailed(e.status) && !e.wasFlaky).length;
          recentlyFixed.push({
            name: displayName,
            uuid: cur?.uuid,
            failCount: totalFails,
          });
        }
      }
    });

    if (newlyFailing.length === 0 && recentlyFixed.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';

    const fmtTs = ts => ts ? new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }) : null;

    const mkRow = (item, isNew) => {
      const sub = isNew
        ? (item.lastPassAt ? `Last passed: ${fmtTs(item.lastPassAt)}` : 'Was passing before')
        : `Was failing in ${item.failCount} run${item.failCount !== 1 ? 's' : ''}`;
      const color = isNew ? 'var(--status-failed)' : 'var(--status-passed)';
      const sym   = isNew ? '✗' : '✓';
      return `
      <div style="display:flex;align-items:center;gap:0.65rem;padding:0.55rem 1rem;
                  border-bottom:1px solid var(--border);${item.uuid ? 'cursor:pointer;' : ''}"
           ${item.uuid ? `onclick="SarvaTestDetail.open('${item.uuid}')"` : ''}
           onmouseenter="this.style.background='var(--bg-hover)'"
           onmouseleave="this.style.background=''">
        <span style="color:${color};font-size:0.8rem;flex-shrink:0;">${sym}</span>
        <div style="flex:1;min-width:0;">
          <div class="sv-truncate" style="font-size:0.8rem;font-weight:500;">${escHtml(item.name)}</div>
          <div style="font-size:0.68rem;color:var(--text-muted);margin-top:1px;">${sub}</div>
        </div>
        ${item.uuid ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>` : ''}
      </div>`;
    };

    const emptyRow = msg => `<div style="text-align:center;color:var(--text-muted);padding:1.5rem;font-size:0.78rem;">${msg}</div>`;

    section.innerHTML = `
    <div class="sv-grid-2" style="gap:1rem;align-items:start;">
      <div class="sv-card" style="border-left:3px solid var(--status-failed);">
        <div class="sv-card-header">
          <span style="display:flex;align-items:center;gap:0.4rem;">
            <span class="sv-card-title" style="color:var(--status-failed);">Newly Failing</span>
            <span class="sv-info-btn" data-sv-tip="${escHtml('<b>Newly Failing</b><br>• Passing before but broke in this run<br>• A recent code change likely caused these — #1 priority<br>• Investigate commits since the last passing run<br>• Click any test to see the full error and stack trace')}">${INFO_ICON_SM}</span>
          </span>
          <span style="font-size:0.72rem;color:var(--text-muted);">${newlyFailing.length} test${newlyFailing.length !== 1 ? 's' : ''}</span>
        </div>
        <div style="padding:0;max-height:260px;overflow-y:auto;">
          ${newlyFailing.length ? newlyFailing.map(t => mkRow(t, true)).join('') : emptyRow('No newly failing tests 🎉')}
        </div>
      </div>
      <div class="sv-card" style="border-left:3px solid var(--status-passed);">
        <div class="sv-card-header">
          <span style="display:flex;align-items:center;gap:0.4rem;">
            <span class="sv-card-title" style="color:var(--status-passed);">Recently Fixed</span>
            <span class="sv-info-btn" data-sv-tip="${escHtml('<b>Recently Fixed</b><br>• Was failing before but passing now<br>• Represents resolved issues in this cycle<br>• Use this list to report progress to management')}">${INFO_ICON_SM}</span>
          </span>
          <span style="font-size:0.72rem;color:var(--text-muted);">${recentlyFixed.length} test${recentlyFixed.length !== 1 ? 's' : ''}</span>
        </div>
        <div style="padding:0;max-height:260px;overflow-y:auto;">
          ${recentlyFixed.length ? recentlyFixed.map(t => mkRow(t, false)).join('') : emptyRow('No recently fixed tests')}
        </div>
      </div>
    </div>`;
  }

  /* ── Browser / Tool Breakdown ────────────────────────────────────────────────── */
  function renderBrowserToolBreakdown(finalTests) {
    const section = document.getElementById('sv-browser-tool-section');
    if (!section) return;

    const INFO_ICON_SM = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;

    const groups = new Map();
    finalTests.forEach(t => {
      const tool    = t.tool || 'other';
      let   browser = t.extra?.playwright?.browser || t.extra?.selenium?.browserName || '';
      if (!browser) {
        const seg = t.fullName ? t.fullName.split('>')[0].trim() : '';
        if (seg && !seg.includes('.') && !seg.includes('/') && seg !== t.name) browser = seg;
      }
      const key = browser ? `${tool}::${browser}` : tool;
      if (!groups.has(key)) groups.set(key, { tool, browser, passed: 0, failed: 0, flaky: 0, skipped: 0, total: 0 });
      const g = groups.get(key);
      const s = t.status === 'broken' ? 'failed' : t.status;
      if (s in g) g[s]++;
      g.total++;
    });

    if (groups.size <= 1) { section.style.display = 'none'; return; }
    section.style.display = '';

    const rows = [...groups.values()].sort((a, b) => b.total - a.total);
    _browserGroups = rows;

    section.innerHTML = `
    <div class="sv-card">
      <div class="sv-card-header">
        <span style="display:flex;align-items:center;gap:0.4rem;">
          <span class="sv-card-title">Browser &amp; Tool Breakdown</span>
          <span class="sv-info-btn" data-sv-tip="${escHtml('<b>Browser & Tool Breakdown</b><br>• Outcomes grouped by browser and testing framework<br>• Failures in one browser only = browser-specific compatibility issue<br>• Failures across all browsers = code or environment problem<br>• Use to narrow root cause before investigating individual tests')}">${INFO_ICON_SM}</span>
        </span>
        <span style="display:flex;align-items:center;gap:0.4rem;">
          <span style="font-size:0.72rem;color:var(--text-muted);">${rows.length} browser${rows.length !== 1 ? 's' : ''}</span>
          <button class="sv-dl-btn" onclick="SarvaOverview.downloadBrowserCsv()" data-sv-tip="Download as CSV"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></button>
        </span>
      </div>
      <div class="sv-card-body" style="padding:0.75rem 1rem;">
        <div style="display:grid;grid-template-columns:1fr repeat(4,56px) 56px;gap:0.25rem 0.5rem;align-items:center;">
          <span style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted);">Tool / Browser</span>
          <span style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--status-passed);text-align:center;">Passed</span>
          <span style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--status-failed);text-align:center;">Failed</span>
          <span style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--status-flaky);text-align:center;">Flaky</span>
          <span style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted);text-align:center;">Skipped</span>
          <span style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted);text-align:center;">Total</span>
          ${rows.map(g => {
            const passRate = g.total > 0 ? ((g.passed / g.total) * 100).toFixed(0) : 0;
            const barColor = +passRate >= 90 ? 'var(--status-passed)' : +passRate >= 70 ? 'var(--status-flaky)' : 'var(--status-failed)';
            const tip = `<b>${escHtml(g.browser || g.tool)}</b><br>${passRate}% pass rate<br><span style='font-size:0.82em;opacity:0.85;'>${g.passed} passed · ${g.failed} failed · ${g.flaky} flaky · ${g.skipped} skipped</span><br><span style='font-size:0.75em;opacity:0.65;'><span style='color:var(--status-passed)'>&#9632;</span> ≥90% &nbsp;<span style='color:var(--status-flaky)'>&#9632;</span> 70–89% &nbsp;<span style='color:var(--status-failed)'>&#9632;</span> &lt;70%</span>`;
            return `
            <div style="display:contents;">
              <div style="display:flex;align-items:center;gap:0.4rem;padding:0.35rem 0;border-top:1px solid var(--border);">
                <span class="sv-tool-badge ${g.tool}" style="flex-shrink:0;">${g.tool}</span>
                ${g.browser ? `<span class="sv-browser-badge">${g.browser}</span>` : ''}
                <div style="flex:1;margin-left:0.25rem;">
                  <div style="height:4px;border-radius:2px;background:var(--bg-surface-3);overflow:hidden;cursor:default;" data-sv-tip="${tip}">
                    <div style="height:100%;width:${passRate}%;background:${barColor};transition:width 0.3s;"></div>
                  </div>
                </div>
              </div>
              <div style="text-align:center;padding:0.35rem 0;border-top:1px solid var(--border);font-size:0.82rem;font-weight:600;color:var(--status-passed);">${g.passed}</div>
              <div style="text-align:center;padding:0.35rem 0;border-top:1px solid var(--border);font-size:0.82rem;font-weight:600;color:${g.failed > 0 ? 'var(--status-failed)' : 'var(--text-muted)'};">${g.failed || '—'}</div>
              <div style="text-align:center;padding:0.35rem 0;border-top:1px solid var(--border);font-size:0.82rem;font-weight:600;color:${g.flaky > 0 ? 'var(--status-flaky)' : 'var(--text-muted)'};">${g.flaky || '—'}</div>
              <div style="text-align:center;padding:0.35rem 0;border-top:1px solid var(--border);font-size:0.82rem;color:var(--text-muted);">${g.skipped || '—'}</div>
              <div style="text-align:center;padding:0.35rem 0;border-top:1px solid var(--border);font-size:0.78rem;color:var(--text-secondary);">${g.total}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }

  /* ── Navigate to Tests tab with a pre-applied filter ────────────────────────── */
  function goToTests(filter) {
    SarvaShell.navigate('tests');
    const btn = document.querySelector(`.sv-filter-btn[data-filter="${filter}"]`);
    if (typeof SarvaTestList !== 'undefined') SarvaTestList.setFilter(filter, btn);
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
  function iconGrid() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`;
  }
  function iconCheck() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>`;
  }
  function iconX() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  }
  function iconWave() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`;
  }
  function iconMinus() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
  }

  /* ── Boot ───────────────────────────────────────────────────────────────────── */
  /* ── Print: executive summary + per-widget insights ────────────────────────── */
  function renderPrintContent(stats, history) {
    // Executive summary
    const sumEl = document.getElementById('sv-print-executive-summary');
    if (sumEl) {
      const prev    = history && history.length > 1 ? history[1] : null;
      const pt      = prev ? (prev.passed||0)+(prev.failed||0)+(prev.flaky||0)+(prev.skipped||0) : 0;
      const prevRate= pt > 0 ? +((prev.passed / pt) * 100).toFixed(1) : null;
      const diff    = prevRate !== null ? +(stats.passRate - prevRate).toFixed(1) : null;
      const n       = history ? history.length : 0;
      const trendTxt= diff === null ? '' : diff > 0
        ? `<span style="color:#16a34a;font-weight:700;">↑ Pass rate improved</span>&ensp;·&ensp;#${n-1}: ${prevRate}% → #${n} (latest): ${stats.passRate}%&ensp;·&ensp;Change: <span style="color:#16a34a;font-weight:700;">+${diff}%</span>`
        : diff < 0
        ? `<span style="color:#dc2626;font-weight:700;">↓ Pass rate dropped</span>&ensp;·&ensp;#${n-1}: ${prevRate}% → #${n} (latest): ${stats.passRate}%&ensp;·&ensp;Change: <span style="color:#dc2626;font-weight:700;">−${Math.abs(diff)}%</span>`
        : `<span style="color:#6b7280;">= Pass rate unchanged</span>&ensp;·&ensp;#${n-1}: ${prevRate}% → #${n} (latest): ${stats.passRate}%`;
      const healthTxt= stats.passRate >= 95 ? '✓ Suite is healthy' : stats.passRate >= 80 ? '⚠ Suite needs monitoring' : '✗ Suite needs immediate attention';
      const runDt   = history && history[0] && history[0].timestamp ? new Date(history[0].timestamp).toLocaleString(undefined, { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '';

      sumEl.innerHTML = `
        <div style="border-bottom:2px solid #6366f1;padding-bottom:1rem;margin-bottom:1.5rem;">
          <div style="font-size:1.4rem;font-weight:700;color:#1a1d2e;">Test Run Summary</div>
          ${runDt ? `<div style="font-size:0.85rem;color:#6b7280;margin-top:0.2rem;">${runDt}</div>` : ''}
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem;">
          ${[
            { label:'Total Tests', val: stats.total, color:'#374151' },
            { label:'Passed',      val: `${stats.passed} (${stats.passRate}%)`, color:'#16a34a' },
            { label:'Failed',      val: stats.failed, color: stats.failed > 0 ? '#dc2626' : '#374151' },
            { label:'Flaky',       val: stats.flaky,  color: stats.flaky  > 0 ? '#d97706' : '#374151' },
          ].map(c => `<div style="padding:0.75rem 1rem;border:1px solid #e2e8f0;border-radius:8px;">
            <div style="font-size:1.4rem;font-weight:700;color:${c.color};">${c.val}</div>
            <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;margin-top:2px;">${c.label}</div>
          </div>`).join('')}
        </div>
        <div style="display:flex;gap:1.5rem;flex-wrap:wrap;font-size:0.85rem;color:#374151;">
          ${trendTxt ? `<span>${trendTxt}</span>` : ''}
          ${stats.skipped > 0 ? `<span style="color:#6b7280;">${stats.skipped} skipped</span>` : ''}
          ${stats.retries > 0 ? `<span style="color:#6b7280;">${stats.retries} retries recorded</span>` : ''}
          <span style="margin-left:auto;font-weight:600;">${healthTxt}</span>
        </div>`;
    }

    // Per-widget insights (injected under each card's body)
    function setInsight(id, text) {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    }

    const h = history && history.length > 0 ? history : [];
    const rates = h.map(r => { const t=(r.passed||0)+(r.failed||0)+(r.flaky||0)+(r.skipped||0); return t>0?+((r.passed/t)*100).toFixed(1):0; });
    const best  = rates.length ? Math.max(...rates) : stats.passRate;
    const worst = rates.length ? Math.min(...rates) : stats.passRate;
    const avgR  = rates.length ? +(rates.reduce((a,b)=>a+b,0)/rates.length).toFixed(1) : stats.passRate;

    setInsight('sv-print-insight-distribution',
      `${stats.passRate}% pass rate this run. ${stats.failed} test${stats.failed!==1?'s':''} failed${stats.flaky>0?`, ${stats.flaky} flaky`:''}${stats.skipped>0?`, ${stats.skipped} skipped`:''}. ${stats.total} tests total.`);
    setInsight('sv-print-insight-health',
      h.length >= 2 ? `Pass rate averaged ${avgR}% across the last ${h.length} runs. Best: ${best}% · Worst: ${worst}%.` : 'Run multiple times to see health trends.');
    setInsight('sv-print-insight-history',
      h.length >= 2 ? `Showing ${h.length} runs. Most recent run: ${stats.passRate}%. Range: ${worst}%–${best}%.` : 'First run — no historical comparison available.');
  }

  SarvaEventBus.on('store:ready', ({ stats, history }) => {
    _cachedStats   = stats;
    _cachedHistory = history;
    renderPrintContent(stats, history);
    renderAttentionStrip(stats);
    renderStatCards(stats);
    renderPassRate(stats);
    renderTopFailuresAndStore(stats.finalTests || []);
    renderTopFlakyAndStore();
    renderNewlyFailing();
    renderBrowserToolBreakdown(stats.finalTests || []);
    if (typeof echarts !== 'undefined') {
      const h = getFilteredHistory();
      renderDonut(stats);
      renderHealthPulse(h);
      renderHistoryChart(h);
    }
  });

  SarvaEventBus.on('echarts:ready', () => {
    if (_cachedStats)   renderDonut(_cachedStats);
    if (_cachedHistory) {
      const h = getFilteredHistory();
      renderHealthPulse(h);
      renderHistoryChart(h);
    }
  });

  /* ── CSV exports ────────────────────────────────────────────────────────────── */
  let _failData  = [];
  let _topFlaky  = [];
  let _browserGroups = [];

  const _origRenderTopFailures = renderTopFailures;
  function renderTopFailuresAndStore(finalTests) {
    _origRenderTopFailures(finalTests);
    // Re-derive failData for CSV (mirrors renderTopFailures logic)
    const seen = new Set();
    _failData = [];
    (SarvaStore.testHistory || []).forEach(entry => {
      const failCount = (entry.history || []).filter(h => (h.status === 'failed' || h.status === 'broken') && !h.wasFlaky).length;
      if (!failCount) return;
      const name = entry.testName || entry.testId;
      if (seen.has(name)) return;
      seen.add(name);
      _failData.push({ name, failCount, totalRuns: (entry.history || []).length });
    });
    (SarvaStore.stats.finalTests || []).filter(t => (t.status === 'failed' || t.status === 'broken') && !seen.has(t.fullName))
      .forEach(t => _failData.push({ name: t.name, failCount: 1, totalRuns: 1 }));
    _failData.sort((a, b) => b.failCount - a.failCount);
  }

  const _origRenderTopFlaky = renderTopFlaky;
  function renderTopFlakyAndStore() {
    _origRenderTopFlaky();
    _topFlaky = (SarvaStore.testHistory || [])
      .filter(t => t.flakyScore > 0 || t.wasEverFlaky)
      .sort((a, b) => b.flakyScore - a.flakyScore)
      .map(t => ({
        name: t.testName || t.testId,
        flakyRuns: (t.history || []).filter(h => h.wasFlaky || h.status === 'flaky').length,
        totalRuns: (t.history || []).length,
        flakyRate: Math.round(t.flakyScore || 0),
      }));
  }

  function csvEsc(v) {
    const s = String(v == null ? '' : v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function triggerCsvDownload(rows, filename) {
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadFailuresCsv() {
    const lines = [['Test Name', 'Fail Count', 'Total Runs', 'Fail Rate %'].join(',')];
    _failData.forEach(d => {
      const rate = d.totalRuns > 0 ? +((d.failCount / d.totalRuns) * 100).toFixed(1) : 0;
      lines.push([d.name, d.failCount, d.totalRuns, rate].map(csvEsc).join(','));
    });
    triggerCsvDownload(lines, `top-failures-${new Date().toISOString().slice(0,10)}.csv`);
  }

  function downloadFlakyCsv() {
    const lines = [['Test Name', 'Flaky Runs', 'Total Runs', 'Flaky Rate %'].join(',')];
    _topFlaky.forEach(d => lines.push([d.name, d.flakyRuns, d.totalRuns, d.flakyRate].map(csvEsc).join(',')));
    triggerCsvDownload(lines, `top-flaky-${new Date().toISOString().slice(0,10)}.csv`);
  }

  function downloadBrowserCsv() {
    const lines = [['Tool', 'Browser', 'Passed', 'Failed', 'Flaky', 'Skipped', 'Total', 'Pass Rate %'].join(',')];
    _browserGroups.forEach(g => {
      const rate = g.total > 0 ? +((g.passed / g.total) * 100).toFixed(1) : 0;
      lines.push([g.tool, g.browser, g.passed, g.failed, g.flaky, g.skipped, g.total, rate].map(csvEsc).join(','));
    });
    triggerCsvDownload(lines, `browser-breakdown-${new Date().toISOString().slice(0,10)}.csv`);
  }

  /* ── Distribution download — composites chart + legend to match UI layout ── */
  function downloadDistribution() {
    const chartEl = document.getElementById('sv-donut-chart');
    if (!chartEl || !_cachedStats) return;
    const inst = window.echarts && echarts.getInstanceByDom(chartEl);
    if (!inst) return;

    const isLight = document.body.classList.contains('light-mode');
    const chartBg  = isLight ? '#ffffff' : '#161b27';
    const cardBg   = isLight ? '#f8fafc' : '#1a2030';
    const mutedClr = isLight ? '#4b5268' : '#8b92a8';
    const textClr  = isLight ? '#1a1d2e' : '#e6eaf4';
    const scale    = 2;

    const legendItems = [
      { name: 'Passed',  value: _cachedStats.passed,  color: '#22c55e' },
      { name: 'Failed',  value: _cachedStats.failed,  color: '#f43f5e' },
      { name: 'Flaky',   value: _cachedStats.flaky,   color: '#f59e0b' },
      { name: 'Skipped', value: _cachedStats.skipped, color: '#64748b' },
    ].filter(d => d.value > 0);

    function compose(chartDataUrl) {
      const img = new Image();
      img.onload = function() {
        const pad      = 20 * scale;
        const hdrH     = 38 * scale;
        const legItemH = 22 * scale;
        const legH     = legendItems.length * legItemH;
        const legW     = 120 * scale;
        const sqSz     = 10 * scale;

        const cv  = document.createElement('canvas');
        cv.width  = img.width + legW + pad * 3;
        cv.height = img.height + hdrH + pad;
        const ctx = cv.getContext('2d');

        ctx.fillStyle = cardBg;
        ctx.fillRect(0, 0, cv.width, cv.height);

        let titleX = pad;
        const sidebarLogo = document.getElementById('sv-logo-img');
        if (sidebarLogo && sidebarLogo.complete && sidebarLogo.naturalWidth > 0) {
          const logoH = hdrH * 0.6;
          const logoW = logoH * (424.5 / 330.75);
          ctx.drawImage(sidebarLogo, pad, (hdrH - logoH) / 2, logoW, logoH);
          titleX = pad + logoW + 7 * scale;
        }
        ctx.fillStyle = mutedClr;
        ctx.font = `bold ${10 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.fillText('DISTRIBUTION', titleX, hdrH * 0.72);

        ctx.drawImage(img, pad, hdrH);

        const legX = img.width + pad * 2;
        const legY = hdrH + (img.height - legH) / 2;
        legendItems.forEach((item, i) => {
          const y = legY + i * legItemH;
          ctx.fillStyle = item.color;
          ctx.fillRect(legX, y + (legItemH - sqSz) / 2, sqSz, sqSz);
          ctx.fillStyle = mutedClr;
          ctx.font = `${9 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.fillText(item.name, legX + sqSz + 6 * scale, y + legItemH * 0.72);
          ctx.fillStyle = textClr;
          ctx.font = `bold ${9 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.fillText(String(item.value), legX + 80 * scale, y + legItemH * 0.72);
        });

        const a = document.createElement('a');
        a.href = cv.toDataURL('image/png');
        a.download = 'distribution.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      };
      img.src = chartDataUrl;
    }

    const url = inst.getDataURL({ type: 'png', pixelRatio: scale, backgroundColor: chartBg });
    if (url && url.startsWith('data:image/png')) { compose(url); return; }

    const svgEl = chartEl.querySelector('svg');
    if (!svgEl) return;
    const w = chartEl.offsetWidth || 160, h = chartEl.offsetHeight || 160;
    const blob   = new Blob([new XMLSerializer().serializeToString(svgEl)], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(blob);
    const sImg   = new Image();
    sImg.onload = function() {
      const cv  = document.createElement('canvas');
      cv.width  = w * scale; cv.height = h * scale;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = chartBg; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(sImg, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(svgUrl);
      compose(cv.toDataURL('image/png'));
    };
    sImg.onerror = () => URL.revokeObjectURL(svgUrl);
    sImg.src = svgUrl;
  }

  return { setRunFilter, goToTests, downloadFailuresCsv, downloadFlakyCsv, downloadBrowserCsv, downloadDistribution };

})();

window.SarvaOverview = SarvaOverview;
