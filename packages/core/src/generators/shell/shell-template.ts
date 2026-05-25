export function renderShellOpen(params: {
  title: string;
  toolName: string;
  version: string;
  styles: string;
  logoDataUrl?: string;
  syneFontB64?: string;
  linkPatterns?: { issue?: string; tms?: string };
}): string {
  const { title, toolName, version, styles, logoDataUrl = '', syneFontB64 = '', linkPatterns = {} } = params;
  const displayTitle = toolName ? `Sarva-Varadi → ${toolName}` : 'Sarva-Varadi';

  const fontBlock = syneFontB64
    ? `<style>@font-face{font-family:'Syne';font-style:normal;font-weight:700 800;font-display:swap;src:url('data:font/woff2;base64,${syneFontB64}') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}</style>`
    : `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap" rel="stylesheet">`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || displayTitle}</title>
  ${fontBlock}
  <style>${styles}</style>
  <script>window.SARVA_VERSION='${version}';window.SARVA_LOGO_DATA='${logoDataUrl}';window.SARVA_LINK_PATTERNS=${JSON.stringify(linkPatterns)};</script>
</head>
<body>
<div class="sv-app">

  <!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
  <aside class="sv-sidebar">
    <div class="sv-sidebar-brand">
      <img src="${logoDataUrl || './logo.svg'}" alt="Sarva-Varadi" id="sv-logo-img">
      <div>
        <div class="sv-sidebar-brand-name">Sarva-Varadi</div>
        <div class="sv-sidebar-brand-version">v${version}</div>
      </div>
    </div>

    <nav class="sv-sidebar-nav">
      <div class="sv-nav-section">Report</div>

      <button class="sv-nav-item active" data-view="overview"
              data-sv-tip="<b>Overview</b><br>• Summary dashboard<br>• Pass rate, stat cards, health pulse<br>• Run history and browser breakdown<br>• Coverage changes: new &amp; absent tests">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        <span data-title="Overview">Overview</span>
      </button>

      <button class="sv-nav-item" data-view="failures"
              data-sv-tip="<b>Failures</b><br>• Newly failing &amp; recently fixed tests<br>• Top failures &amp; flaky offenders ranked<br>• Failures grouped by severity label<br>• Always shows the <b>current/latest run</b> — not updated when viewing history">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span data-title="Failures">Failures</span>
        <span class="sv-nav-badge sv-nav-badge-fail" id="sv-nav-badge-failures" style="display:none;"></span>
      </button>

      <button class="sv-nav-item" data-view="tests"
              data-sv-tip="<b>Tests</b><br>• Full list of all test results for this run<br>• Filter by status, search by name<br>• Click any row to open test detail &amp; error<br>• Always shows the <b>current/latest run</b> — not updated when viewing history">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
        <span data-title="Tests">Tests</span>
        <span class="sv-nav-badge" id="sv-nav-badge-tests">0</span>
      </button>

      <button class="sv-nav-item" data-view="trends"
              data-sv-tip="<b>Trends</b><br>• Cross-run analytics<br>• Pass rate, failure &amp; flakiness trends over time<br>• Top failing and flaky tests across runs">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span data-title="Trends">Trends</span>
      </button>

      <button class="sv-nav-item" data-view="timeline"
              data-sv-tip="<b>Timeline</b><br>• Run cadence bar chart across historical runs<br>• Execution Gantt for the current run<br>• Spot parallel test execution and slow runs">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <circle cx="7" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="17" cy="12" r="2"/>
        </svg>
        <span data-title="Timeline">Timeline</span>
      </button>

      <div class="sv-nav-section" style="margin-top:0.75rem;">History</div>

      <button class="sv-nav-item" data-view="runs"
              data-sv-tip="<b>Runs</b><br>• Browse all historical runs<br>• Filter by status, date or pass rate<br>• Click any run to view its full report">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span data-title="Runs">Runs</span>
        <span class="sv-nav-badge" id="sv-nav-badge-runs" style="display:none;"></span>
      </button>
    </nav>

    <div class="sv-sidebar-footer">
      <button class="sv-theme-toggle" data-sv-theme-toggle>
        <span data-label>☀️ Light</span>
      </button>
      <button class="sv-print-btn" onclick="SarvaPrint()" data-sv-tip="Print report / Save as PDF">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        Print / PDF
      </button>
      <span style="font-size:0.68rem; color:var(--text-muted);">${toolName || 'Multi'}</span>
    </div>
  </aside>

  <!-- ── Main ─────────────────────────────────────────────────────────────── -->
  <main class="sv-main">

    <!-- Topbar -->
    <div class="sv-topbar">
      <div class="sv-topbar-left">
        <span class="sv-topbar-title" id="sv-topbar-view-title">Overview</span>
        <span id="sv-env-badge" style="display:none;align-items:center;gap:0.3rem;
              font-size:0.68rem;white-space:nowrap;">
          <span style="font-weight:600;text-transform:uppercase;letter-spacing:0.07em;
                       color:var(--text-muted);background:var(--bg-surface-3);
                       padding:0.15rem 0.4rem;border-radius:4px;">ENV</span>
          <span id="sv-env-badge-value" style="font-weight:700;text-transform:uppercase;
                letter-spacing:0.08em;padding:0.2rem 0.6rem;border-radius:4px;
                background:rgba(99,102,241,0.15);color:var(--accent);
                border:1px solid rgba(99,102,241,0.3);"></span>
        </span>
      </div>
      <div class="sv-topbar-right">
        <span style="font-size:0.75rem; color:var(--text-secondary); display:flex; align-items:center; gap:0.4rem;">
          <span style="font-size:0.62rem;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;
                       color:var(--text-muted);background:var(--bg-surface-3);
                       padding:0.15rem 0.45rem;border-radius:4px;white-space:nowrap;">Last run on</span>
          <span id="sv-run-timestamp"></span>
        </span>
        <span style="font-size:0.78rem; color:var(--text-secondary); display:flex; align-items:center; gap:0.3rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="flex-shrink:0;opacity:0.8;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span id="sv-run-duration"></span>
        </span>
        <span class="sv-run-badge" id="sv-run-status-badge">—</span>
      </div>
    </div>

    <!-- Viewing banner — shown when browsing a historical run -->
    <div id="sv-viewing-banner" class="sv-viewing-banner" style="display:none;">
      <span class="sv-viewing-banner-icon">⏪</span>
      <span id="sv-viewing-banner-text" class="sv-viewing-banner-text"></span>
      <button class="sv-viewing-banner-back" onclick="SarvaRunSwitch.restoreLatest()">← Back to latest</button>
    </div>

    <!-- Content area — micro-apps inject into their .sv-view containers -->
    <div class="sv-content">

    <!-- Table of Contents — hidden in UI, printed as page 1 of the PDF -->
    <div class="sv-print-toc" id="sv-print-toc">
      <div class="sv-print-toc-inner">
        <div class="sv-print-toc-brand">
          <img src="${logoDataUrl || './logo.svg'}" alt="Sarva-Varadi" class="sv-print-toc-logo">
          <span class="sv-print-toc-brand-name">Sarva-Varadi <span>v${version}</span></span>
        </div>
        <h1 class="sv-print-toc-title">Test Report</h1>
        <p class="sv-print-toc-tool">${toolName || 'Multi-framework'}</p>
        <p class="sv-print-toc-meta" id="sv-toc-meta"></p>
        <p class="sv-print-toc-history-note" id="sv-print-toc-history-note" style="display:none;"></p>
        <nav class="sv-print-toc-nav">
          <a href="#sv-section-overview" class="sv-print-toc-item">
            <span class="sv-print-toc-num">1</span>
            <span class="sv-print-toc-text">
              <span class="sv-print-toc-label">Overview</span>
              <span class="sv-print-toc-desc">Pass rate, distribution, health pulse, run history</span>
            </span>
            <span class="sv-print-toc-arrow">→</span>
          </a>
          <a href="#sv-section-failures" class="sv-print-toc-item">
            <span class="sv-print-toc-num">2</span>
            <span class="sv-print-toc-text">
              <span class="sv-print-toc-label">Failures</span>
              <span class="sv-print-toc-desc">Newly failing, recently fixed, top failures &amp; flaky, severity breakdown</span>
            </span>
            <span class="sv-print-toc-arrow">→</span>
          </a>
          <a href="#sv-section-tests" class="sv-print-toc-item">
            <span class="sv-print-toc-num">3</span>
            <span class="sv-print-toc-text">
              <span class="sv-print-toc-label">Tests</span>
              <span class="sv-print-toc-desc">Complete test results list for this run</span>
            </span>
            <span class="sv-print-toc-arrow">→</span>
          </a>
          <a href="#sv-section-trends" class="sv-print-toc-item">
            <span class="sv-print-toc-num">4</span>
            <span class="sv-print-toc-text">
              <span class="sv-print-toc-label">Trends</span>
              <span class="sv-print-toc-desc">Cross-run analytics, pass rate trend, top failing &amp; flaky tests</span>
            </span>
            <span class="sv-print-toc-arrow">→</span>
          </a>
          <a href="#sv-section-timeline" class="sv-print-toc-item">
            <span class="sv-print-toc-num">5</span>
            <span class="sv-print-toc-text">
              <span class="sv-print-toc-label">Timeline</span>
              <span class="sv-print-toc-desc">Run cadence &amp; parallel execution Gantt</span>
            </span>
            <span class="sv-print-toc-arrow">→</span>
          </a>
          <a href="#sv-section-runs" class="sv-print-toc-item">
            <span class="sv-print-toc-num">6</span>
            <span class="sv-print-toc-text">
              <span class="sv-print-toc-label">Run History</span>
              <span class="sv-print-toc-desc">Full run log with pass rate, duration &amp; status for every run</span>
            </span>
            <span class="sv-print-toc-arrow">→</span>
          </a>
        </nav>
        <p class="sv-print-toc-footer">Click any section to jump directly to that page in your PDF viewer</p>
      </div>
    </div>`;
}

export function renderShellClose(scripts: string): string {
  return `
    </div><!-- .sv-content -->
  </main><!-- .sv-main -->
