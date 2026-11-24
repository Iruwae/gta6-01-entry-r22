export function createInput(canvas) {
  const held = new Set();
  let mx = 0, my = 0, locked = false;
  const mh = [false, false, false];
  window.addEventListener('keydown', (e) => { if (!e.repeat) held.add(e.code); });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => held.clear());
  document.addEventListener('mousemove', (e) => { if (locked) { mx += e.movementX; my += e.movementY; } });
  document.addEventListener('mousedown', (e) => { mh[e.button] = true; });
  document.addEventListener('mouseup', (e) => { mh[e.button] = false; });
  document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; });
  return {
    axis(cs) { let v = 0; for (const c of cs) if (held.has(c)) v++; return v; },
    isHeld: (...c) => c.some((x) => held.has(x)),
    get mouseHeld() { return mh; },
    get mouseDX() { const d = mx; mx = 0; return d; },
    get mouseDY() { const d = my; my = 0; return d; },
  };
}
