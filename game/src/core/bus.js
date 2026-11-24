export function createBus() {
  const listeners = new Map();
  return {
    on(event, fn) {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(fn);
      return () => {
        const list = listeners.get(event) || [];
        const at = list.indexOf(fn);
        if (at >= 0) list.splice(at, 1);
      };
    },
    emit(event, data) {
      const list = listeners.get(event);
      if (!list) return;
      for (const fn of [...list]) fn(data);
    },
  };
}