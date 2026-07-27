export {};

const palette = {
  black: [31,34,38], white: [216,222,216], blue: [35,63,142],
  green: [53,86,58], red: [98,32,30], yellow: [193,187,30],
} as const;
const colors = Object.values(palette);

const nearest = (r: number, g: number, b: number, perceptual = false) => {
  let result: readonly [number, number, number] = colors[0];
  let distance = Infinity;
  for (const color of colors) {
    const dr = r - color[0]; const dg = g - color[1]; const db = b - color[2];
    const next = perceptual ? dr * dr * .27 + dg * dg * .66 + db * db * .07 : dr * dr + dg * dg + db * db;
    if (next < distance) { result = color; distance = next; }
  }
  return result;
};

document.querySelectorAll<HTMLCanvasElement>('[data-pigment]').forEach((canvas, canvasIndex) => {
  const context = canvas.getContext('2d');
  const color = palette[canvas.dataset.pigment as keyof typeof palette];
  if (!context || !color) return;
  canvas.width = 240; canvas.height = 150;
  const image = context.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const index = (y * canvas.width + x) * 4;
      const hash = ((x * 17 + y * 31 + canvasIndex * 47) % 29) / 29 - .5;
      const fiber = Math.sin(y * .31 + Math.sin(x * .025) * 2.2) * 1.8;
      const illumination = Math.sin(x / canvas.width * Math.PI) * 2.4;
      for (let channel = 0; channel < 3; channel += 1) image.data[index + channel] = Math.max(0, Math.min(255, color[channel] + hash * 7 + fiber + illumination));
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
});

const makeSource = (context: CanvasRenderingContext2D, width: number, height: number) => {
  const sky = context.createLinearGradient(0, 0, width, height);
  sky.addColorStop(0, '#c9d7e6'); sky.addColorStop(.55, '#f2dec5'); sky.addColorStop(1, '#f0eee7');
  context.fillStyle = sky; context.fillRect(0, 0, width, height);
  context.fillStyle = '#e7bd38'; context.beginPath(); context.arc(width * .78, height * .28, height * .17, 0, Math.PI * 2); context.fill();
  context.fillStyle = '#619169'; context.beginPath(); context.moveTo(0, height * .68); context.quadraticCurveTo(width * .25, height * .3, width * .52, height * .7); context.quadraticCurveTo(width * .75, height * .43, width, height * .66); context.lineTo(width, height); context.lineTo(0, height); context.fill();
  context.fillStyle = '#436eaa'; context.beginPath(); context.moveTo(0, height * .78); context.quadraticCurveTo(width * .32, height * .6, width * .58, height * .79); context.quadraticCurveTo(width * .8, height * .67, width, height * .75); context.lineTo(width, height); context.lineTo(0, height); context.fill();
  context.fillStyle = '#ba5148'; context.fillRect(width * .12, height * .18, width * .08, height * .42);
};

const process = (canvas: HTMLCanvasElement, mode: string) => {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;
  canvas.width = 360; canvas.height = 120;
  makeSource(context, canvas.width, canvas.height);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const work = new Float32Array(image.data);
  const bayer = [[0,48,12,60,3,51,15,63],[32,16,44,28,35,19,47,31],[8,56,4,52,11,59,7,55],[40,24,36,20,43,27,39,23],[2,50,14,62,1,49,13,61],[34,18,46,30,33,17,45,29],[10,58,6,54,9,57,5,53],[42,26,38,22,41,25,37,21]];
  for (let y = 0; y < canvas.height; y += 1) {
    const reverse = y % 2 === 1;
    for (let step = 0; step < canvas.width; step += 1) {
      const x = reverse ? canvas.width - step - 1 : step;
      const index = (y * canvas.width + x) * 4;
      const threshold = mode === 'ordered' ? (bayer[y % 8][x % 8] / 63 - .5) * 34 : 0;
      const old = [work[index] + threshold, work[index + 1] + threshold, work[index + 2] + threshold];
      const color = nearest(old[0], old[1], old[2], mode === 'spectra');
      image.data[index] = color[0]; image.data[index + 1] = color[1]; image.data[index + 2] = color[2]; image.data[index + 3] = 255;
      if (mode === 'ordered') continue;
      const strength = mode === 'spectra' ? .58 : 1;
      const error = [(old[0] - color[0]) * strength, (old[1] - color[1]) * strength, (old[2] - color[2]) * strength];
      const spread = (dx: number, dy: number, weight: number) => {
        const nx = x + (reverse ? -dx : dx); const ny = y + dy;
        if (nx < 0 || nx >= canvas.width || ny >= canvas.height) return;
        const target = (ny * canvas.width + nx) * 4;
        for (let channel = 0; channel < 3; channel += 1) work[target + channel] += error[channel] * weight;
      };
      spread(1,0,7/16); spread(-1,1,3/16); spread(0,1,5/16); spread(1,1,1/16);
    }
  }
  context.putImageData(image, 0, 0);
};

document.querySelectorAll<HTMLCanvasElement>('[data-dither-demo]').forEach((canvas) => process(canvas, canvas.dataset.ditherDemo || 'ordered'));
