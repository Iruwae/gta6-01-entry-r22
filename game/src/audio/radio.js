const STATIONS = [
  { key: '1', name: 'SUNSET 88.5', dj: 'Amber Skyline', tracks: ['Neon Coast', 'Golden Hour Drive', 'Palm Shadows', 'Tidewater Blues'] },
  { key: '2', name: 'WAVE 101.2', dj: 'DJ Marina', tracks: ['Salt Air', 'Harbor Lights', 'Coral Static', 'Midnight Ferry'] },
  { key: '3', name: 'NEON 104.7', dj: 'Night Drive', tracks: ['Chrome Hearts', 'Boulevard Run', 'Vane City', 'Last Exit'] },
];
export function createRadio(game) {
  const radio = {
    station: 0,
    trackIndex: 0,
    trackTimer: 0,
    line() {
      const s = STATIONS[radio.station];
      return `${s.name} — ${s.tracks[radio.trackIndex]} · ${s.dj}`;
    },
    switchTo(i) {
      radio.station = ((i % STATIONS.length) + STATIONS.length) % STATIONS.length;
      radio.trackIndex = 0;
      radio.trackTimer = 0;
      game.ui.showToast(STATIONS[radio.station].name);
    },
    nextTrack() {
      radio.trackIndex = (radio.trackIndex + 1) % STATIONS[radio.station].tracks.length;
      radio.trackTimer = 0;
    },
    step(dt) {
      radio.trackTimer += dt;
      if (radio.trackTimer > 40) radio.nextTrack();
    },
  };
  return radio;
}