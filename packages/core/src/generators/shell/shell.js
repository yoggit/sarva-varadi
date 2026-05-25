/**
 * Shell module — handles navigation, theme, topbar run info.
 * Listens to store:ready to populate topbar stats.
 */
const SarvaShell = (() => {

  /* ── Theme ─────────────────────────────────────────────────────────────────── */
  function initTheme() {
    const saved = localStorage.getItem('sv-theme');
    if (saved === 'light') document.body.classList.add('light-mode');

    document.querySelectorAll('[data-sv-theme-toggle]').forEach(el => {
      el.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-mode');
        localStorage.setItem('sv-theme', isLight ? 'light' : 'dark');
        el.querySelector('[data-label]').textContent = isLight ? '🌙 Dark' : '☀️ Light';
        SarvaEventBus.emit('theme:changed', { mode: isLight ? 'light' : 'dark' });
      });
      const isLight = document.body.classList.contains('light-mode');
      const label = el.querySelector('[data-label]');
      if (label) label.textContent = isLight ? '🌙 Dark' : '☀️ Light';
    });
  }

  /* ── Navigation ────────────────────────────────────────────────────────────── */
  function initNav() {
    const navItems = document.querySelectorAll('.sv-nav-item[data-view]');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        SarvaEventBus.emit('nav:change', { view });
        document.querySelectorAll('.sv-view').forEach(v => {
          v.style.display = v.dataset.view === view ? 'block' : 'none';
        });
        // Update topbar title
        const titleEl = document.getElementById('sv-topbar-view-title');
        if (titleEl) titleEl.textContent = item.querySelector('[data-title]')?.textContent || '';
      });
    });
  }

  /* ── Topbar ────────────────────────────────────────────────────────────────── */
  function initTopbar(stats, metadata) {
    const envBadge = document.getElementById('sv-env-badge');
    const envValue = document.getElementById('sv-env-badge-value');
    if (envBadge && envValue && metadata.environment && metadata.environment.name) {
      envValue.textContent = metadata.environment.name;
      envBadge.style.display = 'inline-flex';
    }

    const ts = document.getElementById('sv-run-timestamp');
    if (ts) {
      const d = new Date(metadata.timestamp);
      ts.textContent = d.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }

    const dur = document.getElementById('sv-run-duration');
    if (dur) dur.textContent = formatDuration(metadata.duration || 0);

    const badge = document.getElementById('sv-run-status-badge');
    if (badge) {
      const cls = stats.failed > 0 ? 'failed' : stats.flaky > 0 ? 'flaky' : 'passed';
      const label = stats.failed > 0 ? 'Failed' : stats.flaky > 0 ? 'Flaky' : 'Passed';
      badge.className = `sv-run-badge ${cls}`;
      badge.innerHTML = `<span>${cls === 'passed' ? '✓' : cls === 'failed' ? '✗' : '~'}</span> ${label}`;
    }
  }

  /* ── Sidebar nav badges (counts) ───────────────────────────────────────────── */
  function updateNavBadges(stats) {
    const badge = document.getElementById('sv-nav-badge-tests');
    if (badge) badge.textContent = stats.total;
    const failBadge = document.getElementById('sv-nav-badge-failures');
    if (failBadge) {
      const n = (stats.failed || 0) + (stats.flaky || 0);
      if (n > 0) { failBadge.textContent = n; failBadge.style.display = ''; }
      else failBadge.style.display = 'none';
    }
    const runsBadge = document.getElementById('sv-nav-badge-runs');
    if (runsBadge) {
      const n = (SarvaStore.history || []).length;
      if (n > 0) { runsBadge.textContent = n; runsBadge.style.display = ''; }
      else runsBadge.style.display = 'none';
    }
  }

  /* ── Timestamp ─────────────────────────────────────────────────────────────── */
  function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
  }

  /* ── Programmatic navigation (used by Overview stat cards, etc.) ──────────── */
  function navigate(view) {
    const navItems = document.querySelectorAll('.sv-nav-item[data-view]');
    navItems.forEach(n => n.classList.remove('active'));
    const target = document.querySelector(`.sv-nav-item[data-view="${view}"]`);
    if (target) target.classList.add('active');
    SarvaEventBus.emit('nav:change', { view });
    document.querySelectorAll('.sv-view').forEach(v => {
      v.style.display = v.dataset.view === view ? 'block' : 'none';
    });
    const titleEl = document.getElementById('sv-topbar-view-title');
    if (titleEl && target) titleEl.textContent = target.querySelector('[data-title]')?.textContent || '';
  }

  /* ── Init ───────────────────────────────────────────────────────────────────── */
  function init() {
    initTheme();
    initNav();

    SarvaEventBus.on('store:ready', ({ stats, metadata }) => {
      initTopbar(stats, metadata);
      updateNavBadges(stats);
    });
  }

  return { init, navigate };
})();

