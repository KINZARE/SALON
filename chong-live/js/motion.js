const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let pointerX = .5;
let pointerY = .5;
let ticking = false;

function renderMotion() {
  ticking = false;
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, window.scrollY / max));
  root.style.setProperty('--scroll-progress', progress.toFixed(4));
  root.style.setProperty('--pointer-x', pointerX.toFixed(4));
  root.style.setProperty('--pointer-y', pointerY.toFixed(4));

  if (!reducedMotion) {
    document.querySelectorAll('[data-parallax]').forEach((el) => {
      const speed = Number(el.dataset.parallax || .08);
      const rect = el.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -speed;
      el.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
    });
  }

  const stages = [...document.querySelectorAll('[data-process-story] [data-process-stage]')];
  if (stages.length) {
    let active = stages[0];
    let distance = Infinity;
    for (const stage of stages) {
      const rect = stage.getBoundingClientRect();
      const d = Math.abs(rect.top + rect.height / 2 - window.innerHeight * .5);
      if (d < distance) { distance = d; active = stage; }
    }
    stages.forEach((stage) => stage.classList.toggle('is-active', stage === active));
    const name = active.dataset.processStage;
    if (root.dataset.processStage !== name) {
      root.dataset.processStage = name;
      window.dispatchEvent(new CustomEvent('tjong:process-stage', { detail: { stage: name } }));
    }
  }
}

function requestMotion() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(renderMotion);
}

window.addEventListener('scroll', requestMotion, { passive: true });
window.addEventListener('resize', requestMotion);
window.addEventListener('pointermove', (event) => {
  pointerX = event.clientX / Math.max(1, window.innerWidth);
  pointerY = event.clientY / Math.max(1, window.innerHeight);
  requestMotion();
}, { passive: true });

if (reducedMotion) root.dataset.motion = 'reduced';
requestMotion();
