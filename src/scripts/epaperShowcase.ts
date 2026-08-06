const displayPalette = {
  black: [34, 35, 34],
  white: [235, 235, 229],
  red: [157, 66, 56],
  yellow: [211, 177, 62],
  blue: [72, 101, 154],
  green: [91, 119, 85],
} as const;
type Pigment = keyof typeof displayPalette;

const clampChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
const randomAt = (value: number, seed: number) => {
  const sample = Math.sin((value + 1) * 12.9898 + (seed + 1) * 78.233) * 43758.5453;
  return sample - Math.floor(sample);
};
const rgba = (color: readonly [number, number, number], offset: number, alpha: number) =>
  `rgba(${clampChannel(color[0] + offset)},${clampChannel(color[1] + offset)},${clampChannel(color[2] + offset)},${alpha})`;

const paintPigmentBase = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: readonly [number, number, number],
  seed: number,
) => {
  const image = context.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const grain = ((((x * 17 + y * 31 + seed * 47) % 43) / 43) - .5) * 3.6;
      const capsule = (x * 11 + y * 7 + seed * 19) % 211 < 2 ? -2.2 : 0;
      const light = (1 - Math.hypot(x / width - .34, y / height - .28)) * 1.8;
      image.data[index] = clampChannel(color[0] + grain + capsule + light + .6);
      image.data[index + 1] = clampChannel(color[1] + grain * .82 + capsule + light);
      image.data[index + 2] = clampChannel(color[2] + grain * .68 + capsule + light - .45);
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
};

