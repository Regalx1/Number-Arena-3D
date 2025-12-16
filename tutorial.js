export function initTutorial({ onDone }) {
  const el = document.getElementById("tutorial");
  const tStep = document.getElementById("tStep");
  const btnPrev = document.getElementById("tPrev");
  const btnNext = document.getElementById("tNext");
  const btnSkip = document.getElementById("tSkip");

  const steps = [
    "Move onto a numbered tile: WASD on desktop, joystick on mobile. You can tap a tile to auto-walk.",
    "Press Play Number to submit the tile you’re standing on.",
    "Each round has a hidden target number. Closest to the target wins the round.",
    "The red NPC shows the CPU’s pick. First to 3 round wins takes the match.",
  ];
  let i = 0;

  function render() {
    tStep.textContent = steps[i];
    btnPrev.disabled = i === 0;
    btnNext.textContent = i === steps.length - 1 ? "Done" : "Next";
  }

  btnPrev.onclick = () => {
    if (i > 0) i--;
    render();
  };
  btnNext.onclick = () => {
    if (i < steps.length - 1) {
      i++;
      render();
    } else {
      hide();
      onDone && onDone();
    }
  };
  btnSkip.onclick = () => {
    hide();
    onDone && onDone();
  };

  function show() {
    i = 0;
    el.style.display = "flex";
    render();
  }
  function hide() {
    el.style.display = "none";
  }
  function isActive() {
    return el.style.display !== "none";
  }

  return { show, hide, isActive };
}