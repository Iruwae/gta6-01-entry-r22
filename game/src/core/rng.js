export function mulberry(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function makeRng(seed) {
  const base = mulberry(seed);
  const r = () => base();
  r.fork = (label) => makeRng((seed ^ hashStr(label)) >>> 0);
  r.int = (a, b) => a + Math.floor(base() * (b - a + 1));
  r.float = (a, b) => a + base() * (b - a);
  r.pick = (arr) => arr[Math.floor(base() * arr.length)];
  r.chance = (p) => base() < p;
  r.shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(base() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; };
  return r;
}
