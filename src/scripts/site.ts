const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode]'));
const modeScreen = document.querySelector<HTMLElement>('#mode-screen');
const title = document.querySelector<HTMLElement>('#screen-title');
const meta = document.querySelector<HTMLElement>('#screen-meta');

const activateMode = (tab: HTMLButtonElement, moveFocus = false) => {
  tabs.forEach((item) => {
    const selected = item === tab;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });

  if (modeScreen) {
    modeScreen.className = `device-screen screen-${tab.dataset.mode}`;
    modeScreen.setAttribute('aria-labelledby', tab.id);
  }
  if (title) title.textContent = tab.dataset.title ?? '';
  if (meta) meta.textContent = tab.dataset.meta ?? '';
  if (moveFocus) tab.focus();
};

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateMode(tab));
  tab.addEventListener('keydown', (event) => {
    const key = event.key;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const previous = key === 'ArrowLeft' || key === 'ArrowUp';
    const nextIndex = key === 'Home'
      ? 0
      : key === 'End'
        ? tabs.length - 1
        : (index + (previous ? -1 : 1) + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    if (nextTab) activateMode(nextTab, true);
  });
});

const scrollCue = document.querySelector<HTMLAnchorElement>('.scroll-cue');
const continueBrowsing = document.querySelector<HTMLAnchorElement>('[data-continue-browsing]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const animateToAnchor = (link: HTMLAnchorElement, duration: number) => {
  const href = link.getAttribute('href');
  if (!href?.startsWith('#')) return;
  const target = document.querySelector<HTMLElement>(href);
  if (!target) return;

  const start = window.scrollY;
  const destination = target.getBoundingClientRect().top + start;
  const animationDuration = reduceMotion.matches ? 1 : duration;
  const startedAt = performance.now();
  document.documentElement.classList.add('slow-scroll-active');
  const easeInOutCubic = (progress: number) => progress < .5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

  const step = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / animationDuration);
    window.scrollTo(0, start + (destination - start) * easeInOutCubic(progress));
    if (progress < 1) requestAnimationFrame(step);
    else {
      document.documentElement.classList.remove('slow-scroll-active');
      history.replaceState(null, '', href);
    }
  };

  requestAnimationFrame(step);
};

scrollCue?.addEventListener('click', (event) => {
  event.preventDefault();
  animateToAnchor(scrollCue, 1450);
});

continueBrowsing?.addEventListener('click', (event) => {
  event.preventDefault();
  animateToAnchor(continueBrowsing, 1100);
});

const languageMenu = document.querySelector<HTMLDetailsElement>('.language-menu');
document.querySelectorAll<HTMLAnchorElement>('[data-locale-choice]').forEach((link) => {
  link.addEventListener('click', () => {
    const locale = link.dataset.localeChoice;
    if (!locale) return;
    try {
      localStorage.setItem('peanup.locale', locale);
    } catch {}
  });
});

document.addEventListener('pointerdown', (event) => {
  if (languageMenu?.open && !languageMenu.contains(event.target as Node)) languageMenu.open = false;
});
