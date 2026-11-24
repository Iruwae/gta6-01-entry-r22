export function createMinimap(game) {
  const canvas = document.getElementById('hud-minimap');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const W = 168;
  const H = 168;
  const CX = W / 2;
  const CY = H / 2;
  const R = 80;
  function tm(x, z) {
    const mx = CX + ((x - 223) / 753) * R;
    const my = CY + ((z + 2) / 438) * R;
    return { x: mx, y: my };
  }
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#0b2a4a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1a2a3a';
    const m1 = tm(-530, -440);
    const m2 = tm(522, 436);
    ctx.fillRect(m1.x, m1.y, m2.x - m1.x, m2.y - m1.y);
    const i1 = tm(738, -216);
    const i2 = tm(976, 36);
    ctx.fillRect(i1.x, i1.y, i2.x - i1.x, i2.y - i1.y);
    for (const d of game.plan.districts) {
      const p = tm(d.x - d.w / 2, d.z - d.h / 2);
      ctx.fillStyle = d.id === game.plan.districtAt(game.player.position.x, game.player.position.z)?.id ? '#3a5a3a' : '#22384a';
      ctx.fillRect(p.x, p.y, (d.w / 753) * R, (d.h / 438) * R);
    }
    ctx.strokeStyle = '#4a6a8a';
    ctx.lineWidth = 1.5;
    for (const j of game.plan.junctions) {
      for (const n of game.plan.neighbours(j.id)) {
        if (n <= j.id) continue;
        const a = tm(j.x, j.z);
        const b = tm(game.plan.byId.get(n).x, game.plan.byId.get(n).z);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    const stage = game.missions.currentStage();
    if (stage && stage.marker) {
      const place = game.plan.placeById.get(stage.marker);
      if (place) {
        const m = tm(place.x, place.z);
        ctx.fillStyle = '#ffd23d';
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-4, -4, 8, 8);
        ctx.restore();
      }
    }
    for (const u of game.dispatch.units) {
      const m = tm(u.vehicle.position.x, u.vehicle.position.z);
      ctx.fillStyle = '#ff2a2a';
      ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (game.dispatch.helicopter.active) {
      const m = tm(game.dispatch.helicopter.position.x, game.dispatch.helicopter.position.z);
      ctx.strokeStyle = '#ff2a2a';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(m.x, m.y, 6, 0, Math.PI * 2); ctx.stroke();
    }
    const p = tm(game.player.position.x, game.player.position.z);
    const heading = game.player.vehicle ? game.player.vehicle.heading : game.player.heading;
    ctx.fillStyle = '#ffffff';
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(heading);
    ctx.beginPath();
    ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(-5, 5); ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();
    ctx.strokeStyle = '#ffd23d';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px system-ui';
    ctx.fillText('N', CX - 3, 12);
  }
  return { draw, tm };
}