import * as THREE from "three";
import { playSad } from "./sound.js";

export function initGame({ tiles, player, ui, npc }) {
  // expose for mobile raycast
  const camera = document.querySelector("canvas")?._threeCamera;
  // patch camera reference if stored; alternatively set via main.js
  window.__tiles = tiles;

  let round = 1;
  let scorePlayer = 0;
  let scoreCPU = 0;
  let playerChoice = null;
  let lock = false;
  let target = 1;
  function startRound() {
    target = 1 + Math.floor(Math.random() * tiles.length);
    ui.showStatus(`Round ${round}: Target is ${target}. Move onto a tile and press Play.`);
  }

  // highlight tile under player
  const ray = new THREE.Raycaster();

  function getPlayerTile() {
    // choose nearest tile center
    let nearest = null;
    let min = Infinity;
    for (const t of tiles) {
      const d = t.position.distanceTo(player.mesh.position);
      if (d < min) { min = d; nearest = t; }
    }
    if (min < 2.5) return nearest;
    return null;
  }

  function updateTileHighlights() {
    for (const t of tiles) {
      t.material = t.userData.baseMat;
    }
    const tile = getPlayerTile();
    if (tile) {
      tile.material = tile.userData.highlightMat;
    }
    ui.setPlayEnabled(!!tile && !lock);
  }

  function cpuPick() {
    // bias slightly towards higher numbers
    const picks = tiles.map(t => t.userData.number);
    const weighted = picks.flatMap(n => Array(n).fill(n));
    const choice = weighted[Math.floor(Math.random() * weighted.length)];
    return choice;
  }

  function placeNpcAtNumber(n) {
    const tile = tiles.find(t => t.userData.number === n);
    if (!tile) return;
    npc.mesh.position.set(tile.position.x, npc.mesh.position.y, tile.position.z);
    npc.shadow.position.set(tile.position.x, 0.01, tile.position.z);
  }

  function submitPlayerNumber() {
    if (lock) return;
    const tile = getPlayerTile();
    if (!tile) return;
    lock = true;
    playerChoice = tile.userData.number;
    ui.showStatus(`Round ${round}: Target ${target}. You played ${playerChoice}. CPU thinking...`);
    setTimeout(() => {
      const cpu = cpuPick();
      placeNpcAtNumber(cpu);
      const dCPU = Math.abs(cpu - target);
      const dPlayer = Math.abs(playerChoice - target);
      let msg = `CPU played ${cpu}. Target was ${target}. `;
      if (dCPU === 0 && dPlayer !== 0) { scoreCPU++; msg += "CPU hits exact target and wins."; playSad(true); }
      else if (dPlayer === 0 && dCPU !== 0) { scorePlayer++; msg += "Exact hit! You win the round!"; }
      else if (dCPU < dPlayer) { scoreCPU++; msg += "CPU is closer and wins the round."; playSad(true); }
      else if (dPlayer < dCPU) { scorePlayer++; msg += "You're closer! You win the round!"; }
      else { msg += "Tie. Replay the round."; }
      ui.updateScore(scorePlayer, scoreCPU);
      ui.showStatus(`Round ${round}: ${msg}`);

      const someoneWon = scorePlayer >= 3 || scoreCPU >= 3;
      if (someoneWon) {
        ui.showStatus(scorePlayer >= 3 ? "You win the match!" : "CPU wins the match.");
        if (scoreCPU >= 3) playSad(false);
        setTimeout(resetMatch, 2000);
      } else {
        if (dCPU !== dPlayer) round++;
        lock = false;
        startRound();
      }
    }, 600);
  }

  function resetMatch() {
    round = 1;
    scorePlayer = 0;
    scoreCPU = 0;
    lock = false;
    ui.updateScore(scorePlayer, scoreCPU);
    startRound();
    const mid = tiles.find(t => t.userData.number === 5) || tiles[0];
    placeNpcAtNumber(mid.userData.number);
  }

  function update(dt) {
    player.update(dt);
    updateTileHighlights();
  }
  startRound();
  return {
    update,
    submitPlayerNumber,
  };
}