const paintPigmentPattern = (
  context: CanvasRenderingContext2D,
  pigment: Pigment,
  width: number,
  height: number,
  seed: number,
) => {
  const color = displayPalette[pigment];
  const unit = Math.max(.72, width / 240);
  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';

  if (pigment === 'black') {
    const originX = width * .08;
    const originY = height * .72;
    context.lineWidth = unit * .8;
    for (let ring = 1; ring <= 10; ring += 1) {
      const radiusX = width * (.025 + ring * .075);
      const radiusY = height * (.018 + ring * .064);
      context.strokeStyle = rgba(color, ring % 3 === 0 ? 58 : 43, ring % 3 === 0 ? .29 : .2);
      context.beginPath();
      for (let step = 0; step <= 64; step += 1) {
        const angle = step / 64 * Math.PI * 2;
        const wobble = 1
          + Math.sin(angle * 3 + ring * .67) * .045
          + Math.sin(angle * 7 - ring * .39) * .018;
        const x = originX + Math.cos(angle) * radiusX * wobble + Math.sin(angle) * width * .035;
        const y = originY + Math.sin(angle) * radiusY * wobble - Math.cos(angle) * height * .025;
        if (step === 0) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.closePath();
      context.stroke();
    }

    context.globalCompositeOperation = 'multiply';
    context.lineWidth = unit * .68;
    for (let index = 0; index < 5; index += 1) {
      const startX = width * (.52 + index * .13);
      context.strokeStyle = rgba(color, -18, .24);
      context.beginPath();
      context.moveTo(startX - width * .2, height * 1.08);
      context.bezierCurveTo(
        startX - width * .09,
        height * .72,
        startX + width * .04,
        height * .35,
        startX + width * .18,
        -height * .08,
      );
      context.stroke();
    }
  }

  if (pigment === 'white') {
    context.strokeStyle = 'rgba(79,94,87,.075)';
    context.lineWidth = unit * .7;
    for (let ring = 1; ring <= 4; ring += 1) {
      context.beginPath();
      context.ellipse(
        width * .9,
        height * .18,
        width * .12 * ring,
        height * .075 * ring,
        -.24,
        0,
        Math.PI * 2,
      );
      context.stroke();
    }

    for (let index = 0; index < 38; index += 1) {
      const x = randomAt(index, seed + 7) * width * 1.12 - width * .06;
      const y = randomAt(index, seed) * height;
      const length = width * (.1 + randomAt(index, seed + 3) * .48);
      const bend = (randomAt(index, seed + 2) - .5) * height * .12;
      context.strokeStyle = index % 5 === 0 ? 'rgba(139,112,79,.14)' : 'rgba(78,105,94,.12)';
      context.lineWidth = unit * (.38 + randomAt(index, seed + 4) * .42);
      context.beginPath();
      context.moveTo(x, y);
      context.bezierCurveTo(x + length * .28, y + bend, x + length * .64, y - bend * .7, x + length, y + bend * .22);
      context.stroke();
    }

    context.fillStyle = 'rgba(86,96,89,.16)';
    for (let index = 0; index < 34; index += 1) {
      const x = randomAt(index, seed + 8) * width;
      const y = randomAt(index, seed + 12) * height;
      context.beginPath();
      context.ellipse(x, y, unit * .48, unit * .24, randomAt(index, seed) * Math.PI, 0, Math.PI * 2);
      context.fill();
    }
  }

  if (pigment === 'red') {
    const gap = Math.max(7.5, width / 25);
    context.save();
    context.translate(width * .5, height * .5);
    context.rotate(-Math.PI / 12);
    for (let y = -height; y <= height; y += gap) {
      for (let x = -width; x <= width; x += gap) {
        const offsetX = x + (Math.round(y / gap) % 2 ? gap * .5 : 0);
        const distance = Math.hypot(offsetX - width * .12, y + height * .08);
        const angle = Math.atan2(y + height * .08, offsetX - width * .12);
        const rosette = .5 + Math.sin(distance * .095 - angle * 4) * .5;
        const radius = unit * (.42 + rosette * 1.2);
        context.fillStyle = rosette > .52 ? rgba(color, 62, .42) : rgba(color, -31, .28);
        context.beginPath();
        context.arc(offsetX, y, radius, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.restore();
  }

  if (pigment === 'yellow') {
    const sourceX = width * .78;
    const sourceY = height * .34;
    const rayLength = Math.hypot(width, height) * 1.2;
    context.lineWidth = unit * .72;
    for (let index = 0; index < 28; index += 1) {
      const angle = index / 28 * Math.PI * 2 + .04 * Math.sin(index * 1.7);
      context.strokeStyle = index % 4 === 0 ? rgba(color, -46, .28) : rgba(color, 47, .27);
      context.beginPath();
      context.moveTo(sourceX + Math.cos(angle) * unit * 6, sourceY + Math.sin(angle) * unit * 6);
      context.lineTo(sourceX + Math.cos(angle) * rayLength, sourceY + Math.sin(angle) * rayLength);
      context.stroke();
    }

    for (let ring = 1; ring <= 5; ring += 1) {
      const radius = unit * (5 + ring * 4.6);
      const count = 8 + ring * 5;
      context.fillStyle = ring % 2 ? rgba(color, 56, .34) : rgba(color, -41, .22);
      for (let index = 0; index < count; index += 1) {
        const angle = index / count * Math.PI * 2;
        context.beginPath();
        context.arc(
          sourceX + Math.cos(angle) * radius,
          sourceY + Math.sin(angle) * radius,
          unit * .62,
          0,
          Math.PI * 2,
        );
        context.fill();
      }
    }
    context.fillStyle = rgba(color, 64, .42);
    context.beginPath();
    context.arc(sourceX, sourceY, unit * 4.1, 0, Math.PI * 2);
    context.fill();
  }

  if (pigment === 'blue') {
    context.lineWidth = unit * .8;
    for (let index = 0; index < 30; index += 1) {
      const x = randomAt(index, seed + 21) * width * 1.08 - width * .04;
      const y = randomAt(index, seed + 31) * height * 1.12 - height * .2;
      const length = height * (.07 + randomAt(index, seed + 41) * .23);
      const drift = width * (.012 + randomAt(index, seed + 51) * .024);
      context.strokeStyle = index % 5 === 0 ? rgba(color, 64, .4) : rgba(color, 43, .25);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x - drift, y + length);
      context.stroke();
    }

    const rippleCenters = [[.22, .76], [.76, .64]] as const;
    rippleCenters.forEach(([centerX, centerY], centerIndex) => {
      context.lineWidth = unit * (centerIndex ? .72 : .9);
      for (let ring = 1; ring <= (centerIndex ? 3 : 5); ring += 1) {
        context.strokeStyle = ring % 2 ? rgba(color, 62, .36) : rgba(color, -33, .2);
        context.beginPath();
        context.ellipse(
          width * centerX,
          height * centerY,
          width * .052 * ring,
          height * .022 * ring,
          -.08,
          0,
          Math.PI * 2,
        );
        context.stroke();
      }
    });
  }

  if (pigment === 'green') {
    const leafLength = width * 1.02;
    const leafHeight = height * .62;
    context.save();
    context.translate(width * .52, height * .53);
    context.rotate(-.42);

    context.fillStyle = rgba(color, 36, .12);
    context.strokeStyle = rgba(color, 55, .34);
    context.lineWidth = unit * 1.15;
    context.beginPath();
    context.moveTo(-leafLength * .5, 0);
    context.bezierCurveTo(-leafLength * .24, -leafHeight, leafLength * .26, -leafHeight * .72, leafLength * .5, 0);
    context.bezierCurveTo(leafLength * .2, leafHeight * .82, -leafLength * .28, leafHeight * .68, -leafLength * .5, 0);
    context.closePath();
    context.fill();
    context.stroke();

    context.strokeStyle = rgba(color, 65, .5);
    context.lineWidth = unit * 1.45;
    context.beginPath();
    context.moveTo(-leafLength * .52, 0);
    context.bezierCurveTo(-leafLength * .12, -height * .025, leafLength * .2, height * .035, leafLength * .5, 0);
    context.stroke();

    context.lineWidth = unit * .72;
    for (let index = 1; index <= 11; index += 1) {
      const t = index / 12;
      const x = -leafLength * .5 + leafLength * t;
      const reach = Math.sin(t * Math.PI);
      const upperY = -leafHeight * .78 * reach;
      const lowerY = leafHeight * .64 * reach;
      context.strokeStyle = rgba(color, index % 2 ? 58 : 43, index % 2 ? .36 : .24);
      context.beginPath();
      context.moveTo(x, 0);
      context.quadraticCurveTo(x + leafLength * .045, upperY * .52, x + leafLength * .105, upperY);
      context.stroke();
      context.beginPath();
      context.moveTo(x, 0);
      context.quadraticCurveTo(x + leafLength * .035, lowerY * .48, x + leafLength * .09, lowerY);
      context.stroke();
    }
    context.restore();
  }

  context.restore();
};

const pigmentCanvases = [...document.querySelectorAll<HTMLCanvasElement>('[data-pigment]')];
const renderPigment = (canvas: HTMLCanvasElement, canvasIndex: number) => {
  const context = canvas.getContext('2d', { alpha: false });
  const pigment = canvas.dataset.pigment as Pigment;
  const bounds = canvas.getBoundingClientRect();
  if (!context || !displayPalette[pigment] || bounds.width < 1 || bounds.height < 1) return;
  // Material samples do not need display-resolution buffers. A fixed,
  // compact backing store keeps the six swatches light while preserving the
  // soft pigment grain that makes the panel feel physical.
  const density = Math.max(.3, Math.min(
    window.devicePixelRatio || 1,
    .36,
    80 / bounds.width,
    48 / bounds.height,
  ));
  const pixelWidth = Math.max(1, Math.round(bounds.width * density));
  const pixelHeight = Math.max(1, Math.round(bounds.height * density));
  if (canvas.width === pixelWidth && canvas.height === pixelHeight) return;
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  context.setTransform(1, 0, 0, 1, 0, 0);
  paintPigmentBase(context, pixelWidth, pixelHeight, displayPalette[pigment], canvasIndex);
  context.setTransform(density, 0, 0, density, 0, 0);
  paintPigmentPattern(context, pigment, bounds.width, bounds.height, canvasIndex + 1);
};

export const renderPigments = () => pigmentCanvases.forEach(renderPigment);
