/**
 * Lightweight event bus for cross-module communication.
 * Modules publish and subscribe without direct references to each other.
 */
window.SarvaEventBus = window.SarvaEventBus || (() => {
  const listeners = {};

  return {
    on(event, fn) {
      (listeners[event] = listeners[event] || []).push(fn);
    },
    off(event, fn) {
      if (listeners[event]) listeners[event] = listeners[event].filter(f => f !== fn);
    },
    emit(event, data) {
      (listeners[event] || []).forEach(fn => {
        try { fn(data); } catch(e) { console.error('[SarvaEventBus] Error in listener for "' + event + '":', e); }
      });
    },
  };
})();
