const header = document.querySelector<HTMLElement>('.site-header');
const backToTop = document.querySelector<HTMLButtonElement>('.back-to-top');
const root = document.documentElement;
const chromeReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
const themeToggles = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
const disclosureMenus = [...document.querySelectorAll<HTMLDetailsElement>('.language-menu, .docs-mobile-nav, .docs-more-nav')];
const chapterLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-chapter-link]')];
let themeTransitioning = false;
let chromeFrame = 0;


document.querySelectorAll<HTMLImageElement>('img').forEach((image) => { image.draggable = false; });

const isProtectedMediaTarget = (target: EventTarget | null) => target instanceof Element
  && Boolean(target.closest('img, picture, .protected-media'));

document.addEventListener('dragstart', (event) => {
  if (isProtectedMediaTarget(event.target)) event.preventDefault();
}, { capture: true });

document.addEventListener('contextmenu', (event) => {
  if (isProtectedMediaTarget(event.target)) event.preventDefault();
}, { capture: true });

const closeDisclosureMenus = (except?: Node | null, restoreFocus = false) => {
  disclosureMenus.forEach((menu) => {
    if (!menu.open || (except && menu.contains(except))) return;
    menu.open = false;
    if (restoreFocus) menu.querySelector<HTMLElement>('summary')?.focus();
  });
};

document.addEventListener('pointerdown', (event) => closeDisclosureMenus(event.target as Node));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeDisclosureMenus(null, true);
});
window.addEventListener('pageshow', () => closeDisclosureMenus());

type Theme = 'light' | 'dark';

const storedTheme = (): Theme | null => {
  try {
    const value = localStorage.getItem('peanup.theme');
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
};

const updateThemeControls = (theme: Theme) => {
  const isDark = theme === 'dark';
  themeToggles.forEach((toggle) => {
    const label = isDark ? toggle.dataset.labelLight : toggle.dataset.labelDark;
    toggle.setAttribute('aria-pressed', String(isDark));
    if (label) {
      toggle.setAttribute('aria-label', label);
      toggle.title = label;
    }
  });
};

const applyTheme = (theme: Theme, persist = false) => {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#10110f' : '#ffffff');
  updateThemeControls(theme);
  if (persist) {
    try {
      localStorage.setItem('peanup.theme', theme);
    } catch {}
  }
};

const waitForPaint = () => new Promise<void>((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
});
const waitForThemeFade = () => new Promise<void>((resolve) => window.setTimeout(resolve, 560));

let heroImageDecode: Promise<void> | null = null;
const decodeHeroImage = () => {
  if (heroImageDecode) return heroImageDecode;
  heroImageDecode = (async () => {
    const images = [...document.querySelectorAll<HTMLImageElement>('.hero-product img')];
    await Promise.all(images.map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        });
      }
      try { await image.decode(); } catch {}
    }));
  })();
  return heroImageDecode;
};

const decodeThemeAssets = () => decodeHeroImage();

// Warm both exact-resolution bitmaps during the first paint window, without an
// HTML preload that reports as unused for visitors who stay in the light theme.
void decodeThemeAssets();

const setThemeControlsBusy = (busy: boolean) => {
  themeToggles.forEach((toggle) => {
    toggle.toggleAttribute('disabled', busy);
    toggle.setAttribute('aria-busy', String(busy));
  });
};

const switchThemeWithReveal = async (theme: Theme) => {
  if (themeTransitioning) return;

  themeTransitioning = true;
  setThemeControlsBusy(true);
  root.classList.add('theme-is-transitioning');

  try {
    // Decode both target layers before starting the local write transition.
    await decodeThemeAssets();

    // Do not use a root View Transition here. Chromium resamples the full
    // document snapshot, which can make the fixed-ratio hero appear to zoom by
    // a pixel. A local e-paper write on the two already-decoded image layers
    // keeps the product geometry exact while the surrounding palette fades.
    root.classList.add('theme-fade-transition');
    applyTheme(theme, true);
    await waitForPaint();
    await waitForThemeFade();
  } catch {
    applyTheme(theme, true);
  } finally {
    root.classList.remove('theme-fade-transition');
    root.classList.remove('theme-is-transitioning');
    setThemeControlsBusy(false);
    themeTransitioning = false;
  }
};

const updatePageChrome = () => {
  header?.classList.toggle('scrolled', window.scrollY > 32);
  backToTop?.classList.toggle('visible', window.scrollY > window.innerHeight * .72);
  const scrollable = root.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
  root.style.setProperty('--page-progress', String(progress));
};

const scheduleChromeUpdate = () => {
  if (chromeFrame) return;
  chromeFrame = window.requestAnimationFrame(() => {
    chromeFrame = 0;
    updatePageChrome();
  });
};

if (chapterLinks.length > 0 && 'IntersectionObserver' in window) {
  const chapterObserver = new IntersectionObserver((entries) => {
    const current = entries.find((entry) => entry.isIntersecting);
    if (!current) return;
    chapterLinks.forEach((link) => {
      link.ariaCurrent = link.dataset.chapterLink === current.target.id ? 'location' : null;
    });
  }, { rootMargin: '-18% 0px -70% 0px', threshold: 0 });

  chapterLinks.forEach((link) => {
    const id = link.dataset.chapterLink;
    const target = id ? document.getElementById(id) : null;
    if (target) chapterObserver.observe(target);
  });
}

const animateToTop = () => {
  const start = window.scrollY;
  if (start <= 0) return;
  const duration = chromeReduceMotion.matches ? 1 : 1100;
  const startedAt = performance.now();
  root.classList.add('slow-scroll-active');

  const step = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 4);
    window.scrollTo(0, start * (1 - eased));
    if (progress < 1) requestAnimationFrame(step);
    else root.classList.remove('slow-scroll-active');
  };

  requestAnimationFrame(step);
};

window.addEventListener('scroll', scheduleChromeUpdate, { passive: true });
backToTop?.addEventListener('click', animateToTop);
themeToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const current = root.dataset.theme === 'dark' ? 'dark' : 'light';
    void switchThemeWithReveal(current === 'dark' ? 'light' : 'dark');
  });
});
systemTheme.addEventListener('change', (event) => {
  if (!storedTheme()) applyTheme(event.matches ? 'dark' : 'light');
});
applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
updatePageChrome();
