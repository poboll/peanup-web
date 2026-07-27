const header = document.querySelector<HTMLElement>('.site-header');
const backToTop = document.querySelector<HTMLButtonElement>('.back-to-top');
const chromeReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const updatePageChrome = () => {
  header?.classList.toggle('scrolled', window.scrollY > 32);
  backToTop?.classList.toggle('visible', window.scrollY > window.innerHeight * .72);
};

const animateToTop = () => {
  const start = window.scrollY;
  if (start <= 0) return;
  const duration = chromeReduceMotion.matches ? 700 : 1250;
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
updatePageChrome();
