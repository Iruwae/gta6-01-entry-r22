import * as THREE from 'three';
export function createChaseCamera(camera) {
  const cam = {
    distance: 11,
    height: 4.2,
    position: new THREE.Vector3(0, 10, -20),
    lookAt: new THREE.Vector3(0, 1, 0),
    shakeOffset: new THREE.Vector3(),
    orbitYaw: 0,
    orbitPitch: 0,
    orbitTimer: 0,
    update(dt, tg, heading, speed, shake) {
      cam.orbitTimer -= dt;
      if (cam.orbitTimer <= 0) {
        cam.orbitYaw += (0 - cam.orbitYaw) * Math.min(1, dt * 1.5);
        cam.orbitPitch += (0 - cam.orbitPitch) * Math.min(1, dt * 1.5);
      }
      const lookDist = 6 + Math.min(10, speed * 0.35);
      const lookX = tg.x + Math.sin(heading) * lookDist;
      const lookZ = tg.z + Math.cos(heading) * lookDist;
      const yaw = heading + Math.PI + cam.orbitYaw;
      const dist = cam.distance + cam.orbitPitch * 0.4;
      const wantX = tg.x + Math.sin(yaw) * dist;
      const wantZ = tg.z + Math.cos(yaw) * dist;
      const wantY = (tg.y ?? 0) + cam.height + cam.orbitPitch;
      const k = 1 - Math.exp(-dt * 5);
      cam.position.x += (wantX - cam.position.x) * k;
      cam.position.y += (wantY - cam.position.y) * k;
      cam.position.z += (wantZ - cam.position.z) * k;
      cam.lookAt.x += (lookX - cam.lookAt.x) * (1 - Math.exp(-dt * 7));
      cam.lookAt.y += ((tg.y ?? 0) + 1.4 - cam.lookAt.y) * (1 - Math.exp(-dt * 7));
      cam.lookAt.z += (lookZ - cam.lookAt.z) * (1 - Math.exp(-dt * 7));
      if (shake > 0.001) {
        cam.shakeOffset.set(
          (Math.random() - 0.5) * shake * 0.6,
          (Math.random() - 0.5) * shake * 0.4,
          (Math.random() - 0.5) * shake * 0.6,
        );
      } else {
        cam.shakeOffset.set(0, 0, 0);
      }
      camera.position.copy(cam.position).add(cam.shakeOffset);
      camera.lookAt(cam.lookAt.x + cam.shakeOffset.x, cam.lookAt.y + cam.shakeOffset.y, cam.lookAt.z + cam.shakeOffset.z);
    },
    snap(tg, heading) {
      const yaw = heading + Math.PI;
      cam.position.set(tg.x + Math.sin(yaw) * cam.distance, (tg.y ?? 0) + cam.height, tg.z + Math.cos(yaw) * cam.distance);
      cam.lookAt.set(tg.x + Math.sin(heading) * 8, (tg.y ?? 0) + 1.4, tg.z + Math.cos(heading) * 8);
    },
    orbit(dx, dy) {
      cam.orbitYaw -= dx * 0.004;
      cam.orbitPitch = Math.max(-6, Math.min(6, cam.orbitPitch + dy * 0.05));
      cam.orbitTimer = 3;
    },
    zoom(delta) {
      cam.distance = Math.max(6, Math.min(20, cam.distance + delta * 0.01));
    },
  };
  return cam;
}