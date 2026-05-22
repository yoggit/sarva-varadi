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
    const failed = document.getElementById('sv-nav-badge-failed');
    if (failed && stats.failed > 0) { failed.textContent = stats.failed; failed.style.display = ''; }
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
