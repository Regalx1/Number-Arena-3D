import { initScene } from "./scene.js";
import { initControls } from "./controls.js";
import { initMobile } from "./mobile.js";
import { initGame } from "./game.js";
import { initUI } from "./ui.js";
import { initTutorial } from "./tutorial.js";

const appEl = document.getElementById("app");
const playBtn = document.getElementById("playBtn");
const statusEl = document.getElementById("status");
const scoreEl = document.getElementById("score");

const { three, tiles, player, clock, npc } = await initScene(appEl);
const controls = initControls(player, three.camera);
const mobile = initMobile(player);
// provide references for mobile raycasting
mobile.setRefs({ camera: three.camera, tiles });

const ui = initUI({
  playBtn,
  statusEl,
  scoreEl,
});

const tutorial = initTutorial({
  onDone: () => {/* no-op */},
});
tutorial.show(); // show on first load

const game = initGame({
  tiles,
  player,
  ui,
  npc,
});

// Input mapping
function updateInput(dt) {
  const move = controls.getMoveVector();
  const mobileMove = mobile.getMoveVector();
  // combine inputs
  const vx = move.x + mobileMove.x;
  const vz = move.z + mobileMove.z;
  player.velocity.set(vx, 0, vz);
}

function updateAutoWalk(dt) {
  mobile.updateAutoWalk(dt);
}

function animate() {
  const dt = clock.getDelta();
  updateInput(dt);
  updateAutoWalk(dt);
  game.update(dt);
  three.renderer.render(three.scene, three.camera);
  requestAnimationFrame(animate);
}
animate();

// Hook up UI actions
playBtn.addEventListener("click", () => game.submitPlayerNumber());

// Resize
window.addEventListener("resize", () => {
  const { camera, renderer } = three;
  camera.aspect = appEl.clientWidth / appEl.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(appEl.clientWidth, appEl.clientHeight, false);
});