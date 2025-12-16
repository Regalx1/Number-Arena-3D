let ctx = null;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

function tone({ startFreq, endFreq, duration = 0.7, type = "sine", gain = 0.25 }) {
  const audio = getCtx();
  const now = audio.currentTime;

  const osc = audio.createOscillator();
  osc.type = type;
  const g = audio.createGain();

  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + duration);

  osc.connect(g).connect(audio.destination);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

export function playSad(short = true) {
  // Two-note descending motif for "sad"
  const audio = getCtx();
  if (audio.state === "suspended") audio.resume();

  const d1 = short ? 0.55 : 0.9;
  const d2 = short ? 0.45 : 0.8;

  // A4 -> F4
  tone({ startFreq: 440, endFreq: 349.23, duration: d1, type: "sine", gain: 0.22 });
  // slight gap then E4 -> C4
  setTimeout(() => {
    tone({ startFreq: 329.63, endFreq: 261.63, duration: d2, type: "sine", gain: 0.2 });
  }, short ? 180 : 260);
}