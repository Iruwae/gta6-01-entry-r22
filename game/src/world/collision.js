export function createCollision(g) {
  const CELL = 32;
  const cells = new Map();
  const key = (cx, cz) => cx + ':' + cz;
  const col = {
    boxes: [],
    add(x, z, hw, hd, h, thin) {
      const b = {x, z, hw, hd, h, thin: !!thin};
      col.boxes.push(b);
      const x0 = Math.floor((x - hw) / CELL), x1 = Math.floor((x + hw) / CELL);
      const z0 = Math.floor((z - hd) / CELL), z1 = Math.floor((z + hd) / CELL);
      for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
        const k = key(cx, cz);
        if (!cells.has(k)) cells.set(k, []);
        cells.get(k).push(b);
      }
      return b;
    },
    near(x, z) {
      const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
      const out = [];
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const l = cells.get(key(cx + a, cz + b));
        if (l) for (const bb of l) if (!out.includes(bb)) out.push(bb);
      }
      return out;
    },
    solidAt(x, z, m = 0) {
      for (const b of col.near(x, z)) if (Math.abs(x - b.x) < b.hw + m && Math.abs(z - b.z) < b.hd + m) return b;
      return null;
    },
    resolveCircle(p, r, feet = 0) {
      let px = 0, pz = 0, hit = false;
      for (const b of col.near(p.x, p.z)) {
        if (b.h <= feet) continue;
        const nx = Math.max(b.x - b.hw, Math.min(p.x, b.x + b.hw));
        const nz = Math.max(b.z - b.hd, Math.min(p.z, b.z + b.hd));
        let dx = p.x - nx, dz = p.z - nz;
        let d2 = dx * dx + dz * dz;
        if (d2 > r * r) continue;
        hit = true;
        if (d2 < 1e-6) {
          const ex = b.hw + r - Math.abs(p.x - b.x), ez = b.hd + r - Math.abs(p.z - b.z);
          if (ex < ez) { dx = p.x < b.x ? -1 : 1; dz = 0; px += dx * ex; }
          else { dx = 0; dz = p.z < b.z ? -1 : 1; pz += dz * ez; }
        } else {
          const d = Math.sqrt(d2);
          px += (dx / d) * (r - d); pz += (dz / d) * (r - d);
        }
      }
      if (hit) { p.x += px; p.z += pz; }
      return hit;
    },
    lineOfSight(ax, az, bx, bz, eye = 1.6) {
      const dx = bx - ax, dz = bz - az;
      const dist = Math.hypot(dx, dz);
      const steps = Math.max(1, Math.floor(dist / 4));
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const b = col.solidAt(ax + dx * t, az + dz * t, 0);
        if (b && b.h > eye) return false;
      }
      return true;
    }
  };
  g.collision = col;
  return col;
}
