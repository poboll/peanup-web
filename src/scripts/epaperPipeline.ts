const pipeline = document.querySelector<HTMLElement>('[data-epaper-pipeline]');
const preview = pipeline?.querySelector<HTMLCanvasElement>('[data-epaper-preview]');
const source = pipeline?.querySelector<HTMLImageElement>('.pipeline-source img');
const output = pipeline?.querySelector<HTMLElement>('[data-epaper-output]');
const modeLabel = pipeline?.querySelector<HTMLElement>('[data-epaper-mode-label]');

type DitherMode = 'ordered' | 'diffusion' | 'spectra';

const modeLabels: Record<DitherMode, string> = {
  ordered: 'ORDERED 8×8',
  diffusion: 'FLOYD–STEINBERG',
  spectra: 'PERCEPTUAL MIX',
};

const bayer8 = [
  [0, 48, 12, 60, 3, 51, 15, 63],
  [32, 16, 44, 28, 35, 19, 47, 31],
  [8, 56, 4, 52, 11, 59, 7, 55],
  [40, 24, 36, 20, 43, 27, 39, 23],
  [2, 50, 14, 62, 1, 49, 13, 61],
  [34, 18, 46, 30, 33, 17, 45, 29],
  [10, 58, 6, 54, 9, 57, 5, 53],
  [42, 26, 38, 22, 41, 25, 37, 21],
] as const;

const palette = [
  [31, 34, 38],
  [216, 222, 216],
  [35, 63, 142],
  [53, 86, 58],
  [98, 32, 30],
  [193, 187, 30],
] as const;

const nearest = (r: number, g: number, b: number, perceptual = false) => {
  let best: readonly [number, number, number] = palette[0];
  let distance = Number.POSITIVE_INFINITY;
  for (const color of palette) {
    const dr = r - color[0];
    const dg = g - color[1];
    const db = b - color[2];
    const next = perceptual
      ? dr * dr * .27 + dg * dg * .66 + db * db * .07
      : dr * dr * .3 + dg * dg * .59 + db * db * .11;
    if (next < distance) { best = color; distance = next; }
  }
  return best;
};

const render = () => {
  if (!preview || !source || !source.complete || !source.naturalWidth) return;
  const requestedMode = pipeline?.dataset.ditherMode as DitherMode | undefined;
  const mode: DitherMode = requestedMode && modeLabels[requestedMode] ? requestedMode : 'diffusion';
  const scale = Math.min(1, 960 / source.naturalWidth);
  const width = Math.max(1, Math.round(source.naturalWidth * scale));
  const height = Math.max(1, Math.round(source.naturalHeight * scale));
  preview.width = width;
  preview.height = height;
  const context = preview.getContext('2d', { willReadFrequently: true });
  if (!context) return;

  context.drawImage(source, 0, 0, source.naturalWidth, source.naturalHeight, 0, 0, width, height);

  const image = context.getImageData(0, 0, width, height);
  const histogram = new Uint32Array(256);
  for (let index = 0; index < image.data.length; index += 4) {
    const luminance = Math.round(image.data[index] * .2126 + image.data[index + 1] * .7152 + image.data[index + 2] * .0722);
    histogram[luminance] += 1;
  }
  const pixels = width * height;
  const percentile = (target: number) => {
    let total = 0;
    for (let value = 0; value < histogram.length; value += 1) {
      total += histogram[value];
      if (total >= pixels * target) return value;
    }
    return 255;
  };
  const blackPoint = Math.min(28, percentile(.01));
  const whitePoint = Math.max(232, percentile(.995));
  const range = Math.max(1, whitePoint - blackPoint);
  for (let index = 0; index < image.data.length; index += 4) {
    for (let channel = 0; channel < 3; channel += 1) {
      const normalized = Math.max(0, Math.min(1, (image.data[index + channel] - blackPoint) / range));
      image.data[index + channel] = 10 + Math.pow(normalized, 1.02) * 235;
    }
  }
  const data = new Float32Array(image.data);
  for (let y = 0; y < height; y += 1) {
    const reverse = y % 2 === 1;
    for (let step = 0; step < width; step += 1) {
      const x = reverse ? width - 1 - step : step;
      const index = (y * width + x) * 4;
      const threshold = mode === 'ordered' ? (bayer8[y % 8][x % 8] / 63 - .5) * 34 : 0;
      const old = [data[index] + threshold, data[index + 1] + threshold, data[index + 2] + threshold];
      const color = nearest(old[0], old[1], old[2], mode === 'spectra');
      image.data[index] = color[0]; image.data[index + 1] = color[1]; image.data[index + 2] = color[2];
      if (mode === 'ordered') continue;
      const strength = mode === 'spectra' ? .58 : 1;
      const error = [(old[0] - color[0]) * strength, (old[1] - color[1]) * strength, (old[2] - color[2]) * strength];
      const spread = (dx: number, dy: number, weight: number) => {
        const nx = x + (reverse ? -dx : dx); const ny = y + dy;
        if (nx < 0 || nx >= width || ny >= height) return;
        const target = (ny * width + nx) * 4;
        for (let channel = 0; channel < 3; channel += 1) data[target + channel] += error[channel] * weight;
      };
      spread(1, 0, 7 / 16); spread(-1, 1, 3 / 16); spread(0, 1, 5 / 16); spread(1, 1, 1 / 16);
    }
  }
  context.putImageData(image, 0, 0);
  output?.classList.add('is-ready');
  if (modeLabel) modeLabel.textContent = modeLabels[mode];
  if (output && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    output.classList.remove('is-refreshing');
    void output.offsetWidth;
    output.classList.add('is-refreshing');
  }
};

let renderScheduled = false;
const scheduleRender = () => {
  if (renderScheduled) return;
  renderScheduled = true;
  const run = () => {
    renderScheduled = false;
    render();
  };
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: 450 });
  else globalThis.setTimeout(run, 0);
};

if (source && preview && pipeline) {
  pipeline.addEventListener('peanup:dither-change', (event) => {
    const mode = (event as CustomEvent<{ mode?: DitherMode }>).detail?.mode;
    if (!mode || !modeLabels[mode]) return;
    pipeline.dataset.ditherMode = mode;
    render();
  });
  source.addEventListener('load', scheduleRender, { once: true });
  scheduleRender();
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return;
    pipeline.classList.add('pipeline-visible');
    observer.disconnect();
  }, { threshold: .35 });
  observer.observe(pipeline);
}

export {};