document.addEventListener('DOMContentLoaded', () => SarvaShell.init());

/* ── Run Switcher — loads historical run data and swaps store state ────────── */
const SarvaRunSwitch = (() => {
  let _activeRunId    = null;
  let _currentSummary = null;
  let _currentView    = 'overview';

  function fmtDate(ts) {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function fmtDur(ms) {
    if (!ms || ms <= 0) return '';
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  function switchToRun(runId, runSummary) {
    _activeRunId    = runId;
    _currentSummary = runSummary;
    if (window.SarvaRunData && window.SarvaRunData[runId]) {
      _apply(runId, runSummary);
      return;
    }
    const script = document.createElement('script');
    script.src = `history/${runId}/data.js`;
    script.onload = () => _apply(runId, runSummary);
    script.onerror = () => {
      console.warn(`[SarvaRunSwitch] Could not load history/${runId}/data.js`);
      _activeRunId = null;
      _currentSummary = null;
    };
    document.head.appendChild(script);
  }

  function _apply(runId, runSummary) {
    const tests = window.SarvaRunData && window.SarvaRunData[runId];
    if (!tests) return;
    SarvaStore.switchToRun(tests, runSummary);
    SarvaShell.navigate('overview'); // nav:change will call _updateBanner
  }

  function restoreLatest() {
    _activeRunId    = null;
    _currentSummary = null;
    SarvaStore.restoreLatest();
    _hideBanner();
  }

  function _updateBanner() {
    if (!_activeRunId || !_currentSummary) { _hideBanner(); return; }
    const banner = document.getElementById('sv-viewing-banner');
    const text   = document.getElementById('sv-viewing-banner-text');
    if (!banner || !text) return;

    const runs   = SarvaStore.history || [];
    const idx    = runs.findIndex(r => r.id === _currentSummary.id);
    const runNum = idx >= 0 ? runs.length - idx : '?';

    if (_currentView === 'overview' || _currentView === 'timeline') {
      const pct = _currentSummary.passRate != null ? `${_currentSummary.passRate}% pass rate` : '';
      const dur = fmtDur(_currentSummary.duration);
      text.textContent = [
        `Viewing Run #${runNum}`,
        fmtDate(_currentSummary.timestamp),
        pct, dur,
      ].filter(Boolean).join(' · ');
      banner.style.display = 'flex';
    } else if (_currentView === 'trends') {
      text.textContent = `Trend marker showing Run #${runNum}`;
      banner.style.display = 'flex';
    } else {
      _hideBanner();
    }
  }

  function _hideBanner() {
    const banner = document.getElementById('sv-viewing-banner');
    if (banner) banner.style.display = 'none';
  }

  SarvaEventBus.on('nav:change', ({ view }) => {
    _currentView = view;
    _updateBanner();
  });

  return {
    switchToRun,
    restoreLatest,
    get activeRunId() { return _activeRunId; },
  };
})();
