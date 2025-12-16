let keys = { w: false, a: false, s: false, d: false };

export function initControls(player, camera) {
  const onKey = (e, down) => {
    const k = e.key.toLowerCase();
    if (k === "w" || k === "arrowup") keys.w = down;
    if (k === "a" || k === "arrowleft") keys.a = down;
    if (k === "s" || k === "arrowdown") keys.s = down;
    if (k === "d" || k === "arrowright") keys.d = down;
  };
  window.addEventListener("keydown", (e) => onKey(e, true));
  window.addEventListener("keyup", (e) => onKey(e, false));

  return {
    getMoveVector() {
      // move in camera-relative forward
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3(forward.z, 0, -forward.x); // perpendicular

      const v = new THREE.Vector3(0, 0, 0);
      if (keys.w) v.add(forward);
      if (keys.s) v.add(forward.clone().multiplyScalar(-1));
      if (keys.a) v.add(right.clone().multiplyScalar(-1));
      if (keys.d) v.add(right);

      if (v.lengthSq() > 0) v.normalize();
      return { x: v.x, z: v.z };
    },
  };
}

// minimal import to avoid circular deps
import * as THREE from "three";