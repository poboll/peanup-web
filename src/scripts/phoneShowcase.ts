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

// Keep the phone legible on slow or offline previews. The real status-bar
// asset remains the source of truth; this only supplies a tiny local fallback
// instead of leaving an empty strip in the device mockup.
statusImage?.addEventListener('error', () => statusBar?.classList.add('is-fallback'), { once: true });
if (statusImage?.complete && statusImage.naturalWidth === 0) statusBar?.classList.add('is-fallback');

const markFrameReady = () => frameImage?.closest<HTMLElement>('[data-phone-device]')?.setAttribute('data-frame-ready', 'true');
frameImage?.addEventListener('load', markFrameReady, { once: true });
if (frameImage?.complete && frameImage.naturalWidth > 0) markFrameReady();

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
