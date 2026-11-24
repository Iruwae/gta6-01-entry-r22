export function createInput(g) {
  const held = new Set();
  const pressed = new Set();
  let mx = 0, my = 0, wheel = 0, locked = false;
  const inp = {
    held, pressed, get mx() { return mx; }, get my() { return my; }, get wheel() { return wheel; }, get locked() { return locked; },
    down(k) { return held.has(k); },
    hit(k) { return pressed.has(k); },
    consume(k) { pressed.delete(k); },
    endFrame() { pressed.clear(); mx = 0; my = 0; wheel = 0; },
    setFake(o) { inp.fake = o; },
    fake: null
  };
  g.input = inp;
  const kd = (e) => {
    if (e.repeat) return;
    held.add(e.code);
    pressed.add(e.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  };
  const ku = (e) => held.delete(e.code);
  const mm = (e) => { if (locked) { mx += e.movementX || 0; my += e.movementY || 0; } };
  const pc = () => { locked = document.pointerLockElement === g.canvas; };
  const md = (e) => { held.add('Mouse' + e.button); pressed.add('Mouse' + e.button); };
  const mu = (e) => held.delete('Mouse' + e.button);
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('mousemove', mm);
  window.addEventListener('mousedown', md);
  window.addEventListener('mouseup', mu);
  document.addEventListener('pointerlockchange', pc);
  g.canvas.addEventListener('click', () => { if (g.mode === 'play' && !locked) { try { g.canvas.requestPointerLock(); } catch (e) {} } });
  inp.detach = () => {
    window.removeEventListener('keydown', kd);
    window.removeEventListener('keyup', ku);
    window.removeEventListener('mousemove', mm);
    window.removeEventListener('mousedown', md);
    window.removeEventListener('mouseup', mu);
    document.removeEventListener('pointerlockchange', pc);
  };
  return inp;
}
