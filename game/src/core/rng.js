export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashLabel(label) {
  let h = 2166136261;
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function createRng(seed) {
  const next = mulberry32(seed);
  const api = {
    seed,
    next,
    range(min, max) { return min + next() * (max - min); },
    int(min, max) { return Math.floor(api.range(min, max + 1)); },
    pick(list) { return list[Math.floor(next() * list.length)]; },
    chance(p) { return next() < p; },
    fork(label) { return createRng((seed ^ hashLabel(label)) >>> 0); },
  };
  return api;
}