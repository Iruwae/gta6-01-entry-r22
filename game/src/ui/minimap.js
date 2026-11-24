export function createMinimap(g) {
  const cv = document.getElementById('minimap');
  const ctx = cv.getContext('2d');
  const S = 250;
  const mm = {
    draw() {
      const p = g.player.pos;
      ctx.clearRect(0, 0, S, S);
      ctx.save();
      ctx.beginPath();
      ctx.arc(125, 125, 125, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#0a1a28';
      ctx.fillRect(0, 0, S, S);
      const view = 320;
      const scale = S / view;
      const toX = (x) => 125 + (x - p.x) * scale;
      const toZ = (z) => 125 + (z - p.z) * scale;
      ctx.fillStyle = '#274b5e';
      ctx.fillRect(toX(420), toZ(-400), 340 * scale, 760 * scale);
      ctx.strokeStyle = '#1e4a5a';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#3a6a4a';
      ctx.fillRect(toX(-440), toZ(-400), 1200 * scale, 760 * scale);
      ctx.strokeStyle = '#3a4a5a';
      ctx.lineWidth = 10 * scale;
      for (const jn of g.plan.junctions) {
        ctx.beginPath();
        ctx.moveTo(toX(jn.x), toZ(jn.z));
        ctx.lineTo(toX(jn.x + 90), toZ(jn.z));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(toX(jn.x), toZ(jn.z));
        ctx.lineTo(toX(jn.x), toZ(jn.z + 90));
        ctx.stroke();
      }
      ctx.fillStyle = '#3a5a3a';
      ctx.fillRect(toX(-440), toZ(360), 1200 * scale, 40 * scale);
      if (g.missions && g.missions.active) {
        const s = g.missions.curStep();
        const place = s ? g.plan.places[s.target] : null;
        if (place) {
          ctx.fillStyle = '#ffd040';
          ctx.beginPath();
          ctx.arc(toX(place.x), toZ(place.z), 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#111';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('!', toX(place.x), toZ(place.z) + 3.5);
        }
      }
      if (g.dispatch) for (const u of g.dispatch.units) {
        ctx.fillStyle = '#e04040';
        ctx.beginPath();
        ctx.arc(toX(u.vehicle.pos.x), toZ(u.vehicle.pos.z), 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.save();
      ctx.translate(125, 125);
      const hd = g.player.vehicle ? g.player.vehicle.heading : (g.player.yaw !== undefined ? g.player.yaw : g.player.heading);
      ctx.rotate(Math.PI - hd);
      ctx.fillStyle = '#ffd040';
      ctx.beginPath();
      ctx.moveTo(0, -12); ctx.lineTo(8, 8); ctx.lineTo(-8, 8); ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(125, 125, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('N', 125, 14);
      ctx.restore();
    }
  };
  g.minimap = mm;
  return mm;
}
