export function initUI({ playBtn, statusEl, scoreEl }) {
  function setPlayEnabled(on) {
    playBtn.disabled = !on;
  }
  function showStatus(text) {
    statusEl.textContent = text;
  }
  function updateScore(p, c) {
    scoreEl.textContent = `You ${p} — ${c} CPU`;
  }
  return { setPlayEnabled, showStatus, updateScore };
}

