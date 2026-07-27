const pipeline = document.querySelector<HTMLElement>('[data-epaper-pipeline]');
const preview = pipeline?.querySelector<HTMLCanvasElement>('[data-epaper-preview]');
const output = pipeline?.querySelector<HTMLCanvasElement>('[data-epaper-output]');
const source = pipeline?.querySelector<HTMLImageElement>('.pipeline-source img');

const palette = [
  [31, 34, 38],
  [216, 222, 216],
  [35, 63, 142],
  [53, 86, 58],
  [98, 32, 30],
  [193, 187, 30],
] as const;

const nearest = (r: number, g: number, b: number) => {
  let best: readonly [number, number, number] = palette[0];
  let distance = Number.POSITIVE_INFINITY;
  for (const color of palette) {
    const dr = r - color[0];
    const dg = g - color[1];
    const db = b - color[2];
    const next = dr * dr * .3 + dg * dg * .59 + db * db * .11;
    if (next < distance) { best = color; distance = next; }
  }
  return best;
};

const render = () => {
  if (!preview || !output || !source || !source.complete || !source.naturalWidth) return;
  const width = 180;
  const height = 230;
  preview.width = output.width = width;
  preview.height = output.height = height;
  const context = preview.getContext('2d', { willReadFrequently: true });
  const outputContext = output.getContext('2d');
  if (!context || !outputContext) return;

  const sourceRatio = source.naturalWidth / source.naturalHeight;
  const targetRatio = width / height;
  const cropWidth = sourceRatio > targetRatio ? source.naturalHeight * targetRatio : source.naturalWidth;
  const cropHeight = sourceRatio > targetRatio ? source.naturalHeight : source.naturalWidth / targetRatio;
  const cropX = (source.naturalWidth - cropWidth) / 2;
  const cropY = (source.naturalHeight - cropHeight) / 2;
  context.drawImage(source, cropX, cropY, cropWidth, cropHeight, 0, 0, width, height);

  const image = context.getImageData(0, 0, width, height);
  const data = new Float32Array(image.data);
  for (let y = 0; y < height; y += 1) {
    const reverse = y % 2 === 1;
    for (let step = 0; step < width; step += 1) {
      const x = reverse ? width - 1 - step : step;
      const index = (y * width + x) * 4;
      const old = [data[index], data[index + 1], data[index + 2]];
      const color = nearest(old[0], old[1], old[2]);
      image.data[index] = color[0]; image.data[index + 1] = color[1]; image.data[index + 2] = color[2];
      const error = [old[0] - color[0], old[1] - color[1], old[2] - color[2]];
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
  outputContext.imageSmoothingEnabled = false;
  outputContext.drawImage(preview, 0, 0);
};

if (source && preview && output && pipeline) {
  source.addEventListener('load', render, { once: true });
  render();
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return;
    pipeline.classList.add('pipeline-visible');
    observer.disconnect();
  }, { threshold: .35 });
  observer.observe(pipeline);
}
