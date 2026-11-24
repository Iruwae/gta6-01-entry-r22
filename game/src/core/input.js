export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let mouseDX = 0;
  let mouseDY = 0;
  let wheel = 0;
  const mouseHeld = [false, false, false];
  const mousePressed = [false, false, false];
  let locked = false;
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    held.add(e.code);
    pressed.add(e.code);
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => { held.clear(); pressed.clear(); });
  document.addEventListener('mousemove', (e) => {
    if (locked) { mouseDX += e.movementX; mouseDY += e.movementY; }
  });
  document.addEventListener('mousedown', (e) => {
    mouseHeld[e.button] = true;
    mousePressed[e.button] = true;
  });
  document.addEventListener('mouseup', (e) => { mouseHeld[e.button] = false; });
  document.addEventListener('wheel', (e) => { wheel += e.deltaY; }, { passive: true });
  document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement === canvas;
  });
  const api = {
    axis(codes) {
      let v = 0;
      for (const c of codes) if (held.has(c)) v += 1;
      return v;
    },
    isHeld(...codes) { return codes.some((c) => held.has(c)); },
    wasPressed(...codes) { return codes.some((c) => pressed.has(c)); },
    consume(...codes) {
      let hit = false;
      for (const c of codes) if (pressed.delete(c)) hit = true;
      return hit;
    },
    get mouseHeld() { return mouseHeld; },
    get mousePressed() { return mousePressed; },
    get mouseDX() { const d = mouseDX; mouseDX = 0; return d; },
    get mouseDY() { const d = mouseDY; mouseDY = 0; return d; },
    get wheel() { const w = wheel; wheel = 0; return w; },
    get locked() { return locked; },
    lock() { canvas.requestPointerLock?.(); },
    unlock() { document.exitPointerLock?.(); },
    endFrame() { pressed.clear(); mousePressed[0] = mousePressed[1] = mousePressed[2] = false; },
  };
  return api;
}
