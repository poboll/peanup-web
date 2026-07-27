const hardwareGrid = document.querySelector<HTMLElement>('.hardware-grid');
const hardwareCubes = Array.from(document.querySelectorAll<HTMLElement>('[data-hardware-cube]'));

if (hardwareGrid && hardwareCubes.length) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  hardwareCubes.forEach((cube) => {
    cube.addEventListener('click', () => {
      const flipped = !cube.classList.contains('is-flipped');
      hardwareCubes.forEach((item) => { item.classList.remove('is-flipped'); item.setAttribute('aria-pressed', 'false'); });
      cube.classList.toggle('is-flipped', flipped);
      cube.setAttribute('aria-pressed', String(flipped));
    });
    cube.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      cube.click();
    });
  });

  if (!reducedMotion) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      hardwareGrid.classList.add('is-entering');
      observer.disconnect();
    }, { threshold: .35 });
    observer.observe(hardwareGrid);
  }
}

export {};
