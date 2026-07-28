export {};

const loadNear = (selector: string, loader: () => Promise<unknown>, rootMargin = '600px') => {
  const target = document.querySelector(selector);
  if (!target) return;
  if (!('IntersectionObserver' in window)) { void loader(); return; }
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return;
    observer.disconnect();
    void loader();
  }, { rootMargin, threshold: 0 });
  observer.observe(target);
};

let epaperShowcase: Promise<unknown> | undefined;
const loadEpaperShowcase = () => epaperShowcase ??= import('./epaperShowcase');

loadNear('.palette', loadEpaperShowcase, '450px');
loadNear('.dither-studio', loadEpaperShowcase, '500px');
loadNear('#motion', () => Promise.all([import('./heroSketch'), import('./interactiveScreen')]), '700px');
loadNear('[data-epaper-pipeline]', () => import('./epaperPipeline'), '500px');

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  void import('./hardwareCubes');
} else {
  loadNear('.hardware-grid', () => import('./hardwareCubes'), '900px');
}
