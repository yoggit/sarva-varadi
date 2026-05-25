/**
 * Shared read-only state store. Populated once from embedded JSON at page load.
 * Modules read from here; never mutate directly — emit events instead.
 */
window.SarvaStore = window.SarvaStore || (() => {
  let _tests = [];
  let _metadata = {};
  let _history = [];
  let _stats = {};
  let _originalTests = [];
  let _originalMetadata = {};

  function computeStats(tests) {
    const unique = new Map();
    tests.forEach(t => {
      const ex = unique.get(t.fullName);
      if (!ex || t.start >= ex.start) unique.set(t.fullName, t);
    });
    const final = Array.from(unique.values());
    const totalRetries = tests.length - final.length;
    const passed = final.filter(t => t.status === 'passed').length;
    const failed = final.filter(t => t.status === 'failed' || t.status === 'broken').length;
    const flaky = final.filter(t => t.status === 'flaky').length;
    const skipped = final.filter(t => t.status === 'skipped').length;
    const passRate = final.length > 0 ? ((passed / final.length) * 100).toFixed(1) : 0;
    return { total: final.length, passed, failed, flaky, skipped, retries: totalRetries, passRate, finalTests: final };
  }

  let _testHistory = [];

  return {
    init(tests, metadata, historyData) {
      _tests = tests || [];
      _metadata = metadata || {};
      _originalTests = _tests;
      _originalMetadata = _metadata;
      // historyData may be { runs, testHistory } or a plain runs array (backwards compat)
      if (Array.isArray(historyData)) {
        _history = historyData;
        _testHistory = [];
      } else {
        _history = (historyData && historyData.runs) || [];
        _testHistory = (historyData && historyData.testHistory) || [];
      }
      _stats = computeStats(_tests);
      SarvaEventBus.emit('store:ready', { tests: _tests, metadata: _metadata, history: _history, stats: _stats });
    },
    switchToRun(tests, runSummary) {
      _tests = tests || [];
      _metadata = {
        id: runSummary.id,
        timestamp: runSummary.timestamp,
        duration: runSummary.duration,
        environment: runSummary.environment || {},
      };
      _stats = computeStats(_tests);
      SarvaEventBus.emit('store:ready', { tests: _tests, metadata: _metadata, history: _history, stats: _stats });
      SarvaEventBus.emit('run:switched', { runId: runSummary.id });
    },
    restoreLatest() {
      _tests = _originalTests;
      _metadata = _originalMetadata;
      _stats = computeStats(_tests);
      SarvaEventBus.emit('store:ready', { tests: _tests, metadata: _metadata, history: _history, stats: _stats });
      SarvaEventBus.emit('run:switched', { runId: null });
    },
    get tests() { return _tests; },
    get metadata() { return _metadata; },
    get history() { return _history; },
    get testHistory() { return _testHistory; },
    get stats() { return _stats; },
    getTestHistory(tool, fullName) {
      const testId = tool ? `${tool}:${fullName}` : fullName;
      const entry = _testHistory.find(t =>
        t.testId === testId ||
        t.testId === fullName ||
        t.testId.endsWith(':' + fullName)
      );
      if (entry && entry.history && entry.history.length > 0) {
        // Reverse so oldest is first (chronological order for charts)
        return entry.history.slice().reverse().map(o => {
          const run = _history.find(r => r.id === o.runId);
          return {
            runId: o.runId,
            timestamp: run ? run.timestamp : 0,
            status: o.wasFlaky ? 'flaky' : o.status,
            duration: o.duration,
          };
        });
      }
      return [];
    },
  };
})();
