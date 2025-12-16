import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export async function initScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f1215);

  const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 200);
  camera.position.set(0, 9, 12);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  container.appendChild(renderer.domElement);

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enablePan = false;
  orbit.maxPolarAngle = Math.PI * 0.49; // clamp vertical rotation
  orbit.minPolarAngle = Math.PI * 0.2;
  orbit.target.set(0, 0, 0);
  orbit.update();

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x404040, 1.0);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(7, 10, 5);
  scene.add(dir);

  // Determine tile count based on date (2025 tiles before Jan 1, 2026; 2926 tiles from then on)
  const now = new Date();
  const totalTiles = now >= new Date(2026, 0, 1) ? 2926 : 2025;

  // Layout parameters
  const spacing = 2.6;
  const tileSize = 2.2;
  const approxCols = Math.round(Math.sqrt(totalTiles));
  const cols = approxCols;
  const rows = Math.ceil(totalTiles / cols);

  // Arena floor sized to fit the grid with a small margin
  const floorWidth = cols * spacing + spacing * 2;
  const floorHeight = rows * spacing + spacing * 2;
  const floorGeo = new THREE.PlaneGeometry(floorWidth, floorHeight);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x162026, roughness: 0.9, metalness: 0.0 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Tiles numbered 1..totalTiles
  const tiles = [];
  const tileGeo = new THREE.BoxGeometry(tileSize, 0.2, tileSize);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1f2a31 });
  const highlightMat = new THREE.MeshStandardMaterial({ color: 0x2f8f57 });

  const numSpriteMaterial = (text) => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#cfe9d7";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 140px system-ui";
    ctx.fillText(text, size / 2, size / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    return new THREE.SpriteMaterial({ map: texture, transparent: true });
  };

  let n = 1;
  const xOffset = ((cols - 1) * spacing) / 2;
  const zOffset = ((rows - 1) * spacing) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (n > totalTiles) break;
      const tile = new THREE.Mesh(tileGeo, baseMat.clone());
      const x = c * spacing - xOffset;
      const z = r * spacing - zOffset;
      tile.position.set(x, 0.1, z);
      tile.userData.number = n;
      tile.userData.baseMat = tile.material;
      tile.userData.highlightMat = highlightMat.clone();

      const sprite = new THREE.Sprite(numSpriteMaterial(String(n)));
      sprite.scale.set(2.0, 2.0, 1);
      sprite.position.set(0, 0.25, 0);
      tile.add(sprite);

      scene.add(tile);
      tiles.push(tile);
      n++;
    }
    if (n > totalTiles) break;
  }

  // Player marker
  const playerGeo = new THREE.CapsuleGeometry(0.35, 0.6, 6, 12);
  const playerMat = new THREE.MeshStandardMaterial({ color: 0x71c48a, emissive: 0x0, roughness: 0.6, metalness: 0.05 });
  const playerMesh = new THREE.Mesh(playerGeo, playerMat);
  // Start near top row
  playerMesh.position.set(0, 0.5, zOffset);
  scene.add(playerMesh);

  // Player shadow
  const shadowGeo = new THREE.CircleGeometry(0.4, 32);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(playerMesh.position.x, 0.01, playerMesh.position.z);
  scene.add(shadow);

  // NPC marker + shadow
  const npcGeo = new THREE.CapsuleGeometry(0.35, 0.6, 6, 12);
  const npcMat = new THREE.MeshStandardMaterial({ color: 0xc47171, roughness: 0.6, metalness: 0.05 });
  const npcMesh = new THREE.Mesh(npcGeo, npcMat);
  npcMesh.position.set(-xOffset, 0.5, zOffset);
  scene.add(npcMesh);
  const npcShadow = new THREE.Mesh(shadowGeo.clone(), shadowMat.clone());
  npcShadow.rotation.x = -Math.PI / 2;
  npcShadow.position.set(npcMesh.position.x, 0.01, npcMesh.position.z);
  scene.add(npcShadow);

  const clock = new THREE.Clock();

  const player = {
    mesh: playerMesh,
    shadow,
    velocity: new THREE.Vector3(),
    speed: 3.0,
    update(dt) {
      this.mesh.position.x += this.velocity.x * this.speed * dt;
      this.mesh.position.z += this.velocity.z * this.speed * dt;
      // clamp to arena bounds (expanded)
      this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -floorGeo.parameters.width / 2 + 0.5, floorGeo.parameters.width / 2 - 0.5);
      this.mesh.position.z = THREE.MathUtils.clamp(this.mesh.position.z, -floorGeo.parameters.height / 2 + 0.5, floorGeo.parameters.height / 2 - 0.5);
      this.shadow.position.x = this.mesh.position.x;
      this.shadow.position.z = this.mesh.position.z;
    },
  };

  return {
    three: { scene, camera, renderer, orbit },
    tiles,
    player,
    npc: { mesh: npcMesh, shadow: npcShadow },
    clock,
  };
}