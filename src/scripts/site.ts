const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode]'));
const modeScreen = document.querySelector<HTMLElement>('#mode-screen');
const title = document.querySelector<HTMLElement>('#screen-title');
const meta = document.querySelector<HTMLElement>('#screen-meta');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((item) => {
      item.classList.remove('active');
      item.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    if (!modeScreen || !title || !meta) return;
    modeScreen.className = `device-screen screen-${tab.dataset.mode}`;
    title.textContent = tab.dataset.title ?? '';
    meta.textContent = tab.dataset.meta ?? '';
  });
});

const scrollCue = document.querySelector<HTMLAnchorElement>('.scroll-cue');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

scrollCue?.addEventListener('click', (event) => {
  const href = scrollCue.getAttribute('href');
  if (!href?.startsWith('#')) return;
  const target = document.querySelector<HTMLElement>(href);
  if (!target) return;

  event.preventDefault();
  const start = window.scrollY;
  const destination = target.getBoundingClientRect().top + start;
  const duration = reduceMotion.matches ? 900 : 1800;
  const startedAt = performance.now();
  document.documentElement.classList.add('slow-scroll-active');
  const easeInOutCubic = (progress: number) => progress < .5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

  const step = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    window.scrollTo(0, start + (destination - start) * easeInOutCubic(progress));
    if (progress < 1) requestAnimationFrame(step);
    else {
      document.documentElement.classList.remove('slow-scroll-active');
      history.replaceState(null, '', href);
    }
  };

  requestAnimationFrame(step);
});
