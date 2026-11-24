import * as THREE from 'three';
export function createEffects(game) {
  const { scene } = game;
  const effects = {
    shakeAmount: 0,
    shake(amt) { effects.shakeAmount = Math.max(effects.shakeAmount, amt); },
    step(dt) {
      effects.shakeAmount = Math.max(0, effects.shakeAmount - dt * 1.4);
    },
    coinMesh(x, z) {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.12, 12),
        new THREE.MeshStandardMaterial({ color: 0xffd23d, roughness: 0.3, metalness: 0.8, emissive: 0x8a6a00, emissiveIntensity: 0.5 }),
      );
      m.rotation.x = Math.PI / 2;
      m.position.set(x, game.plan.groundHeight(x, z) + 1, z);
      scene.add(m);
      return m;
    },
    targetMesh(x, z) {
      const m = new THREE.Group();
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.15), new THREE.MeshStandardMaterial({ color: 0xf0ead8 }));
      m.add(board);
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16), new THREE.MeshBasicMaterial({ color: 0xd8382e }));
      ring.rotation.x = Math.PI / 2;
      ring.position.z = 0.1;
      m.add(ring);
      m.position.set(x, game.plan.groundHeight(x, z) + 1.4, z);
      scene.add(m);
      return m;
    },
    removeMesh(m) {
      if (!m) return;
      scene.remove(m);
      if (m.geometry) m.geometry.dispose();
    },
    hl: null,
    attachHeadlight(vehicleMesh) {
      if (!effects.hl) {
        const spot = new THREE.SpotLight(0xfff2c8, 120, 45, 0.55, 0.45);
        spot.position.set(0, 1, 2);
        const target = new THREE.Object3D();
        target.position.set(0, 0, 30);
        spot.target = target;
        effects.hl = { spot, target };
      }
      const { spot, target } = effects.hl;
      if (spot.parent) spot.parent.remove(spot);
      if (target.parent) target.parent.remove(target);
      vehicleMesh.add(spot);
      vehicleMesh.add(target);
    },
    detachHeadlight() {
      if (!effects.hl) return;
      const { spot, target } = effects.hl;
      if (spot.parent) spot.parent.remove(spot);
      if (target.parent) target.parent.remove(target);
    },
  };
  return effects;
}