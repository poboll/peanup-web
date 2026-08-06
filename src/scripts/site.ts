const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode]'));
const modeScreen = document.querySelector<HTMLElement>('#mode-screen');
const title = document.querySelector<HTMLElement>('#screen-title');
const meta = document.querySelector<HTMLElement>('#screen-meta');

document.querySelectorAll<HTMLElement>('[data-progressive-image]').forEach((picture) => {
  const image = picture.querySelector<HTMLImageElement>('img');
  if (!image) return;
  const reveal = () => {
    if (image.naturalWidth > 0) picture.classList.add('is-loaded');
  };
  image.addEventListener('load', reveal, { once: true });
  if (image.complete) reveal();
});

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
const smoothAnchorLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-smooth-anchor]'));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const anchorChromeOffset = () => {
  const productHeader = document.querySelector<HTMLElement>('.site-header');
  if (productHeader) return productHeader.getBoundingClientRect().height;

  const docsHeader = document.querySelector<HTMLElement>('.docs-topbar');
  if (!docsHeader) return 0;
  const mobileToc = document.querySelector<HTMLElement>('.docs-toc-mobile');
  const tocVisible = mobileToc && getComputedStyle(mobileToc).display !== 'none';
  return docsHeader.getBoundingClientRect().height + (tocVisible ? mobileToc.getBoundingClientRect().height : 0);
};

const animateToAnchor = (link: HTMLAnchorElement, duration: number) => {
  const href = link.getAttribute('href');
  if (!href?.startsWith('#')) return;
  const target = document.querySelector<HTMLElement>(href);
  if (!target) return;

  const start = window.scrollY;
  // The global header is fixed and shrinks after the first scroll. Leave a
  // small reading gap so chapter labels and the mobile journey tabs never
  // land underneath the chrome when a user follows a deep link.
  const headerOffset = anchorChromeOffset();
  const destination = target.getBoundingClientRect().top + start - headerOffset - 12;
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

smoothAnchorLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    animateToAnchor(link, 1100);
  });
});

document.querySelectorAll<HTMLAnchorElement>('[data-locale-choice]').forEach((link) => {
  link.addEventListener('click', () => {
    const locale = link.dataset.localeChoice;
    if (!locale) return;
    try {
      localStorage.setItem('peanup.locale', locale);
    } catch {}
  });
});

const restoreInitialAnchor = () => {
  const initialHash = document.documentElement.dataset.initialHash;
  const requestedHash = location.hash || (initialHash ? `#${initialHash}` : '');
  if (!requestedHash || requestedHash === '#top') return;
  let id = requestedHash.slice(1);
  try { id = decodeURIComponent(id); } catch {}
  const target = document.getElementById(id);
  if (!target) return;

  let cancelled = false;
  const cancel = () => { cancelled = true; };
  window.addEventListener('pointerdown', cancel, { once: true, capture: true });
  window.addEventListener('wheel', cancel, { once: true, passive: true });

  const align = () => {
    const currentHash = location.hash || (document.documentElement.dataset.initialHash ? `#${document.documentElement.dataset.initialHash}` : '');
    let currentId = currentHash.slice(1);
    try { currentId = decodeURIComponent(currentId); } catch {}
    if (cancelled || currentId !== id) return;
    const headerOffset = anchorChromeOffset();
    const offset = target.getBoundingClientRect().top - headerOffset - 12;
    if (Math.abs(offset) < 2) return;
    const previous = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, window.scrollY + offset);
    document.documentElement.style.scrollBehavior = previous;
  };

  const restoreHash = () => {
    delete document.documentElement.dataset.initialHash;
    history.scrollRestoration = 'auto';
  };

  requestAnimationFrame(() => requestAnimationFrame(align));
  const alignAfterLoad = () => {
    [0, 140, 320, 620, 980, 1420].forEach((delay, index) => {
      window.setTimeout(() => {
        align();
        if (index === 5) restoreHash();
      }, delay);
    });
  };
  if (document.readyState === 'complete') alignAfterLoad();
  else window.addEventListener('load', alignAfterLoad, { once: true });
};

restoreInitialAnchor();
