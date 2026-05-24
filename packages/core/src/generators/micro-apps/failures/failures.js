/**
 * Failures micro-app.
 * Newly Failing / Recently Fixed, Coverage Changes, Failures by Severity,
 * Top Failures, Top Flaky Offenders.
 */
const SarvaFailures = (() => {

  let _failData     = [];
  let _topFlaky     = [];
  let _cachedStats  = null;

  /* ── Shared utils ───────────────────────────────────────────────────────────── */
  // Strip Playwright inline tags (@tag / @tag:val) from test names for fuzzy matching
  function stripTags(n) { return (n || '').replace(/\s*@\S+/g, '').trim(); }

  // Find a test by name, tolerating added/removed inline tags across runs
  function findTest(pool, name, fullName) {
    if (!pool || !pool.length) return null;
    const exact = pool.find(t => t.fullName === fullName || t.name === name);
    if (exact) return exact;
    const baseN = stripTags(name), baseFN = fullName ? stripTags(fullName) : null;
    return pool.find(t =>
      stripTags(t.name) === baseN ||
      (baseFN && stripTags(t.fullName || '') === baseFN)
    ) || null;
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function fmtDuration(ms) {
    if (!ms) return '—';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }
  function fmtTs(ts) {
    return ts ? new Date(ts).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }) : '';
  }

  const INFO_ICON_SM = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;

  /* ── Empty / no-issues state ────────────────────────────────────────────────── */
  function renderFailuresSummary(stats) {
    const el = document.getElementById('sv-failures-summary');
    if (!el) return;
    const hasIssues = (stats.failed || 0) > 0 || (stats.flaky || 0) > 0;
    if (!hasIssues) {
      el.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.5rem;padding:0.6rem 1rem;
                  background:rgba(34,197,94,0.07);border-radius:var(--radius);
                  border:1px solid rgba(34,197,94,0.2);">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--status-passed)" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
        </svg>
        <span style="font-size:0.77rem;color:var(--status-passed);font-weight:600;">No failures or flaky tests this run</span>
        ${stats.skipped > 0 ? `<span style="font-size:0.72rem;color:var(--text-muted);">· ${stats.skipped} skipped</span>` : ''}
      </div>`;
    } else {
      el.innerHTML = '';
    }
  }

  /* ── Top Failures ───────────────────────────────────────────────────────────── */
  function renderTopFailures(finalTests) {
    const list  = document.getElementById('sv-top-failures-list');
    const count = document.getElementById('sv-top-failures-count');
    if (!list) return;

    const seen = new Set();
    const failData = [];

    (SarvaStore.testHistory || []).forEach(entry => {
      const failCount = (entry.history || []).filter(h => (h.status === 'failed' || h.status === 'broken') && !h.wasFlaky).length;
      if (failCount === 0) return;
      const name = entry.testName || entry.testId;
      if (seen.has(name)) return;
      seen.add(name);

      const histFullName = entry.testId && entry.testId.includes(':')
        ? entry.testId.split(':').slice(1).join(':') : null;
      const allTests = (SarvaStore.tests || []);
      const cur = findTest(finalTests, name, histFullName) || findTest(allTests, name, histFullName);
      const curStatus = cur ? (cur.status === 'broken' ? 'failed' : cur.status) : null;
      const firstSeg  = histFullName ? histFullName.split('>')[0].trim() : '';
      const browser   = (firstSeg && !firstSeg.includes('.') && !firstSeg.includes('/') ? firstSeg : null)
                     || cur?.extra?.selenium?.browser?.name
                     || cur?.extra?.playwright?.browser
                     || null;
      failData.push({
        uuid: cur ? cur.uuid : null,
        name: cur ? cur.name : name,
        fullName: name,
        duration: cur ? cur.duration : null,
        failCount,
        totalRuns:    (entry.history || []).length,
        currentFail:  curStatus === 'failed',
        currentStatus: curStatus,
        browser,
      });
    });

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
        ${f.currentStatus
          ? `<span class="sv-pill ${f.currentStatus}" style="flex-shrink:0;">${f.currentStatus === 'failed' ? '✗' : f.currentStatus === 'flaky' ? '~' : '✓'}</span>`
          : `<span data-sv-tip="Not in this run — failed in a previous run" style="flex-shrink:0;font-size:0.7rem;color:var(--text-muted);white-space:nowrap;">prev run</span>`}
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:0.4rem;min-width:0;">
            <span class="sv-truncate" style="font-size:0.82rem;${!f.currentStatus ? 'color:var(--text-secondary);' : ''}">${escHtml(f.name)}</span>
            ${f.browser ? `<span class="sv-browser-badge">${escHtml(f.browser)}</span>` : ''}
            ${lastFailAt ? `<span data-sv-tip="${escHtml('<b>Last Failed:</b>' + lastFailAt)}" style="color:var(--status-failed);opacity:0.7;cursor:default;flex-shrink:0;display:inline-flex;align-items:center;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>` : ''}
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

  /* ── Top Flaky Offenders ────────────────────────────────────────────────────── */
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
      const score     = Math.round(t.flakyScore || 0);
      const runs      = t.history ? t.history.length : 0;
      const flakyRuns = t.history ? t.history.filter(h => h.wasFlaky || h.status === 'flaky').length : 0;

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

      const lastFlakyH   = t.history && t.history.find(h => h.wasFlaky || h.status === 'flaky');
      const lastFlakyRun = lastFlakyH && (SarvaStore.history || []).find(r => r.id === lastFlakyH.runId);
      const lastFlakyAt  = lastFlakyRun && lastFlakyRun.timestamp
        ? new Date(lastFlakyRun.timestamp).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : null;

      const flakyHistId   = t.testId && t.testId.includes(':') ? t.testId.split(':').slice(1).join(':') : null;
      const flakyFirstSeg = flakyHistId ? flakyHistId.split('>')[0].trim() : '';
      const flakyCur      = findTest(SarvaStore.tests || [], t.testName, flakyHistId);
      const flakyBrowser  = (flakyFirstSeg && !flakyFirstSeg.includes('.') && !flakyFirstSeg.includes('/') ? flakyFirstSeg : null)
                         || flakyCur?.extra?.selenium?.browser?.name
                         || flakyCur?.extra?.playwright?.browser
                         || null;
      const flakyUuid     = flakyCur?.uuid;

      const latestH       = t.history && t.history.length > 0 ? t.history[0] : null;
      const latestIsFlaky = latestH && (latestH.wasFlaky || latestH.status === 'flaky');
      const latestStatus  = !latestH ? 'skipped'
        : latestIsFlaky                                                 ? 'flaky'
        : (latestH.status === 'failed' || latestH.status === 'broken') ? 'failed'
        : latestH.status === 'passed'                                   ? 'passed'
        : 'skipped';
      const latestSym = latestStatus === 'failed' ? '✗' : latestStatus === 'flaky' ? '~' : latestStatus === 'passed' ? '✓' : '○';

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
            ${flakyBrowser ? `<span class="sv-browser-badge">${escHtml(flakyBrowser)}</span>` : ''}
            ${lastFlakyAt ? `<span data-sv-tip="${escHtml('<b>Last Flaky:</b>' + lastFlakyAt)}" style="color:var(--status-flaky);opacity:0.7;cursor:default;flex-shrink:0;display:inline-flex;align-items:center;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>` : ''}
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

    const latestRunId = SarvaStore.history && SarvaStore.history.length > 0 ? SarvaStore.history[0].id : null;
    if (!latestRunId || !SarvaStore.history || SarvaStore.history.length < 2) {
      section.style.display = 'none';
      return;
    }

    const prevRunId = SarvaStore.history[1].id;

    const newlyFailing = [];
    const recentlyFixed = [];

    (SarvaStore.testHistory || []).forEach(entry => {
      if (!entry.history || entry.history.length < 2) return;
      const latest = entry.history[0];
      const prev   = entry.history[1];
      if (latest.runId !== latestRunId) return;

      const latestFailed = latest.status === 'failed' || latest.status === 'broken';
      const prevFailed   = prev.status   === 'failed' || prev.status   === 'broken';
      const latestPassed = latest.status === 'passed';
      const prevPassed   = prev.status   === 'passed' && !prev.wasFlaky;

      const histFullName  = entry.testId && entry.testId.includes(':') ? entry.testId.split(':').slice(1).join(':') : null;
      const curTest       = (histFullName && (SarvaStore.tests || []).find(t => t.fullName === histFullName)) ||
                             (SarvaStore.tests || []).find(t => t.fullName === entry.testName || t.name === entry.testName);
      const uuid      = curTest?.uuid || null;
      const name      = curTest?.name || entry.testName || entry.testId;
      const firstSeg  = histFullName ? histFullName.split(' > ')[0].trim() : '';
      const browser   = (firstSeg && !firstSeg.includes('.') && !firstSeg.includes('/') ? firstSeg : null)
                     || curTest?.extra?.selenium?.browser?.name
                     || curTest?.extra?.playwright?.browser
                     || null;

      if (latestFailed && (prevPassed || prev.status === 'skipped')) {
        const lastPassH   = entry.history.find(h => h.status === 'passed' && !h.wasFlaky);
        const lastPassRun = lastPassH && (SarvaStore.history || []).find(r => r.id === lastPassH.runId);
        newlyFailing.push({ uuid, name, browser, lastPassAt: lastPassRun?.timestamp || null });
      }
      if (latestPassed && prevFailed) {
        const consecutiveFails = (() => {
          let streak = 0;
          for (let i = 1; i < entry.history.length; i++) {
            const s = entry.history[i].status;
            if (s === 'failed' || s === 'broken') streak++;
            else break;
          }
          return streak;
        })();
        const failCount = entry.history.filter(h => h.status === 'failed' || h.status === 'broken').length;
        recentlyFixed.push({ uuid, name, browser, consecutiveFails, failCount });
      }
    });

    if (newlyFailing.length === 0 && recentlyFixed.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';

    const mkRow = (item, isNew) => {
      let sub;
      if (isNew) {
        sub = item.lastPassAt ? `Last passed: ${fmtTs(item.lastPassAt)}` : 'Was passing before';
      } else {
        const streak = item.consecutiveFails || 1;
        sub = streak > 1
          ? `Recovered after <b>${streak}-run streak</b> · ${item.failCount} total fail${item.failCount !== 1 ? 's' : ''}`
          : `Recovered after 1 run · ${item.failCount} total fail${item.failCount !== 1 ? 's' : ''}`;
      }
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
          <div style="display:flex;align-items:center;gap:0.3rem;min-width:0;">
            <span class="sv-truncate" style="font-size:0.8rem;font-weight:500;">${escHtml(item.name)}</span>
            ${item.browser ? `<span class="sv-browser-badge">${escHtml(item.browser)}</span>` : ''}
          </div>
          <div style="font-size:0.68rem;color:var(--text-muted);margin-top:1px;">${sub}</div>
        </div>
        ${item.uuid ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>` : ''}
      </div>`;
    };

    const emptyRow = msg => `<div style="text-align:center;color:var(--text-muted);padding:1.5rem;font-size:0.78rem;">${msg}</div>`;

    const meanRecovery = recentlyFixed.length > 0
      ? Math.round(recentlyFixed.reduce((s, t) => s + (t.consecutiveFails || 1), 0) / recentlyFixed.length)
      : 0;
    const recoveryBadge = meanRecovery > 0
      ? `<span data-sv-tip="${escHtml('<b>Mean Recovery Time</b><br>Average consecutive failed runs before a fix landed in this cycle.')}"
               style="font-size:0.65rem;font-weight:600;color:var(--status-passed);
                      background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);
                      border-radius:999px;padding:0.1rem 0.55rem;cursor:default;white-space:nowrap;">
           avg ${meanRecovery} run${meanRecovery !== 1 ? 's' : ''}
         </span>` : '';

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
            <span class="sv-info-btn" data-sv-tip="${escHtml('<b>Recently Fixed</b><br>• Was failing before but passing now<br>• Streak = consecutive failed runs before this fix<br>• Mean recovery shown above = avg streak across all fixed tests<br>• Use to report progress and measure fix velocity')}">${INFO_ICON_SM}</span>
            ${recoveryBadge}
          </span>
          <span style="font-size:0.72rem;color:var(--text-muted);">${recentlyFixed.length} test${recentlyFixed.length !== 1 ? 's' : ''}</span>
        </div>
        <div style="padding:0;max-height:260px;overflow-y:auto;">
          ${recentlyFixed.length ? recentlyFixed.map(t => mkRow(t, false)).join('') : emptyRow('No recently fixed tests')}
        </div>
      </div>
    </div>`;
  }

  /* ── Coverage Changes: New Tests / Absent Tests ─────────────────────────────── */
  function renderSeverityBreakdown(finalTests) {
    const el = document.getElementById('sv-severity-breakdown');
    if (!el) return;

    const LEVELS = ['critical', 'high', 'medium', 'low', 'trivial'];
    const COLORS = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#3b82f6', trivial: '#94a3b8' };
    const TIPS   = {
      critical: 'critical — must fix before release, blocks pipeline',
      high:     'high — significant impact, should be fixed this sprint',
      medium:   'medium — noticeable issue, schedule for near-term fix',
      low:      'low — minor issue, fix when convenient',
      trivial:  'trivial — cosmetic or negligible impact',
    };

    const counts    = { critical: 0, high: 0, medium: 0, low: 0, trivial: 0 };
    const unlabeled = { failed: 0, flaky: 0 };
    let anyLabeled  = false;

    const testsPerLevel = {};
    LEVELS.forEach(l => { testsPerLevel[l] = []; });

    (finalTests || []).forEach(t => {
      const isBad = t.status === 'failed' || t.status === 'broken' || t.status === 'flaky';
      if (!isBad) return;
      const sev = getSeverityFromLabels(t.labels);
      if (sev && LEVELS.includes(sev)) {
        counts[sev]++;
        testsPerLevel[sev].push(t);
        anyLabeled = true;
      } else {
        if (t.status === 'flaky') unlabeled.flaky++;
        else unlabeled.failed++;
      }
    });

    if (!anyLabeled) { el.style.display = 'none'; return; }
    el.style.display = '';

    const active   = LEVELS.filter(l => counts[l] > 0);
    const maxCount = Math.max(...active.map(l => counts[l]), 1);
    const totalBad = active.reduce((s, l) => s + counts[l], 0) + unlabeled.failed + unlabeled.flaky;

    const mkTestRow = t => {
      const sym   = t.status === 'failed' || t.status === 'broken' ? '✗' : '~';
      const color = t.status === 'flaky' ? 'var(--status-flaky)' : 'var(--status-failed)';
      return `
      <div style="display:flex;align-items:center;gap:0.65rem;padding:0.4rem 1.5rem;
                  border-bottom:1px solid var(--border);${t.uuid ? 'cursor:pointer;' : ''}"
           ${t.uuid ? `onclick="SarvaTestDetail.open('${t.uuid}')"` : ''}
           onmouseenter="this.style.background='var(--bg-hover)'" onmouseleave="this.style.background=''">
        <span style="color:${color};font-size:0.75rem;flex-shrink:0;">${sym}</span>
        <div class="sv-truncate" style="flex:1;font-size:0.78rem;">${escHtml(t.name)}</div>
        ${t.uuid ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>` : ''}
      </div>`;
    };

    const rows = active.map(l => {
      const n       = counts[l];
      const pct     = (n / maxCount * 100).toFixed(1);
      const c       = COLORS[l];
      const panelId = `sv-sev-panel-${l}`;
      const tests   = testsPerLevel[l];
      return `
      <div style="border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:0.75rem;padding:0.55rem 1.25rem;cursor:pointer;"
             onmouseenter="this.style.background='var(--bg-hover)'" onmouseleave="this.style.background=''"
             onclick="(function(row){var p=document.getElementById('${panelId}');var open=p.style.display==='block';p.style.display=open?'none':'block';row.querySelector('.sv-sev-chev').style.transform=open?'rotate(0deg)':'rotate(90deg)';})(this)">
          <span class="sv-severity-badge ${escHtml(l)}" style="flex-shrink:0;width:4.5rem;justify-content:center;">${escHtml(l)}</span>
          <div style="flex:1;height:6px;background:var(--bg-surface-3);border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${c};border-radius:3px;transition:width 0.4s;"></div>
          </div>
          <span style="font-size:0.85rem;font-weight:700;color:${c};min-width:1.5rem;text-align:right;">${n}</span>
          <svg class="sv-sev-chev" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2.5"
               style="flex-shrink:0;transition:transform 0.2s;"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div id="${panelId}" style="display:none;background:var(--bg-surface-2);">
          ${tests.map(mkTestRow).join('')}
        </div>
      </div>`;
    }).join('');

    const unlabeledTotal = unlabeled.failed + unlabeled.flaky;
    const unlabeledRow = unlabeledTotal > 0
      ? `<div style="display:flex;align-items:center;gap:0.75rem;padding:0.4rem 1.25rem;border-top:1px dashed var(--border);">
           <span style="flex-shrink:0;width:4.5rem;font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;">unlabeled</span>
           <span style="font-size:0.75rem;color:var(--text-muted);">${unlabeledTotal} test${unlabeledTotal !== 1 ? 's' : ''} without severity label</span>
         </div>`
      : '';

    el.innerHTML = `
    <div class="sv-card">
      <div class="sv-card-header">
        <span style="display:flex;align-items:center;gap:0.4rem;">
          <span class="sv-card-title">Failures by Severity</span>
          <span style="font-size:0.65rem;color:var(--text-muted);font-weight:500;margin-left:0.15rem;">· this run</span>
          <span class="sv-info-btn" data-sv-tip="${escHtml('<b>Failures by Severity — current run only</b><br>• Failed/flaky tests from THIS run grouped by severity label<br>• Only current failures — not historical ones<br>• Unlike "Newly Failing" (regressions only), this includes ALL ongoing failures<br>• Click any row to expand and see the specific tests')}">${INFO_ICON_SM}</span>
        </span>
        <span style="font-size:0.72rem;color:var(--text-muted);">${totalBad} affected</span>
      </div>
      <div style="padding:0;">${rows}${unlabeledRow}</div>
    </div>`;
  }

  /* ── CSV helpers ────────────────────────────────────────────────────────────── */
  function csvEsc(v) {
    const s = String(v == null ? '' : v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  }
  function triggerCsvDownload(rows, filename) {
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function renderTopFailuresAndStore(finalTests) {
    renderTopFailures(finalTests);
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
    (SarvaStore.stats?.finalTests || []).filter(t => (t.status === 'failed' || t.status === 'broken') && !seen.has(t.fullName))
      .forEach(t => _failData.push({ name: t.name, failCount: 1, totalRuns: 1 }));
    _failData.sort((a, b) => b.failCount - a.failCount);
  }

  function renderTopFlakyAndStore() {
    renderTopFlaky();
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

  /* ── Init ───────────────────────────────────────────────────────────────────── */
  SarvaEventBus.on('store:ready', ({ stats }) => {
    _cachedStats = stats;
    renderFailuresSummary(stats);
    renderTopFailuresAndStore(stats.finalTests || []);
    renderTopFlakyAndStore();
    renderNewlyFailing();
    renderSeverityBreakdown(stats.finalTests || []);
  });

  return { downloadFailuresCsv, downloadFlakyCsv };

})();

window.SarvaFailures = SarvaFailures;
