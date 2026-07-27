import MiniP5, { type MiniImage } from './miniP5';

type Flower = { branch: GrowingBranch; index: number; born: number; size: number };
type TailPoint = { x: number; y: number; px: number; py: number };

class GrowingBranch {
  points: Array<{ x: number; y: number }>;
  children: GrowingBranch[] = [];
  angle: number;
  level: number;
  target: number;
  grown = 0;
  split = false;
  seed: number;

  constructor(x: number, y: number, angle: number, level: number, target: number, seed: number) {
    this.points = [{ x, y }];
    this.angle = angle;
    this.level = level;
    this.target = target;
    this.seed = seed;
  }
}

class Swallow {
  startX: number;
  startY: number;
  exitX: number;
  exitY: number;
  cpX: number;
  cpY: number;
  delay: number;
  duration: number;
  scale: number;
  phase: number;
  tailL: TailPoint[] = [];
  tailR: TailPoint[] = [];

  constructor(p: MiniP5, index: number, width: number, height: number) {
    this.startX = width + p.random(35, 150);
    this.startY = p.random(height * .18, height * .88);
    this.exitX = p.random(-180, -45);
    this.exitY = p.random(height * .18, height * .88);
    const mx = (this.startX + this.exitX) / 2;
    const my = (this.startY + this.exitY) / 2;
    const dx = this.exitX - this.startX;
    const dy = this.exitY - this.startY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    this.cpX = mx + (dy / distance) * distance * p.random(.2, .38);
    this.cpY = my - (dx / distance) * distance * p.random(.2, .38);
    this.delay = index / 29 * 1050;
    this.duration = p.random(2800, 4200);
    this.scale = p.random(.42, .68);
    this.phase = p.random(p.TWO_PI);
    for (const side of [-1, 1]) {
      const tail = side < 0 ? this.tailL : this.tailR;
      for (let i = 0; i < 9; i += 1) {
        tail.push({ x: side * i * .8, y: i * 3.5, px: side * i * .8, py: i * 3.5 });
      }
    }
  }
}

const mount = document.querySelector<HTMLElement>('#nature-canvas');
const gallery = mount?.closest<HTMLElement>('.ink-gallery');

