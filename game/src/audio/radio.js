const STATIONS = [
  { key: '1', name: 'SUNSET 88.5', dj: 'Amber Skyline', tracks: ['Neon Coast', 'Golden Hour Drive', 'Palm Shadows', 'Tidewater Blues'] },
  { key: '2', name: 'WAVE 101.2', dj: 'DJ Marina', tracks: ['Salt Air', 'Harbor Lights', 'Coral Static', 'Midnight Ferry'] },
  { key: '3', name: 'NEON 104.7', dj: 'Night Drive', tracks: ['Chrome Hearts', 'Boulevard Run', 'Vane City', 'Last Exit'] },
];
export function createRadio(game) {
  const r = {
    station: 0, trackIndex: 0, trackTimer: 0,
    line() { const s = STATIONS[r.station]; return `${s.name} — ${s.tracks[r.trackIndex]} · ${s.dj}`; },
    switchTo(i) { r.station = ((i % 3) + 3) % 3; r.trackIndex = 0; r.trackTimer = 0; game.ui.showToast(STATIONS[r.station].name); },
    nextTrack() { r.trackIndex = (r.trackIndex + 1) % STATIONS[r.station].tracks.length; r.trackTimer = 0; },
    step(dt) { r.trackTimer += dt; if (r.trackTimer > 40) r.nextTrack(); },
  };
  return r;
}
