const header = document.querySelector<HTMLElement>('.site-header');
const backToTop = document.querySelector<HTMLButtonElement>('.back-to-top');
const chromeReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
const themeToggles = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
const themeCurtain = document.querySelector<HTMLElement>('[data-theme-curtain]');
let themeTransitioning = false;

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

const updateThemeMedia = (theme: Theme) => {
  const key = theme === 'dark' ? 'dark' : 'light';
  document.querySelectorAll<HTMLSourceElement>('[data-theme-source]').forEach((source) => {
    const next = source.dataset[`${key}Srcset`];
    if (next && source.srcset !== next) source.srcset = next;
  });
  document.querySelectorAll<HTMLImageElement>('[data-theme-image]').forEach((image) => {
    const next = image.dataset[`${key}Src`];
    if (next && image.getAttribute('src') !== next) image.src = next;
  });
};

const applyTheme = (theme: Theme, persist = false) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#10110f' : '#ffffff');
  updateThemeControls(theme);
  updateThemeMedia(theme);
  if (persist) {
    try {
      localStorage.setItem('peanup.theme', theme);
    } catch {}
  }
};

const waitForPaint = () => new Promise<void>((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
});

const setThemeControlsBusy = (busy: boolean) => {
  themeToggles.forEach((toggle) => {
    toggle.toggleAttribute('disabled', busy);
    toggle.setAttribute('aria-busy', String(busy));
  });
};

const switchThemeWithCurtain = async (theme: Theme) => {
  if (themeTransitioning) return;
  if (chromeReduceMotion.matches || !themeCurtain || typeof themeCurtain.animate !== 'function') {
    applyTheme(theme, true);
    return;
  }

  themeTransitioning = true;
  setThemeControlsBusy(true);
  document.documentElement.classList.add('theme-is-transitioning');
  themeCurtain.classList.add('is-active');

  try {
    const cover = themeCurtain.animate(
      [
        { transform: 'translate3d(0, -100%, 0)' },
        { transform: 'translate3d(0, 0, 0)' },
      ],
      { duration: 540, easing: 'cubic-bezier(.76, 0, .24, 1)', fill: 'forwards' },
    );
    await cover.finished;

    applyTheme(theme, true);
    await waitForPaint();

    cover.cancel();
    const reveal = themeCurtain.animate(
      [
        { transform: 'translate3d(0, 0, 0)' },
        { transform: 'translate3d(0, 100%, 0)' },
      ],
      { duration: 680, easing: 'cubic-bezier(.76, 0, .24, 1)', fill: 'forwards' },
    );
    await reveal.finished;
    reveal.cancel();
  } finally {
    themeCurtain.classList.remove('is-active');
    document.documentElement.classList.remove('theme-is-transitioning');
    setThemeControlsBusy(false);
    themeTransitioning = false;
  }
};

const updatePageChrome = () => {
  header?.classList.toggle('scrolled', window.scrollY > 32);
  backToTop?.classList.toggle('visible', window.scrollY > window.innerHeight * .72);
};

const animateToTop = () => {
  const start = window.scrollY;
  if (start <= 0) return;
  const duration = chromeReduceMotion.matches ? 1 : 1100;
  const startedAt = performance.now();
  document.documentElement.classList.add('slow-scroll-active');

  const step = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 4);
    window.scrollTo(0, start * (1 - eased));
    if (progress < 1) requestAnimationFrame(step);
    else document.documentElement.classList.remove('slow-scroll-active');
  };

  requestAnimationFrame(step);
};

window.addEventListener('scroll', updatePageChrome, { passive: true });
backToTop?.addEventListener('click', animateToTop);
themeToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    void switchThemeWithCurtain(current === 'dark' ? 'light' : 'dark');
  });
});
systemTheme.addEventListener('change', (event) => {
  if (!storedTheme()) applyTheme(event.matches ? 'dark' : 'light');
});
applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
updatePageChrome();
