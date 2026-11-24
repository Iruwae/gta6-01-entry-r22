import * as THREE from 'three';
export function createSky(g) {
  const scene = g.scene;
  const geo = new THREE.SphereGeometry(2000, 24, 12);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {top: {value: new THREE.Color(0x4a1020)}, mid: {value: new THREE.Color(0xc24a1e)}, bot: {value: new THREE.Color(0xff8a30)}},
    vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bot; void main(){ float h=normalize(vP).y; vec3 c=h>0.25?mix(mid,top,smoothstep(0.25,0.9,h)):mix(bot,mid,smoothstep(-0.05,0.25,h)); gl_FragColor=vec4(c,1.0); }'
  });
  const dome = new THREE.Mesh(geo, mat);
  dome.position.y = 0;
  scene.add(dome);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(60, 24), new THREE.MeshBasicMaterial({color: 0xffd9a0, fog: false}));
  sun.position.set(-900, 180, -1400);
  sun.lookAt(0, 0, 0);
  scene.add(sun);
  const hemi = new THREE.HemisphereLight(0xffb070, 0x2a1a2a, 0.85);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xff9a50, 1.6);
  dir.position.set(-300, 220, -180);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.left = -120; dir.shadow.camera.right = 120;
  dir.shadow.camera.top = 120; dir.shadow.camera.bottom = -120;
  dir.shadow.camera.near = 10; dir.shadow.camera.far = 900;
  scene.add(dir);
  scene.fog = new THREE.Fog(0xd85a28, 260, 2400);
  const cloudCv = document.createElement('canvas');
  cloudCv.width = 128; cloudCv.height = 64;
  const cx = cloudCv.getContext('2d');
  const grd = cx.createRadialGradient(64, 32, 4, 64, 32, 60);
  grd.addColorStop(0, 'rgba(255,200,170,0.85)');
  grd.addColorStop(0.6, 'rgba(255,170,140,0.35)');
  grd.addColorStop(1, 'rgba(255,170,140,0)');
  cx.fillStyle = grd; cx.fillRect(0, 0, 128, 64);
  const cloudTex = new THREE.CanvasTexture(cloudCv);
  const clouds = [];
  const crng = g.rng.fork('clouds');
  for (let i = 0; i < 34; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map: cloudTex, transparent: true, opacity: 0.5, depthWrite: false, fog: false}));
    s.position.set(crng.float(-1200, 1200), crng.float(330, 760), crng.float(-1200, 1200));
    s.scale.set(crng.float(180, 420), crng.float(40, 90), 1);
    scene.add(s);
    clouds.push(s);
  }
  const starGeo = new THREE.BufferGeometry();
  const sp = [];
  const srng = g.rng.fork('stars');
  for (let i = 0; i < 700; i++) {
    const a = srng.float(0, Math.PI * 2), e = srng.float(0.15, 1.4), r = 1900;
    sp.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({color: 0xffe8d0, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.7}));
  scene.add(stars);
  const blimp = new THREE.Group();
  const blimpBody = new THREE.Mesh(new THREE.CapsuleGeometry(9, 42, 4, 10), new THREE.MeshStandardMaterial({color: 0xff7a20, roughness: 0.5}));
  blimpBody.rotation.z = Math.PI / 2;
  blimp.add(blimpBody);
  const gond = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 5), new THREE.MeshStandardMaterial({color: 0xf2ead8}));
  gond.position.y = -9;
  blimp.add(gond);
  blimp.position.set(0, 150, -100);
  scene.add(blimp);
  const gulls = [];
  const grng = g.rng.fork('gulls');
  const gullMat = new THREE.MeshBasicMaterial({color: 0xffffff});
  for (let i = 0; i < 14; i++) {
    const gu = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.4, 4), gullMat);
    gu.rotation.z = Math.PI / 2;
    scene.add(gu);
    gulls.push({m: gu, cx: grng.float(380, 520), cz: grng.float(-60, 220), r: grng.float(14, 40), h: grng.float(16, 38), a: grng.float(0, 6.28), s: grng.float(0.3, 0.7)});
  }
  const sky = {
    dome, sun, dir, hemi, clouds, stars, blimp, gulls,
    setHour(h) {
      g.clock.h = h;
      const t = Math.max(0, Math.min(1, (h - 16) / 4));
      mat.uniforms.top.value.setHex(0x4a1020).lerp(new THREE.Color(0x1a2a4a), (1 - t) * 0.4);
      dir.intensity = 1.2 + t * 0.6;
    },
    update(dt, t) {
      blimp.position.x = Math.cos(t * 0.021) * 260;
      blimp.position.z = -100 + Math.sin(t * 0.021) * 260;
      blimp.position.y = 150 + Math.sin(t * 0.5) * 4;
      blimp.rotation.y = -t * 0.021;
      for (const c of clouds) { c.position.x += dt * 1.2; if (c.position.x > 1300) c.position.x = -1300; }
      for (const gu of gulls) {
        gu.a += dt * gu.s;
        gu.m.position.set(gu.cx + Math.cos(gu.a) * gu.r, gu.h, gu.cz + Math.sin(gu.a) * gu.r);
        gu.m.rotation.y = -gu.a;
      }
      dome.position.x = g.camera.position.x;
      dome.position.z = g.camera.position.z;
      stars.position.x = g.camera.position.x;
      stars.position.z = g.camera.position.z;
    }
  };
  g.sky = sky;
  return sky;
}