</div><!-- .sv-app -->

<!-- Fixed ↑ Contents link — appears bottom-right on every printed page -->
<a href="#sv-print-toc" class="sv-print-back-global">↑ Contents</a>

<!-- Drawer overlay for test detail panel -->
<div class="sv-drawer-overlay" id="sv-drawer-overlay"></div>
<aside class="sv-drawer" id="sv-drawer">
  <div class="sv-drawer-header">
    <div style="flex:1;min-width:0;">
      <div class="sv-drawer-title" id="sv-drawer-title">Test Detail</div>
      <div class="sv-drawer-sub"  id="sv-drawer-sub"></div>
    </div>
    <div id="sv-drawer-nav" style="display:none;align-items:center;gap:0.35rem;flex-shrink:0;margin-right:0.25rem;"></div>
    <button class="sv-drawer-close" id="sv-drawer-close">✕</button>
  </div>
  <div class="sv-drawer-body" id="sv-drawer-body"></div>
</aside>

<!-- Global floating info-tooltip -->
<div id="sv-tip" class="sv-tip-popup"></div>
<script>
(function(){
  var tip=document.getElementById('sv-tip'),cur=null;
  function parseTip(raw){
    var segs=raw.split('<br>');
    var out='';
    segs.forEach(function(seg,i){
      var s=seg.trim();
      if(s.charAt(0)==='•'){
        var content=s.slice(1).trim();
        out+='<div style="display:flex;align-items:flex-start;gap:5px;margin-top:4px;">'
            +'<span style="color:#818cf8;flex-shrink:0;line-height:1.5;font-size:0.85em;">›</span>'
            +'<span style="flex:1;min-width:0;">'+content+'</span>'
            +'</div>';
      }else{
        if(i>0)out+='<br>';
        out+=seg;
      }
    });
    return out;
  }
  document.addEventListener('mouseover',function(e){
    var b=e.target.closest('[data-sv-tip]');
    if(!b)return;
    cur=b;
    tip.innerHTML=parseTip(b.getAttribute('data-sv-tip'));
    tip.classList.add('sv-tip-visible');
    mv(e);
  });
  document.addEventListener('mousemove',function(e){if(cur)mv(e);});
  document.addEventListener('mouseout',function(e){
    if(cur&&!e.relatedTarget?.closest('[data-sv-tip]')){cur=null;tip.classList.remove('sv-tip-visible');}
  });
  function mv(e){
    var pad=14,w=tip.offsetWidth,h=tip.offsetHeight;
    var x=e.clientX+pad,y=e.clientY-h-pad;
    if(x+w>window.innerWidth-8)x=e.clientX-w-pad;
    if(y<8)y=e.clientY+pad;
    tip.style.left=x+'px';tip.style.top=y+'px';
  }
})();
</script>

