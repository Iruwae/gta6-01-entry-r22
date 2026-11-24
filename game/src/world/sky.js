import * as THREE from 'three';
const WHITE = new THREE.Color(0xffffff);
const KEYFRAMES = [
  [0, 0x060a1e, 0x0d1330, 0x223055, 0.25, 0.35],
  [6.5, 0x2a4a7a, 0xff9d5c, 0xffc98a, 0.7, 0.55],
  [12, 0x2f7fd0, 0xa8dcf0, 0xffffff, 1.15, 0.85],
  [16, 0x2a6ac0, 0x8ec8e8, 0xfff0b8, 1.05, 0.8],
  [18, 0x1e3a6e, 0xff9d4d, 0xffb45e, 0.85, 0.65],
  [19, 0x1a2a5e, 0xff7a2e, 0xff8c3a, 0.7, 0.55],
  [21.5, 0x060a1e, 0x0d1330, 0x223055, 0.25, 0.35],
];
function lerpColor(a, b, t) {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return ca.lerp(cb, t);
}
export function createSky(scene, rng) {
  const domeGeo = new THREE.SphereGeometry(4200, 24, 12);
  const domeMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x2f7fd0) },
      horizonColor: { value: new THREE.Color(0xa8dcf0) },
      sunColor: { value: new THREE.Color(0xffffff) },
      sunDir: { value: new THREE.Vector3(0, 1, 0) },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 sunColor; uniform vec3 sunDir;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, -0.05, 1.0);
        vec3 col = mix(horizonColor, topColor, pow(max(h, 0.0), 0.55));
        float s = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
        col += sunColor * (pow(s, 220.0) * 1.4 + pow(s, 8.0) * 0.28);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  scene.add(dome);
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(700 * 3);
  for (let i = 0; i < 700; i++) {
    const th = rng.range(0, Math.PI * 2);
    const ph = rng.range(0.08, Math.PI / 2);
    const r = 3900;
    starPos[i * 3] = Math.cos(th) * Math.cos(ph) * r;
    starPos[i * 3 + 1] = Math.sin(ph) * r;
    starPos[i * 3 + 2] = Math.sin(th) * Math.cos(ph) * r;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
  const cc = document.createElement('canvas'); cc.width = cc.height = 32;
  const cg = cc.getContext('2d');
  const gr = cg.createRadialGradient(16, 16, 2, 16, 16, 15);
  gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  cg.fillStyle = gr; cg.fillRect(0, 0, 32, 32);
  const cloudMat = new THREE.SpriteMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, map: new THREE.CanvasTexture(cc), fog: false, depthWrite: false });
  const clouds = [];
  for (let i = 0; i < 34; i++) {
    const s = new THREE.Sprite(cloudMat.clone());
    const sc = rng.range(180, 420);
    s.scale.set(sc, sc * 0.32, 1);
    s.position.set(rng.range(-1800, 1800), rng.range(330, 760), rng.range(-1800, 1800));
    s.userData.speed = rng.range(2, 6);
    scene.add(s);
    clouds.push(s);
  }
  const sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -95;
  sun.shadow.camera.right = 95;
  sun.shadow.camera.top = 95;
  sun.shadow.camera.bottom = -95;
  sun.shadow.camera.far = 600;
  scene.add(sun);
  scene.add(sun.target);
  const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x3a2f28, 0.8);
  scene.add(hemi);
  scene.fog = new THREE.Fog(0xa8dcf0, 260, 2400);
  let nightFactor = 0;
  let lowSun = false;
  function sampleKeyframes(hour) {
    let a = KEYFRAMES[KEYFRAMES.length - 1];
    let b = KEYFRAMES[0];
    for (let i = 0; i < KEYFRAMES.length; i++) {
      if (KEYFRAMES[i][0] <= hour) a = KEYFRAMES[i];
      if (KEYFRAMES[i][0] > hour) { b = KEYFRAMES[i]; break; }
    }
    const span = (b[0] - a[0] + 24) % 24 || 24;
    const t = ((hour - a[0] + 24) % 24) / span;
    return {
      top: lerpColor(a[1], b[1], t),
      horizon: lerpColor(a[2], b[2], t),
      sun: lerpColor(a[3], b[3], t),
      power: a[4] + (b[4] - a[4]) * t,
      ambient: a[5] + (b[5] - a[5]) * t,
    };
  }
  const sky = {
    nightFactor: 0,
    lowSun: false,
    update(hour, focus, camera) {
      const k = sampleKeyframes(hour);
      domeMat.uniforms.topColor.value.copy(k.top);
      domeMat.uniforms.horizonColor.value.copy(k.horizon);
      domeMat.uniforms.sunColor.value.copy(k.sun);
      const dayT = (hour - 6) / 12;
      const ang = dayT * Math.PI;
      const elev = Math.sin(ang);
      const sunDir = new THREE.Vector3(Math.cos(ang) * 0.7, elev, 0.55).normalize();
      domeMat.uniforms.sunDir.value.copy(sunDir);
      sun.position.set(focus.x + sunDir.x * 300, Math.max(40, focus.y + sunDir.y * 300), focus.z + sunDir.z * 300);
      sun.target.position.set(focus.x, 0, focus.z);
      sun.intensity = k.power * 1.6;
      sun.color.copy(k.sun);
      hemi.intensity = k.ambient;
      nightFactor = THREE.MathUtils.clamp(1 - (elev + 0.12) / 0.5, 0, 1);
      lowSun = elev < 0.26;
      sky.nightFactor = nightFactor;
      sky.lowSun = lowSun;
      starMat.opacity = nightFactor * 0.9;
      scene.fog.color.copy(k.horizon);
      dome.position.set(camera.position.x, 0, camera.position.z);
      stars.position.set(camera.position.x, 0, camera.position.z);
      for (const c of clouds) {
        c.position.x += c.userData.speed * 0.016;
        if (c.position.x > 2000) c.position.x = -2000;
        c.material.color.copy(k.horizon).lerp(WHITE, 0.3);
      }
      return { nightFactor, lowSun };
    },
  };
  return sky;
}