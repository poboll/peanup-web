export {};

const loadNear = (selector: string, loader: () => Promise<unknown>, rootMargin = '600px') => {
  const target = document.querySelector(selector);
  if (!target) return;
  let loaded = false;
  let observer: IntersectionObserver | undefined;
  const margin = Number.parseInt(rootMargin, 10) || 600;
  const load = () => {
    if (loaded) return;
    loaded = true;
    observer?.disconnect();
    window.removeEventListener('scroll', check, { capture: false });
    void loader().catch(() => undefined);
  };
  const check = () => {
    const rect = target.getBoundingClientRect();
    if (rect.top <= window.innerHeight + margin && rect.bottom >= -margin) load();
  };
  if (!('IntersectionObserver' in window)) { load(); return; }
  observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return;
    load();
  }, { rootMargin, threshold: 0 });
  observer.observe(target);
  // IntersectionObserver can miss a target after an anchor jump while a
  // content-visibility section is being promoted. The geometry check is
  // passive and only runs during scroll, so it does not affect idle cost.
  window.addEventListener('scroll', check, { passive: true });
  requestAnimationFrame(check);
};

let epaperShowcase: Promise<typeof import('./epaperShowcase')> | undefined;
const loadEpaperShowcase = () => epaperShowcase ??= import('./epaperShowcase');

loadNear('.palette', async () => { (await loadEpaperShowcase()).renderPigments(); }, '450px');
loadNear('.dither-studio', async () => { (await import('./ditherShowcase')).renderDithers(); }, '500px');
// The stage ships a complete static first frame, so the animation can warm one
// viewport ahead without joining the mobile critical path.
loadNear('[data-epaper-pipeline]', () => import('./epaperPipeline'), '500px');
// The phone preview is a primary interaction. Start its small controller
// after the first paint so anchor jumps cannot outrun the observer, while
// keeping it out of the critical HTML and CSS path.
if (document.querySelector('#ecosystem')) {
  window.setTimeout(() => { void import('./phoneShowcase').catch(() => undefined); }, 0);
}
// The motion stage also ships a complete CSS/HTML first frame. Begin the
// canvas pair after that frame can paint; this is more reliable than an
// observer alone when the user lands on #motion or the section is promoted by
// content-visibility during a fast scroll.
if (document.querySelector('#motion')) {
  window.setTimeout(() => {
    void Promise.all([import('./heroSketch'), import('./interactiveScreen')]).catch(() => undefined);
  }, 0);
}

const warmImagesNear = (selector: string) => {
  const targets = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (targets.length === 0) return;
  const warm = (target: HTMLElement) => {
    target.querySelectorAll<HTMLSourceElement>('source[data-srcset]').forEach((source) => {
      const srcset = source.dataset.srcset;
      if (!srcset) return;
      source.srcset = srcset;
      source.removeAttribute('data-srcset');
    });
    target.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((img) => {
      const src = img.dataset.src;
      if (!src) return;
      img.src = src;
      img.removeAttribute('data-src');
    });
    target.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => {
      img.loading = 'eager';
      img.fetchPriority = 'auto';
      if (img.complete && img.naturalWidth > 0) return;
      void img.decode().catch(() => undefined);
    });
  };

  if (!('IntersectionObserver' in window)) {
    targets.forEach(warm);
    return;
  }

  const lead = Math.min(3600, Math.max(1800, Math.round(window.innerHeight * 3.5)));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      warm(entry.target as HTMLElement);
    });
  }, { rootMargin: `${lead}px 0px`, threshold: 0 });

  let initialTarget: HTMLElement | null = null;
  if (location.hash) {
    let id = location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch {}
    initialTarget = document.getElementById(id);
  }

  targets.forEach((target) => {
    if (initialTarget && (target === initialTarget || target.contains(initialTarget))) {
      warm(target);
      return;
    }
    observer.observe(target);
  });
};

warmImagesNear('[data-image-warmup]');

// Reduced motion changes the cube presentation in CSS, not when the controls
// are needed. Keep their interaction code off the critical path in both modes.
loadNear('.hardware-grid', () => import('./hardwareCubes'), '900px');