<script>
window.SarvaDownloadChart = function(chartId, filename, title) {
  var el = document.getElementById(chartId);
  if (!el) return;
  var inst = window.echarts && echarts.getInstanceByDom(el);
  if (!inst) return;
  var isLight = document.body.classList.contains('light-mode');
  var chartBg = isLight ? '#ffffff' : '#161b27';
  var scale = 2;

  // Composites a title header band (with logo) above the chart image
  function addHeader(dataUrl, cb) {
    if (!title) { cb(dataUrl); return; }
    var img = new Image();
    img.onload = function() {
      function compose(logo) {
        var cardBg   = isLight ? '#f8fafc' : '#1a2030';
        var hdrColor = isLight ? '#4b5268' : '#8b92a8';
        var pad  = 20 * scale;
        var hdrH = 44 * scale;
        var cv   = document.createElement('canvas');
        cv.width  = img.width  + pad * 2;
        cv.height = img.height + hdrH + pad;
        var ctx = cv.getContext('2d');
        ctx.fillStyle = cardBg;
        ctx.fillRect(0, 0, cv.width, cv.height);
        var textX = pad;
        if (logo) {
          var logoH = hdrH * 0.6;
          var logoW = logoH * (424.5 / 330.75);
          ctx.drawImage(logo, pad, (hdrH - logoH) / 2, logoW, logoH);
          textX = pad + logoW + 7 * scale;
        }
        ctx.fillStyle = hdrColor;
        ctx.font = 'bold ' + (10 * scale) + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(title.toUpperCase(), textX, hdrH * 0.65);
        ctx.drawImage(img, pad, hdrH);
        cb(cv.toDataURL('image/png'));
      }
      // Draw the sidebar logo img (src is inline data URL, no file:// taint)
      var sidebarLogo = document.getElementById('sv-logo-img');
      if (sidebarLogo && sidebarLogo.complete && sidebarLogo.naturalWidth > 0) {
        compose(sidebarLogo);
      } else if (sidebarLogo) {
        sidebarLogo.addEventListener('load', function() { compose(sidebarLogo); }, { once: true });
      } else {
        compose(null);
      }
    };
    img.src = dataUrl;
  }

  function download(href) {
    var a = document.createElement('a');
    a.href = href; a.download = filename || (chartId + '.png');
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  var url = inst.getDataURL({ type: 'png', pixelRatio: scale, backgroundColor: chartBg });
  if (url && url.startsWith('data:image/png')) { addHeader(url, download); return; }

  // SVG renderer fallback: draw SVG onto canvas to produce PNG
  var svgEl = el.querySelector('svg');
  if (!svgEl) return;
  var w = el.offsetWidth || 600, h = el.offsetHeight || 300;
  var blob = new Blob([new XMLSerializer().serializeToString(svgEl)], { type: 'image/svg+xml;charset=utf-8' });
  var svgUrl = URL.createObjectURL(blob);
  var sImg = new Image();
  sImg.onload = function() {
    var cv = document.createElement('canvas');
    cv.width = w * scale; cv.height = h * scale;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = chartBg; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.drawImage(sImg, 0, 0, cv.width, cv.height);
    URL.revokeObjectURL(svgUrl);
    addHeader(cv.toDataURL('image/png'), download);
  };
  sImg.onerror = function() { URL.revokeObjectURL(svgUrl); };
  sImg.src = svgUrl;
};
</script>

<script>${scripts}</script>
<script>
window.SarvaPrint = function() {
  var tocMeta = document.getElementById('sv-toc-meta');
  var runTs   = document.getElementById('sv-run-timestamp');
  if (tocMeta && runTs && runTs.textContent.trim()) {
    tocMeta.textContent = 'Run: ' + runTs.textContent.trim();
  }

  var histNote     = document.getElementById('sv-print-toc-history-note');
  var bannerText   = document.getElementById('sv-viewing-banner-text');
  if (histNote) {
    var bText = bannerText ? bannerText.textContent.trim() : '';
    if (bText) {
      histNote.textContent  = '⏪ ' + bText;
      histNote.style.display = 'block';
    } else {
      histNote.style.display = 'none';
    }
  }

  var wasLight = document.body.classList.contains('light-mode');
  if (!wasLight) document.body.classList.add('light-mode');

  // Snapshot each chart's current screen width so the restore is exact —
  // inst.resize() with no args reads the container, which may not be stable
  // in the afterprint frame; an explicit saved width is always reliable.
  var savedChartWidths = {};
  if (typeof echarts !== 'undefined') {
    document.querySelectorAll('[id$="-chart"]').forEach(function(el) {
      var inst = echarts.getInstanceByDom(el);
      if (inst) { try { savedChartWidths[el.id] = inst.getWidth(); } catch(e) {} }
    });
  }

  // Add overlay FIRST — it must paint before any layout manipulation so the
  // sidebar's backdrop-filter compositing layer never flashes through.
  var overlay = document.createElement('div');
  overlay.className = 'sv-print-overlay';
  document.body.appendChild(overlay);

  var sidebar = document.querySelector('.sv-sidebar');
  var mainEl  = document.querySelector('.sv-main');
  var views   = Array.from(document.querySelectorAll('.sv-view'));
  var savedDisplays = views.map(function(v) { return v.style.display; });

  function restoreLayout() {
    if (!wasLight) document.body.classList.remove('light-mode');
    if (sidebar) sidebar.style.display = '';
    if (mainEl)  mainEl.style.marginLeft = '';
    views.forEach(function(v, i) { v.style.display = savedDisplays[i]; });
    var _hn = document.getElementById('sv-print-toc-history-note');
    if (_hn) { _hn.style.display = 'none'; _hn.textContent = ''; }
    // Clear inline overrides applied during print prep.
    document.querySelectorAll('[id$="-chart"]').forEach(function(el) {
      el.style.width = ''; el.style.maxWidth = '';
      var cb = el.closest && el.closest('.sv-card-body');
      if (cb) { cb.style.paddingLeft = ''; cb.style.paddingRight = ''; }
    });
    if (typeof echarts !== 'undefined') {
      setTimeout(function() {
        document.querySelectorAll('[id$="-chart"]').forEach(function(el) {
          var inst = echarts.getInstanceByDom(el);
          if (inst) {
            try {
              var w = savedChartWidths[el.id];
              if (w > 0) { inst.resize({ width: w }); } else { inst.resize(); }
            } catch(e) {}
          }
        });
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 150);
    } else {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
  }

  window.addEventListener('afterprint', restoreLayout, { once: true });

  // Wait one frame so the overlay paints before we touch the layout.
  // Then hide sidebar + show all views (covered by overlay), resize charts, print.
  requestAnimationFrame(function() {
    if (sidebar) sidebar.style.display = 'none';
    if (mainEl)  mainEl.style.marginLeft = '0';
    views.forEach(function(v) { v.style.display = 'block'; });

    // Resize charts to fill the print card interior edge-to-edge.
    // @page: A4 landscape, margin 1.4cm 1.2cm → usable width 1031px.
    // Card border: 1px each side → card interior = 1029px.
    // .sv-grid-2 (gap 1rem=16px): (1031−16)/2 − 2px border = 505px per column.
    //
    // CSS max-width:100% constrains the chart div to the card-body *content* area
    // (~989px when padding is in effect), causing the ECharts canvas to overflow
    // visibly or leaving blank space.  Fix: zero card-body padding and override
    // max-width via inline styles (inline style beats !important from stylesheets).
    var FULL = 1029;
    var HALF = 505;
    document.querySelectorAll('[id$="-chart"]').forEach(function(el) {
      if (el.id === 'sv-donut-chart') return;
      var w = (el.closest && el.closest('.sv-grid-2')) ? HALF : FULL;
      el.style.width    = w + 'px';   // override max-width:100% CSS
      el.style.maxWidth = 'none';
      var cb = el.closest && el.closest('.sv-card-body');
      if (cb) { cb.style.paddingLeft = '0'; cb.style.paddingRight = '0'; }
      if (typeof echarts !== 'undefined') {
        var inst = echarts.getInstanceByDom(el);
        if (inst) { try { inst.resize({ width: w }); } catch(e) {} }
      }
    });

    setTimeout(function() { window.print(); }, 300);
  });
};
</script>
</body>
</html>`;
}
