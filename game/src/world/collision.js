export function createCollision(cellSize = 32) {
  const cells = new Map();
  const key = (x, z) => `${Math.floor(x / cellSize)},${Math.floor(z / cellSize)}`;
  const boxes = [];
  function registerBox(x1, z1, x2, z2, height, tag = 'solid') {
    const b = { x1: Math.min(x1, x2), z1: Math.min(z1, z2), x2: Math.max(x1, x2), z2: Math.max(z1, z2), height, tag };
    boxes.push(b);
    const cx1 = Math.floor(b.x1 / cellSize);
    const cx2 = Math.floor(b.x2 / cellSize);
    const cz1 = Math.floor(b.z1 / cellSize);
    const cz2 = Math.floor(b.z2 / cellSize);
    for (let cx = cx1; cx <= cx2; cx++) {
      for (let cz = cz1; cz <= cz2; cz++) {
        const k = `${cx},${cz}`;
        if (!cells.has(k)) cells.set(k, []);
        cells.get(k).push(b);
      }
    }
    return b;
  }
  function boxesNear(x, z) {
    return cells.get(key(x, z)) || [];
  }
  function solidAt(x, z, margin = 0) {
    for (const b of boxesNear(x, z)) {
      if (b.tag === 'slim') continue;
      if (x > b.x1 - margin && x < b.x2 + margin && z > b.z1 - margin && z < b.z2 + margin) return b;
    }
    return null;
  }
  function lineOfSight(ax, az, bx, bz, eyeHeight = 2) {
    const len = Math.hypot(bx - ax, bz - az);
    const steps = Math.max(1, Math.ceil(len / 4));
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const hit = solidAt(ax + (bx - ax) * t, az + (bz - az) * t);
      if (hit && hit.height > eyeHeight) return false;
    }
    return true;
  }
  function resolveCircle(body, radius, feetY = 0) {
    let normal = null;
    for (const b of boxesNear(body.x, body.z)) {
      if (b.height <= feetY) continue;
      const nearX = Math.min(b.x2, Math.max(b.x1, body.x));
      const nearZ = Math.min(b.z2, Math.max(b.z1, body.z));
      let dx = body.x - nearX;
      let dz = body.z - nearZ;
      const distSq = dx * dx + dz * dz;
      if (distSq >= radius * radius) continue;
      if (distSq > 1e-6) {
        const dist = Math.sqrt(distSq);
        dx /= dist; dz /= dist;
        body.x = nearX + dx * radius;
        body.z = nearZ + dz * radius;
        normal = { x: dx, z: dz, depth: radius - dist };
      } else {
        const exits = [body.x - b.x1, b.x2 - body.x, body.z - b.z1, b.z2 - body.z];
        const side = exits.indexOf(Math.min(...exits));
        dx = side === 0 ? -1 : side === 1 ? 1 : 0;
        dz = side === 2 ? -1 : side === 3 ? 1 : 0;
        if (side === 0) body.x = b.x1 - radius;
        else if (side === 1) body.x = b.x2 + radius;
        else if (side === 2) body.z = b.z1 - radius;
        else body.z = b.z2 + radius;
        normal = { x: dx, z: dz, depth: radius };
      }
    }
    return normal;
  }
  return { registerBox, boxesNear, solidAt, lineOfSight, resolveCircle, boxes };
}