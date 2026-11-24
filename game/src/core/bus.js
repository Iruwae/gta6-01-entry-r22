export function createBus(g) {
  const map = new Map();
  const bus = {
    on(ev, fn) { if (!map.has(ev)) map.set(ev, []); map.get(ev).push(fn); },
    emit(ev, data) { const l = map.get(ev); if (!l) return; for (const fn of l.slice()) fn(data); },
    off(ev, fn) { const l = map.get(ev); if (!l) return; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); }
  };
  g.bus = bus;
  return bus;
}
