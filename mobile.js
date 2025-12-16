import nipplejs from "nipplejs";
import * as THREE from "three";

export function initMobile(player) {
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const joystickEl = document.getElementById("joystick");
  const mobileHint = document.getElementById("mobileHint");

  let moveVec = new THREE.Vector3(0, 0, 0);
  let autoTarget = null;

  if (isTouch) {
    joystickEl.style.display = "block";
    mobileHint.style.display = "block";
    const manager = nipplejs.create({
      zone: joystickEl,
      mode: "static",
      position: { left: "50%", top: "50%" },
      color: "white",
      size: 120,
    });

    manager.on("move", (_evt, data) => {
      const rad = (data.angle?.radian ?? 0);
      const force = Math.min(1, (data.force ?? 0) / 2);
      moveVec.x = Math.cos(rad) * force;
      moveVec.z = Math.sin(rad) * force;
    });
    manager.on("end", () => {
      moveVec.set(0, 0, 0);
    });

    // Tap-to-auto-walk towards clicked tile center
    window.addEventListener("click", (e) => {
      const tile = pickTileFromScreen(e.clientX, e.clientY);
      if (tile) {
        autoTarget = tile.position.clone();
      }
    });
  }

  function pickTileFromScreen(x, y) {
    // basic raycast; defer to game to store tiles globally
    const ray = window.__raycaster || (window.__raycaster = new THREE.Raycaster());
    const mouse = new THREE.Vector2(
      (x / window.innerWidth) * 2 - 1,
      -(y / window.innerHeight) * 2 + 1
    );
    const camera = window.__camera;
    const tiles = window.__tiles;
    if (!camera || !tiles) return null;
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(tiles, false);
    return hit.length ? hit[0].object : null;
  }

  function updateAutoWalk(dt) {
    if (!autoTarget) return;
    const to = autoTarget.clone().sub(player.mesh.position);
    to.y = 0;
    const dist = to.length();
    if (dist < 0.2) {
      autoTarget = null;
      moveVec.set(0, 0, 0);
      return;
    }
    to.normalize();
    player.velocity.set(to.x, 0, to.z);
  }

  // expose references for raycasting
  Object.defineProperty(window, "__camera", {
    value: null,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, "__tiles", {
    value: null,
    configurable: true,
    writable: true,
  });

  return {
    getMoveVector() {
      return { x: moveVec.x, z: moveVec.z };
    },
    updateAutoWalk(dt) {
      updateAutoWalk(dt);
    },
    setRefs({ camera, tiles }) {
      window.__camera = camera;
      window.__tiles = tiles;
    },
  };
}