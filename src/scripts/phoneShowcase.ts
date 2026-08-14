export {};

const controls = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-phone-state]'));
const views = Array.from(document.querySelectorAll<HTMLElement>('[data-phone-view]'));
const screen = document.querySelector<HTMLElement>('[data-phone-screen]');
const device = document.querySelector<HTMLElement>('[data-phone-device]');
const status = document.querySelector<HTMLElement>('[data-phone-status]');
const statusBar = document.querySelector<HTMLElement>('.iphone-statusbar');
const statusImage = document.querySelector<HTMLImageElement>('.iphone-status-image');
const frameImage = document.querySelector<HTMLImageElement>('.iphone-frame');
const gestureSurface = document.querySelector<HTMLElement>('[data-phone-gesture]');
const automationExamples = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-automation-example]'));
const automationFrameTitle = document.querySelector<HTMLElement>('[data-automation-frame-title]');
const automationFrameTime = document.querySelector<HTMLElement>('[data-automation-frame-time]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let writeTimer = 0;
let touchStartX = 0;
let touchStartY = 0;
let tiltFrame = 0;
const precisionPointer = window.matchMedia('(hover: hover) and (pointer: fine)');

const resetPhoneTilt = () => {
  if (!device) return;
  device.style.removeProperty('transform');
};

const updatePhoneTilt = (event: PointerEvent) => {
  if (!device || !gestureSurface || reduceMotion.matches || !precisionPointer.matches || event.pointerType !== 'mouse') return;
  const rect = gestureSurface.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = Math.max(-1, Math.min(1, (event.clientX - rect.left - rect.width / 2) / (rect.width * 0.5)));
  const y = Math.max(-1, Math.min(1, (event.clientY - rect.top - rect.height / 2) / (rect.height * 0.5)));
  const tiltX = `${(y * -2.2).toFixed(2)}deg`;
  const tiltY = `${(x * 2.2).toFixed(2)}deg`;
  if (tiltFrame) return;
  tiltFrame = window.requestAnimationFrame(() => {
    device.style.transform = `rotateX(${tiltX}) rotateY(${tiltY})`;
    tiltFrame = 0;
  });
};

gestureSurface?.addEventListener('pointermove', updatePhoneTilt, { passive: true });
gestureSurface?.addEventListener('pointerleave', resetPhoneTilt, { passive: true });
gestureSurface?.addEventListener('pointercancel', resetPhoneTilt, { passive: true });
precisionPointer.addEventListener?.('change', (event) => {
  if (!event.matches) resetPhoneTilt();
});

// Keep the phone legible on slow or offline previews. The CSS fallback is
// visible until the exact transparent status strip has decoded.
const markStatusReady = () => {
  statusBar?.classList.add('is-ready');
  statusBar?.querySelector<HTMLElement>('.iphone-status-fallback')?.style.setProperty('opacity', '0');
};
statusImage?.addEventListener('load', markStatusReady, { once: true });
statusImage?.addEventListener('error', () => statusBar?.classList.add('is-fallback'), { once: true });
if (statusImage?.complete) {
  if (statusImage.naturalWidth > 0) markStatusReady();
  else statusBar?.classList.add('is-fallback');
}
if (statusImage) void statusImage.decode?.().catch(() => undefined);

const frameDevice = frameImage?.closest<HTMLElement>('[data-phone-device]');
let frameRevealScheduled = false;
const setFrameBusy = (busy: boolean) => {
  gestureSurface?.setAttribute('aria-busy', String(busy));
  frameDevice?.setAttribute('aria-busy', String(busy));
};
setFrameBusy(true);
const markFrameReady = () => {
  if (frameRevealScheduled && frameDevice?.dataset.frameState === 'ready') return;
  frameDevice?.setAttribute('data-frame-state', 'ready');
  setFrameBusy(false);
};
const markFrameFailed = () => {
  frameRevealScheduled = false;
  setFrameBusy(false);
};
const revealFrameAfterDecode = () => {
  if (!frameImage || frameRevealScheduled) return;
  if (!frameImage.naturalWidth) {
    markFrameFailed();
    return;
  }
  frameRevealScheduled = true;
  const decoded = typeof frameImage.decode === 'function' ? frameImage.decode() : Promise.resolve();
  void decoded.catch(() => undefined).then(() => {
    requestAnimationFrame(markFrameReady);
  });
};
frameImage?.addEventListener('load', revealFrameAfterDecode, { once: true });
frameImage?.addEventListener('error', markFrameFailed, { once: true });
if (frameImage?.complete) {
  if (frameImage.naturalWidth > 0) revealFrameAfterDecode();
  else markFrameFailed();
}

const selectState = (control: HTMLButtonElement, moveFocus = false) => {
  const state = control.dataset.phoneState;
  if (!state || screen?.dataset.state === state) return;

  window.clearTimeout(writeTimer);
  controls.forEach((item) => {
    const selected = item === control;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  views.forEach((view) => {
    const selected = view.dataset.phoneView === state;
    view.classList.toggle('is-active', selected);
    view.setAttribute('aria-hidden', String(!selected));
  });
  if (screen) {
    screen.dataset.state = state;
    screen.classList.remove('is-writing');
    if (!reduceMotion.matches) requestAnimationFrame(() => screen.classList.add('is-writing'));
  }
  if (device) device.dataset.state = state;
  if (status) status.textContent = control.dataset.phoneTitle ?? '';
  if (moveFocus) control.focus();
  writeTimer = window.setTimeout(() => screen?.classList.remove('is-writing'), 560);
};

controls.forEach((control, index) => {
  control.addEventListener('click', () => selectState(control));
  control.addEventListener('keydown', (event) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const backwards = event.key === 'ArrowUp' || event.key === 'ArrowLeft';
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1 : (index + (backwards ? -1 : 1) + controls.length) % controls.length;
    const next = controls[nextIndex];
    if (next) selectState(next, true);
  });
});

const selectHashState = () => {
  const targetState = window.location.hash === '#ecosystem-library' ? 'library' : '';
  const control = controls.find((item) => `#${item.id}` === window.location.hash || item.dataset.phoneState === targetState);
  if (!control) return;
  selectState(control);
};

selectHashState();
window.addEventListener('hashchange', selectHashState);

const selectAutomationExample = (control: HTMLButtonElement, moveFocus = false) => {
  const automateControl = controls.find((item) => item.dataset.phoneState === 'automate');
  const alreadyAutomating = screen?.dataset.state === 'automate';

  automationExamples.forEach((item) => {
    const selected = item === control;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
  if (automationFrameTitle) automationFrameTitle.textContent = control.dataset.automationTitle ?? '';
  if (automationFrameTime) automationFrameTime.textContent = control.dataset.automationTime ?? '';
  if (automateControl) selectState(automateControl);

  if (alreadyAutomating && screen && !reduceMotion.matches) {
    window.clearTimeout(writeTimer);
    screen.classList.remove('is-writing');
    requestAnimationFrame(() => screen.classList.add('is-writing'));
    writeTimer = window.setTimeout(() => screen.classList.remove('is-writing'), 560);
  }
  if (moveFocus) control.focus();
};

automationExamples.forEach((control, index) => {
  control.addEventListener('click', () => selectAutomationExample(control));
  control.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? automationExamples.length - 1
        : (index + (event.key === 'ArrowLeft' ? -1 : 1) + automationExamples.length) % automationExamples.length;
    const next = automationExamples[nextIndex];
    if (next) selectAutomationExample(next, true);
  });
});

gestureSurface?.addEventListener('touchstart', (event) => {
  const touch = event.touches[0];
  if (!touch) return;
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

gestureSurface?.addEventListener('touchend', (event) => {
  const touch = event.changedTouches[0];
  if (!touch) return;
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  if (Math.abs(deltaX) < 38 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;

  const activeIndex = Math.max(0, controls.findIndex((control) => control.classList.contains('active')));
  const nextIndex = Math.min(controls.length - 1, Math.max(0, activeIndex + (deltaX < 0 ? 1 : -1)));
  const next = controls[nextIndex];
  if (next && nextIndex !== activeIndex) selectState(next);
}, { passive: true });
