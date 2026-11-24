export function createRadio(g) {
  const stations = [
    {name: 'SUNSET 88.5', song: 'Neon Coast · Amber Skyline', bpm: 100, dj: "…and if you're the one in the red Comet on the boulevard, the whole city's watching…"},
    {name: 'MANGO 98.6', song: 'Guava Sunrise', bpm: 112, dj: "Mango FM — sweet sounds for a hot night in Solmar Bay."},
    {name: 'CORAL FM 101', song: 'Tidewater Blues', bpm: 82, dj: "Slow it down, Bay. Coral FM, all night long."},
    {name: 'BASSLINE 104', song: 'Midnight Engine', bpm: 124, dj: "Bassline — turn it up, the SBPD can't hear you anyway."}
  ];
  let ctx = null, master = null, musicGain = null, sfxGain = null, engOsc = null, engGain = null;
  let cur = 0, barT = 0, noteT = 0, step = 0;
  const scale = [0, 3, 5, 7, 10, 12, 15];
  const ensure = () => {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.5; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.9; sfxGain.connect(master);
      engOsc = ctx.createOscillator(); engOsc.type = 'sawtooth'; engOsc.frequency.value = 60;
      engGain = ctx.createGain(); engGain.gain.value = 0;
      engOsc.connect(engGain); engGain.connect(master);
      engOsc.start();
      return true;
    } catch (e) { ctx = null; return false; }
  };
  const note = (freq, t, dur, vol, type = 'square') => {
    if (!ctx) return;
    const o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    gn.gain.setValueAtTime(vol, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(gn); gn.connect(musicGain);
    o.start(t); o.stop(t + dur);
  };
  const radio = {
    stations, cur,
    station() { return stations[cur]; },
    next() { cur = (cur + 1) % stations.length; radio.cur = cur; if (g.hud) g.hud.radioLine(); },
    ensure,
    update(dt) {
      if (!ctx) return;
      const st = stations[cur];
      const beat = 60 / st.bpm / 2;
      noteT -= dt;
      if (noteT <= 0) {
        noteT = beat;
        const n = scale[step % scale.length];
        const f = 220 * Math.pow(2, n / 12);
        note(f, ctx.currentTime, beat * 0.9, 0.08);
        if (step % 4 === 0) note(110, ctx.currentTime, beat, 0.12, 'sine');
        step++;
        barT += beat;
        if (barT > beat * 32) { barT = 0; }
      }
      if (engOsc && g.player) {
        const sp = g.player.vehicle ? Math.abs(g.player.vehicle.speed) : 0;
        engOsc.frequency.value = 55 + sp * 3;
        engGain.gain.value = g.player.vehicle ? 0.05 : 0;
      }
    },
    shot(name) {
      if (!ensure() || !ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), gn = ctx.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(name === 'SMG' ? 900 : 700, t);
      o.frequency.exponentialRampToValueAtTime(120, t + 0.08);
      gn.gain.setValueAtTime(0.25, t);
      gn.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      o.connect(gn); gn.connect(sfxGain);
      o.start(t); o.stop(t + 0.1);
    },
    boom(pos) {
      if (!ensure() || !ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), gn = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(90, t);
      o.frequency.exponentialRampToValueAtTime(30, t + 0.6);
      gn.gain.setValueAtTime(0.5, t);
      gn.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      o.connect(gn); gn.connect(sfxGain);
      o.start(t); o.stop(t + 0.7);
    },
    click() {
      if (!ensure() || !ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), gn = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      gn.gain.setValueAtTime(0.15, t);
      gn.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      o.connect(gn); gn.connect(sfxGain);
      o.start(t); o.stop(t + 0.06);
    }
  };
  g.radio = radio;
  g.audio = radio;
  return radio;
}
