export function createBus() {
  const m = new Map();
  return {
    on(e, f) {
      if (!m.has(e)) m.set(e, []);
      m.get(e).push(f);
      return () => { const l = m.get(e) || [], i = l.indexOf(f); if (i >= 0) l.splice(i, 1); };
    },
    emit(e, d) { const l = m.get(e); if (l) for (const f of [...l]) f(d); },
  };
}