if (mount && gallery) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const caption = gallery.querySelector<HTMLElement>('.ink-screen-caption');
  const labels = Array.from(gallery.querySelectorAll<HTMLElement>('[data-ink-label]'));
  const phaseNames = {
    rain: ['RAIN CURTAIN', '01 / 04'],
    branch: ['BLOOMING BRANCH', '02 / 04'],
    bird: ['SWALLOW FLIGHT', '03 / 04'],
    experience: ['YOUR IMAGE', 'READY'],
  } as const;
  type Phase = keyof typeof phaseNames;
  const sceneCopy = (phase: Phase) => {
    const label = labels.find((item) => item.dataset.inkLabel === phase);
    const number = label?.querySelector<HTMLElement>(':scope > span')?.textContent?.trim();
    return {
      heading: label?.getAttribute('data-canvas-heading') || '',
      title: label?.getAttribute('data-canvas-title') || phaseNames[phase][0],
      subtitle: label?.getAttribute('data-canvas-subtitle') || '',
      meta: label?.getAttribute('data-canvas-meta') || '',
      date: label?.getAttribute('data-canvas-date') || '',
      weather: label?.getAttribute('data-canvas-weather') || '',
      quote: label?.getAttribute('data-canvas-quote') || '',
      index: number ? `${number} / 04` : phaseNames[phase][1],
    };
  };

  new MiniP5((p) => {
    const rainDropUrls = Array.from({ length: 12 }, (_, index) =>
      `/assets/rain/drop${index + 1}.png`
    );
    let rainDropImages: MiniImage[] = [];
    let branches: GrowingBranch[] = [];
    let flowers: Flower[] = [];
    let swallows: Swallow[] = [];
    let branchFrame = 0;
    let refreshStartedAt = -1000;
    let refreshActive = false;
    let currentPhase: keyof typeof phaseNames = 'rain';
    const transitionCanvas = document.createElement('canvas');
    const transitionContext = transitionCanvas.getContext('2d');
    let hasTransitionFrame = false;
    const materialCanvas = document.createElement('canvas');
    const materialContext = materialCanvas.getContext('2d', { willReadFrequently: true });
    const spectraPalette = [[31,34,38], [226,230,225], [35,63,142], [53,86,58], [98,32,30], [193,187,30]] as const;
    const refreshDuration = 880;

    const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
    const progress = () => {
      const rect = gallery.getBoundingClientRect();
      return clamp01(-rect.top / Math.max(1, rect.height - window.innerHeight));
    };

    const setPhase = (phase: keyof typeof phaseNames) => {
      if (phase === currentPhase) return;
      const previousPhase = currentPhase;
      if (transitionContext && p.canvas && p.width > 0 && p.height > 0) {
        transitionCanvas.width = Math.round(p.width);
        transitionCanvas.height = Math.round(p.height);
        if (previousPhase !== 'experience') {
          transitionContext.drawImage(p.canvas, 0, 0, transitionCanvas.width, transitionCanvas.height);
          hasTransitionFrame = true;
        } else {
          // Keep the full live studio, including its controls, as the departing old frame.
          hasTransitionFrame = false;
        }
      }
      gallery.style.setProperty('--ink-write-top', '100%');
      gallery.style.setProperty('--ink-write-opacity', '0');
      gallery.classList.toggle('is-leaving-experience', previousPhase === 'experience' && phase !== 'experience');
      gallery.classList.remove('is-live-ready');
      currentPhase = phase;
      gallery.dataset.phase = phase;
      labels.forEach((label) => label.classList.toggle('active', label.dataset.inkLabel === phase));
      const copy = sceneCopy(phase);
      if (caption) caption.innerHTML = `<b>${copy.title}</b><i>${copy.index}</i>`;
      if (phase === 'branch') resetBranches();
      refreshStartedAt = p.millis();
      refreshActive = true;
      gallery.classList.remove('is-refreshing');
      void gallery.offsetWidth;
      gallery.classList.add('is-refreshing');
    };

    const resetBranches = () => {
      branches = [];
      flowers = [];
      branchFrame = 0;
      p.randomSeed(8128);
      for (let i = 0; i < 5; i += 1) {
        const x = p.width * .5 + p.random(-4, 4);
        const angle = -p.HALF_PI + p.map(i, 0, 4, -.3, .3) + p.random(-.04, .04);
        branches.push(new GrowingBranch(x, p.height * .73, angle, 1, p.floor(p.random(27, 35)), i * 17));
      }
    };

    const buildBirds = () => {
      p.randomSeed(2304);
      swallows = Array.from({ length: 30 }, (_, index) => new Swallow(p, index, p.width, p.height));
    };

    const sizeCanvas = () => {
      const rect = mount.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 2);
      if (!p.canvas) {
        p.pixelDensity(density);
        p.createCanvas(rect.width, rect.height);
      } else {
        p.pixelDensity(density);
        p.resizeCanvas(rect.width, rect.height);
      }
      resetBranches();
      buildBirds();
    };

    const drawPaperSurface = () => {
      const context = p.drawingContext as CanvasRenderingContext2D;
      context.save();
      context.globalCompositeOperation = 'multiply';
      p.randomSeed(9182);
      p.strokeWeight(.35);
      for (let index = 0; index < 72; index += 1) {
        const y = p.random(p.height);
        const length = p.random(p.width * .08, p.width * .34);
        const x = p.random(-length * .3, p.width);
        p.stroke(76, 70, 58, p.random(4, 11));
        p.line(x, y, x + length, y + p.random(-.8, .8));
      }
      context.restore();
    };

    const applyEpaperMaterial = () => {
      if (!materialContext || !p.canvas) return;
      const width = window.innerWidth < 680
        ? Math.max(360, Math.round(p.width * 1.15))
        : Math.min(600, Math.max(480, Math.round(p.width * 1.25)));
      const height = Math.round(width * p.height / Math.max(1, p.width));
      const resized = materialCanvas.width !== width || materialCanvas.height !== height;
      if (resized) {
        materialCanvas.width = width;
        materialCanvas.height = height;
      }
      if (!resized && window.innerWidth >= 680 && p.frameCount % 2 === 1) {
        const target = p.drawingContext as CanvasRenderingContext2D;
        target.save();
        target.imageSmoothingEnabled = true;
        target.clearRect(0, 0, p.width, p.height);
        target.drawImage(materialCanvas, 0, 0, p.width, p.height);
        target.restore();
        return;
      }
      materialContext.imageSmoothingEnabled = true;
      materialContext.drawImage(p.canvas, 0, 0, width, height);
      const image = materialContext.getImageData(0, 0, width, height);
      const work = new Float32Array(image.data);
      const nearestInk = (r: number, g: number, b: number) => {
        const lightness = r * .2126 + g * .7152 + b * .0722;
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        if (lightness > 205 && chroma < 34) return spectraPalette[1];
        let result: readonly [number, number, number] = spectraPalette[0];
        let distance = Number.POSITIVE_INFINITY;
        for (const ink of spectraPalette) {
          const dr = r - ink[0]; const dg = g - ink[1]; const db = b - ink[2];
          const next = dr * dr * .27 + dg * dg * .66 + db * db * .07;
          if (next < distance) { distance = next; result = ink; }
        }
        return result;
      };
      for (let y = 0; y < height; y += 1) {
        const reverse = y % 2 === 1;
        for (let step = 0; step < width; step += 1) {
          const x = reverse ? width - step - 1 : step;
          const index = (y * width + x) * 4;
          const ink = nearestInk(work[index], work[index + 1], work[index + 2]);
          const error = [work[index] - ink[0], work[index + 1] - ink[1], work[index + 2] - ink[2]];
          image.data[index] = ink[0]; image.data[index + 1] = ink[1]; image.data[index + 2] = ink[2]; image.data[index + 3] = 255;
          const spread = (dx: number, dy: number, weight: number) => {
            const nx = x + (reverse ? -dx : dx); const ny = y + dy;
            if (nx < 0 || nx >= width || ny >= height) return;
            const target = (ny * width + nx) * 4;
            for (let channel = 0; channel < 3; channel += 1) work[target + channel] += error[channel] * weight;
          };
          spread(1, 0, 7 / 16); spread(-1, 1, 3 / 16); spread(0, 1, 5 / 16); spread(1, 1, 1 / 16);
        }
      }
      materialContext.putImageData(image, 0, 0);
      const target = p.drawingContext as CanvasRenderingContext2D;
      target.save();
      target.imageSmoothingEnabled = true;
      target.clearRect(0, 0, p.width, p.height);
      target.globalAlpha = .035;
      target.filter = 'blur(0.35px)';
      target.drawImage(materialCanvas, 0, 0, p.width, p.height);
      target.filter = 'none';
      target.globalAlpha = .965;
      target.drawImage(materialCanvas, 0, 0, p.width, p.height);
      target.restore();
    };

    const drawRain = (reveal: number) => {
      const copy = sceneCopy('rain');
      p.background(226, 230, 225);
      const colors = [[31,34,38], [226,230,225], [193,187,30], [98,32,30], [35,63,142], [53,86,58]];
      const clouds = [
        [.105, .266, .17, .068, -.018],
        [.263, .251, .184, .076, .011],
        [.421, .271, .168, .067, -.012],
        [.579, .246, .19, .079, .009],
        [.737, .267, .172, .069, -.014],
        [.895, .253, .168, .073, .013],
      ];
      p.fill(31, 34, 38);
      p.textAlign(p.CENTER, p.TOP);
      p.textFont('Songti SC');
      p.textSize(Math.max(window.innerWidth < 680 ? 21 : 24, p.width * .065));
      p.text(copy.heading || copy.title, p.width * .08, p.height * .07, p.width * .84, p.height * .115);
      p.textFont('Georgia');
      p.textSize(Math.max(7, p.width * .017));
      p.text(copy.meta, p.width * .1, p.height * .15, p.width * .8, p.height * .035);
      p.noStroke();
      clouds.forEach(([x, y, cloudWidth, cloudHeight, tilt], index) => {
        const color = colors[index];
        const width = p.width * cloudWidth;
        const height = p.height * cloudHeight;
        p.push();
        p.translate(p.width * x, p.height * y);
        p.rotate(tilt);
        p.fill(color[0], color[1], color[2], 255);
        if (index === 1) {
          p.stroke(31, 34, 38, 220);
          p.strokeWeight(Math.max(.85, p.width * .0018));
        } else {
          p.stroke(226, 230, 225, 205);
          p.strokeWeight(Math.max(.65, p.width * .00135));
        }
        p.beginShape();
        p.vertex(-width * .52, height * .12);
        p.bezierVertex(-width * .57, -height * .06, -width * .47, -height * .31, -width * .34, -height * .27);
        p.bezierVertex(-width * .31, -height * (.49 + index % 2 * .06), -width * .17, -height * .61, -width * .065, -height * .45);
        p.bezierVertex(width * .025, -height * (.65 - index % 3 * .035), width * .21, -height * .65, width * .285, -height * .38);
        p.bezierVertex(width * .41, -height * (.42 + index % 2 * .035), width * .52, -height * .18, width * .49, height * .01);
        p.bezierVertex(width * .6, height * .08, width * .55, height * .29, width * .39, height * .31);
        p.bezierVertex(width * .19, height * .39, -width * .12, height * .38, -width * .31, height * .32);
        p.bezierVertex(-width * .44, height * .33, -width * .55, height * .26, -width * .52, height * .12);
        p.endShape(p.CLOSE);
        p.pop();
      });
      p.noStroke();
      const rainProgress = clamp01((reveal - .2) / .8);
      p.imageMode(p.CENTER);
      for (let dropIndex = 0; dropIndex < 48; dropIndex += 1) {
        const column = dropIndex % 24;
        const row = Math.floor(dropIndex / 24);
        const delay = ((column * 7) % 19) / 38 + row * .18;
        const fall = clamp01(rainProgress * 1.58 - delay);
        if (fall <= 0 || fall >= 1) continue;
        const eased = fall * fall * (3 - 2 * fall);
        const baseX = p.map(column, 0, 23, p.width * .075, p.width * .925);
        const windEnvelope = p.sin(fall * p.PI);
        const prevailingWind = p.sin(rainProgress * p.PI * 2.1) * p.width * .018;
        const localFlutter = p.sin(rainProgress * p.PI * (3.2 + row * .45) + column * 1.37) * p.width * (.004 + (column % 4) * .0015);
        const scrollGust = p.sin(rainProgress * p.PI * 2.4 + column * .21) * p.width * .009;
        const x = baseX + (prevailingWind + localFlutter + scrollGust) * windEnvelope;
        const y = p.lerp(p.height * (.305 + row * .018), p.height * (1.02 + row * .04), eased);
        const image = rainDropImages[(dropIndex * 5 + row * 3) % rainDropImages.length];
        const colorIndex = (column + row * 3) % colors.length;
        const color = colors[colorIndex];
        const height = 11 + ((dropIndex * 13) % 23);
        const width = image?.width ? height * image.width / image.height : height * .32;
        const alpha = 255 * Math.sin(fall * Math.PI);
        if (image?.width) {
          if (colorIndex === 1) {
            p.tint(31, 34, 38, alpha * .7);
            p.image(image, x, y, width + 2.2, height + 2.2);
          }
          p.tint(color[0], color[1], color[2], alpha);
          p.image(image, x, y, width, height);
        } else {
          p.stroke(colorIndex === 1 ? 31 : color[0], colorIndex === 1 ? 34 : color[1], colorIndex === 1 ? 38 : color[2], alpha);
          p.strokeWeight(colorIndex === 1 ? 1 : 0);
          p.fill(color[0], color[1], color[2], alpha);
          p.beginShape(); p.vertex(x, y - height * .5); p.bezierVertex(x - width * .7, y - height * .1, x - width * .55, y + height * .45, x, y + height * .5); p.bezierVertex(x + width * .55, y + height * .45, x + width * .7, y - height * .1, x, y - height * .5); p.endShape(p.CLOSE);
        }
      }
      p.noTint(); p.imageMode(p.CORNER);
      p.noStroke();
    };

    const growBranches = () => {
      branchFrame += 1;
      for (const branch of [...branches]) {
        if (branch.grown >= branch.target) {
          if (!branch.split && branch.level < 3) {
            branch.split = true;
            const tip = branch.points[branch.points.length - 1];
            const spread = .48 * Math.pow(.8, branch.level - 1);
            for (const side of [-1, 1]) {
              const child = new GrowingBranch(tip.x, tip.y, branch.angle + side * spread, branch.level + 1, Math.max(6, Math.floor(branch.target * .46)), branch.seed + side * 11);
              branch.children.push(child);
              branches.push(child);
            }
          }
          continue;
        }
        const tip = branch.points[branch.points.length - 1];
        branch.angle = p.constrain(branch.angle + p.random(-.11, .11), -p.PI + .3, -.15);
        const step = Math.max(1.15, p.height / 210) * (branch.level === 1 ? 1.4 : 1);
        const next = { x: tip.x + p.cos(branch.angle) * step, y: tip.y + p.sin(branch.angle) * step };
        branch.points.push(next);
        branch.grown += 1;
        if (branch.grown % 3 === 0 && p.random() < .12) flowers.push({ branch, index: branch.points.length - 1, born: branchFrame, size: p.random(3.5, 7.5) });
      }
    };

    const branchOffset = (point: { y: number }, seed: number) => {
      const height = clamp01((p.height * .73 - point.y) / p.height);
      return reducedMotion ? 0 : p.sin(p.frameCount * .025 + seed + point.y / 90) * 3.2 * height;
    };

    const drawBranches = () => {
      const copy = sceneCopy('branch');
      p.background(226, 230, 225);
      p.noStroke();
      p.fill(31, 34, 38);
      p.textFont('Georgia');
      p.textAlign(p.LEFT);
      p.textSize(Math.max(13, p.width * .034));
      p.text(copy.date || '07 / 27  SUN', p.width * .075, p.height * .105);
      p.textAlign(p.RIGHT);
      p.text(copy.weather || 'SHENZHEN  28°  RAIN', p.width * .925, p.height * .105);
      p.stroke(35, 63, 142); p.strokeWeight(2);
      p.line(p.width * .075, p.height * .145, p.width * .925, p.height * .145);
      const rawQuote = copy.quote || '生活的纹理，藏在每一个普通日子里。';
      const framedQuote = /^[“"「『«]/.test(rawQuote) ? rawQuote : `“${rawQuote}”`;
      const longQuote = Array.from(framedQuote).length > 30;
      p.noStroke(); p.fill(31, 34, 38);
      p.textFont('Georgia'); p.textAlign(p.LEFT);
      p.textSize(Math.max(9, p.width * .021));
      p.text(copy.meta || 'READING NOTE  /  TODAY', p.width * .075, p.height * .205);
      p.fill(98, 32, 30);
      p.textFont('Songti SC'); p.textAlign(p.LEFT);
      p.textSize(longQuote ? Math.max(18, p.width * .052) : Math.max(25, p.width * .07));
      p.text(framedQuote, p.width * .075, p.height * .255, p.width * .84, p.height * .19);
      p.fill(31, 34, 38);
      p.textAlign(p.LEFT);
      if (!reducedMotion || branchFrame < 180) {
        growBranches();
        growBranches();
      }
      for (const branch of branches) {
        if (branch.points.length < 2) continue;
        p.noFill();
        p.stroke(31, 34, 38, 255);
        p.strokeWeight(Math.max(1.45, 3.65 - branch.level * .48));
        p.beginShape();
        branch.points.forEach((point) => p.vertex(point.x + branchOffset(point, branch.seed), point.y));
        p.endShape();
      }
      const colors = [[98, 32, 30], [193, 187, 30], [53, 86, 58]];
      for (const flower of flowers) {
        const point = flower.branch.points[flower.index];
        if (!point) continue;
        const bloom = clamp01((branchFrame - flower.born) / 45);
        const color = colors[(flower.index + flower.branch.level) % colors.length];
        p.noStroke();
        p.fill(color[0], color[1], color[2], 255 * bloom);
        p.circle(point.x + branchOffset(point, flower.branch.seed), point.y, p.lerp(2, flower.size * 1.35, 1 - Math.pow(1 - bloom, 3)));
      }
      p.noStroke();
      p.fill(35, 63, 142);
      p.beginShape();
      p.vertex(p.width * .43, p.height * .71);
      p.bezierVertex(p.width * .43, p.height * .79, p.width * .39, p.height * .86, p.width * .4, p.height * .93);
      p.vertex(p.width * .6, p.height * .93);
      p.bezierVertex(p.width * .61, p.height * .86, p.width * .57, p.height * .79, p.width * .57, p.height * .71);
      p.endShape(p.CLOSE);
      p.stroke(31, 34, 38, 245);
      p.strokeWeight(1.5);
      p.line(p.width * .43, p.height * .71, p.width * .57, p.height * .71);
    };

    const updateTail = (tail: TailPoint[], rootX: number) => {
      const segment = 3.7;
      tail[0].x = rootX;
      tail[0].y = 10;
      for (let i = 1; i < tail.length; i += 1) {
        const point = tail[i];
        const vx = (point.x - point.px) * .94;
        const vy = (point.y - point.py) * .94;
        point.px = point.x;
        point.py = point.y;
        point.x += vx;
        point.y += vy + .06;
      }
      for (let iteration = 0; iteration < 5; iteration += 1) {
        for (let i = 0; i < tail.length - 1; i += 1) {
          const a = tail[i];
          const b = tail[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.max(.001, Math.hypot(dx, dy));
          const correction = (distance - segment) / distance;
          if (i > 0) { a.x += dx * correction * .5; a.y += dy * correction * .5; }
          b.x -= dx * correction * .5;
          b.y -= dy * correction * .5;
        }
      }
    };

    const drawSwallow = (bird: Swallow, t: number) => {
      const eased = 1 - Math.pow(1 - t, 2.8);
      const u = 1 - eased;
      const x = u * u * bird.startX + 2 * u * eased * bird.cpX + eased * eased * bird.exitX;
      const y = u * u * bird.startY + 2 * u * eased * bird.cpY + eased * eased * bird.exitY;
      const nx = bird.startX * (u - .01) * (u - .01) + 2 * (u - .01) * (eased + .01) * bird.cpX + (eased + .01) * (eased + .01) * bird.exitX;
      const ny = bird.startY * (u - .01) * (u - .01) + 2 * (u - .01) * (eased + .01) * bird.cpY + (eased + .01) * (eased + .01) * bird.exitY;
      const angle = p.atan2(ny - y, nx - x) + p.PI;
      const flap = .2 + (p.sin(t * 24 + bird.phase) + 1) * .4;
      updateTail(bird.tailL, -1.3);
      updateTail(bird.tailR, 1.3);
      p.push();
      p.translate(x, y);
      p.rotate(angle);
      p.scale(bird.scale);
      p.noStroke();
      p.fill(18, 18, 18, 238);
      p.ellipse(0, 0, 5, 18);
      p.beginShape(); p.vertex(-1, -4); p.bezierVertex(-9, -13 * flap, -17, -12 * flap, -23, -2); p.bezierVertex(-14, -5, -8, -1, -1, 1); p.endShape(p.CLOSE);
      p.beginShape(); p.vertex(1, -4); p.bezierVertex(9, -13 * flap, 17, -12 * flap, 23, -2); p.bezierVertex(14, -5, 8, -1, 1, 1); p.endShape(p.CLOSE);
      p.noFill();
      p.stroke(18, 18, 18, 215);
      p.strokeWeight(.8);
      for (const tail of [bird.tailL, bird.tailR]) {
        p.beginShape();
        tail.forEach((point) => p.vertex(point.x, point.y));
        p.endShape();
      }
      p.pop();
    };

    const drawBirds = (scrollPhase: number) => {
      const copy = sceneCopy('bird');
      p.background(226, 230, 225);
      p.fill(31, 34, 38, 255);
      p.noStroke();
      p.textFont('Songti SC');
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(Math.max(23, p.width * .068));
      p.text(copy.title || 'Beyond the strings', p.width * .5, p.height * .04);
      p.textFont('Georgia');
      p.textSize(Math.max(8, p.width * .019));
      p.text(copy.subtitle || 'the wind passes between notes / study 03', p.width * .5, p.height * .155);
      p.textAlign(p.LEFT);
      const staffColors = [[31,34,38], [35,63,142], [98,32,30], [53,86,58], [31,34,38]];
      p.strokeWeight(1);
      const staffTop = p.height * .28;
      for (let staff = 0; staff < 5; staff += 1) {
        const staffColor = staffColors[staff];
        p.stroke(staffColor[0], staffColor[1], staffColor[2], 220);
        const top = staffTop + staff * p.height * .115;
        for (let line = 0; line < 5; line += 1) {
          const baseY = top + line * 5;
          const amplitude = 2.2 + staff * .42 + scrollPhase * 3.2;
          p.noFill();
          p.beginShape();
          for (let step = 0; step <= 42; step += 1) {
            const t = step / 42;
            const envelope = p.sin(t * p.PI);
            const pulse = p.sin(t * p.TWO_PI * (1.35 + staff * .08) - scrollPhase * 7 - line * .42);
            const pluck = p.sin(t * p.PI * 3 + scrollPhase * p.TWO_PI) * .65;
            p.vertex(p.lerp(p.width * .13, p.width * .87, t), baseY + (pulse + pluck) * amplitude * envelope);
          }
          p.endShape();
        }
        for (let note = 0; note < 8; note += 1) {
          const x = p.width * (.17 + note * .09);
          const y = top + ((note * 7 + staff * 3) % 20);
          p.noStroke(); p.fill(31, 34, 38, 255); p.ellipse(x, y, 5, 4); p.stroke(31, 34, 38, 255); p.line(x + 2, y, x + 2, y - 11);
        }
      }
      p.noFill();
      const stringColors = [[35,63,142], [98,32,30], [53,86,58], [31,34,38]];
      p.strokeWeight(.75);
      for (let stringIndex = 0; stringIndex < 12; stringIndex += 1) {
        const stringColor = stringColors[stringIndex % stringColors.length];
        p.stroke(stringColor[0], stringColor[1], stringColor[2], 165);
        const x = p.map(stringIndex, 0, 11, p.width * .2, p.width * .8);
        p.beginShape();
        for (let step = 0; step <= 20; step += 1) {
          const t = step / 20;
          const spread = (t - .5) * (stringIndex - 8.5) * .7;
          const vibration = p.sin(t * p.PI * 3 - scrollPhase * 8 + stringIndex) * 2.5 * p.sin(t * p.PI);
          p.vertex(x + spread + vibration, p.lerp(p.height * .86, p.height * .2, t));
        }
        p.endShape();
      }
      for (let index = 0; index < swallows.length; index += 1) {
        const bird = swallows[index];
        const arrival = clamp01(scrollPhase * 1.48 - index / 29 * .48);
        if (arrival <= 0) continue;
        const restingPoint = .18 + index / 29 * .36;
        drawSwallow(bird, arrival * restingPoint);
      }
    };

    const drawExperience = () => {
      const copy = sceneCopy('experience');
      p.background(226, 230, 225);
      const blocks = [[35,63,142], [98,32,30], [193,187,30], [53,86,58]];
      p.noStroke();
      blocks.forEach((color, index) => {
        p.fill(color[0], color[1], color[2]);
        p.rect(p.width * (.13 + index * .19), p.height * .22, p.width * .13, p.height * .012);
      });
      p.fill(31, 34, 38);
      p.textAlign(p.CENTER);
      p.textFont('Georgia');
      p.textSize(Math.max(24, p.width * .085));
      p.text(copy.title || 'Your turn.', p.width * .5, p.height * .47);
      p.textSize(Math.max(7, p.width * .019));
      p.text(copy.subtitle || 'DROP A PHOTO  /  WRITE A LINE', p.width * .5, p.height * .53);
      p.noFill(); p.stroke(31, 34, 38); p.strokeWeight(1);
      p.rect(p.width * .25, p.height * .62, p.width * .5, p.height * .085);
      p.noStroke(); p.fill(31, 34, 38); p.textSize(Math.max(8, p.width * .021));
      p.text(copy.meta || 'PREVIEW ON PEANUP', p.width * .5, p.height * .675);
      p.textAlign(p.LEFT);
    };

    const drawRefresh = () => {
      if (!refreshActive) return;
      const elapsed = p.millis() - refreshStartedAt;
      if (elapsed < 0) return;
      if (elapsed > refreshDuration) {
        gallery.style.setProperty('--ink-write-top', '0%');
        gallery.style.setProperty('--ink-write-opacity', '0');
        gallery.classList.remove('is-refreshing', 'is-leaving-experience');
        gallery.classList.toggle('is-live-ready', currentPhase === 'experience');
        refreshActive = false;
        return;
      }
      const t = 1 - Math.pow(1 - clamp01(elapsed / refreshDuration), 3);
      const scanY = p.lerp(p.height, 0, t);
      gallery.style.setProperty('--ink-write-top', `${(1 - t) * 100}%`);
      gallery.style.setProperty('--ink-write-opacity', `${Math.sin(t * Math.PI) * .7}`);
      const context = p.drawingContext as CanvasRenderingContext2D;
      if (hasTransitionFrame && transitionCanvas.width > 0 && scanY > 0) {
        context.save();
        context.drawImage(transitionCanvas, 0, 0, transitionCanvas.width, transitionCanvas.height * scanY / p.height, 0, 0, p.width, scanY);
        context.restore();
      }
      p.noStroke();
      p.fill(20, 20, 18, 28);
      p.rect(0, scanY, p.width, 10);
      p.fill(48, 102, 178, 120);
      p.rect(0, scanY + 2, p.width, 1);
    };

    p.setup = () => {
      sizeCanvas();
      p.frameRate(window.innerWidth < 680 ? 30 : 42);
      labels[0]?.classList.add('active');
      window.addEventListener('resize', sizeCanvas, { passive: true });
      document.addEventListener('visibilitychange', () => document.hidden ? p.noLoop() : p.loop());
      const phaseOrder: Array<keyof typeof phaseNames> = ['rain', 'branch', 'bird', 'experience'];
      labels.forEach((label) => {
        const activate = () => {
          const phase = label.dataset.inkLabel as keyof typeof phaseNames;
          const index = phaseOrder.indexOf(phase);
          if (index < 0) return;
          const top = window.scrollY + gallery.getBoundingClientRect().top;
          const distance = Math.max(1, gallery.offsetHeight - window.innerHeight);
          window.scrollTo({ top: top + distance * ((index + .5) / phaseOrder.length), behavior: reducedMotion ? 'auto' : 'smooth' });
        };
        label.addEventListener('click', (event) => { if (!(event.target as HTMLElement).closest('a, button')) activate(); });
        label.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); } });
      });
    };

    p.preload = () => {
      rainDropImages = rainDropUrls.map((url) => p.loadImage(url, undefined, () => undefined));
    };

    p.draw = () => {
      const scroll = progress();
      setPhase(scroll < .25 ? 'rain' : scroll < .5 ? 'branch' : scroll < .75 ? 'bird' : 'experience');
      const rainReveal = clamp01(scroll / .22);
      const birdScroll = clamp01((scroll - .5) / .23);
      if (currentPhase === 'rain') drawRain(rainReveal);
      else if (currentPhase === 'branch') drawBranches();
      else if (currentPhase === 'bird') drawBirds(birdScroll);
      else drawExperience();
      drawPaperSurface();
      applyEpaperMaterial();
      drawRefresh();
    };
  }, mount);
}
