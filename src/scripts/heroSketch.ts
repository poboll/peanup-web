import p5 from 'p5';

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

  constructor(p: p5, index: number, width: number, height: number) {
    this.startX = width + p.random(35, 150);
    this.startY = p.random(height * .08, height * .88);
    this.exitX = p.random(-180, -45);
    this.exitY = p.random(height * .08, height * .88);
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
    rain: ['RAIN CURTAIN', '01 / 03'],
    branch: ['BLOOMING BRANCH', '02 / 03'],
    bird: ['SWALLOW FLIGHT', '03 / 03'],
  } as const;

  new p5((p) => {
    const rainDropUrls = Array.from({ length: 12 }, (_, index) =>
      `https://cdn.jsdelivr.net/gh/xxoogreymon-prog/image-resources@main/icons/rain_drops/drop${index + 1}.png`
    );
    let rainDropImages: p5.Image[] = [];
    let branches: GrowingBranch[] = [];
    let flowers: Flower[] = [];
    let swallows: Swallow[] = [];
    let branchFrame = 0;
    let refreshStartedAt = -1000;
    let currentPhase: keyof typeof phaseNames = 'rain';
    const materialCanvas = document.createElement('canvas');
    const materialContext = materialCanvas.getContext('2d', { willReadFrequently: true });
    const spectraPalette = [[31,34,38], [216,222,216], [35,63,142], [53,86,58], [98,32,30], [193,187,30]] as const;

    const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
    const progress = () => {
      const rect = gallery.getBoundingClientRect();
      return clamp01(-rect.top / Math.max(1, rect.height - window.innerHeight));
    };

    const setPhase = (phase: keyof typeof phaseNames) => {
      if (phase === currentPhase) return;
      currentPhase = phase;
      gallery.dataset.phase = phase;
      labels.forEach((label) => label.classList.toggle('active', label.dataset.inkLabel === phase));
      if (caption) caption.innerHTML = `<b>${phaseNames[phase][0]}</b><i>${phaseNames[phase][1]}</i>`;
      if (phase === 'branch') resetBranches();
      refreshStartedAt = p.millis();
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
        const x = p.width * .5 + p.random(-5, 5);
        const angle = -p.HALF_PI + p.map(i, 0, 4, -.42, .42) + p.random(-.05, .05);
        branches.push(new GrowingBranch(x, p.height * .79, angle, 1, p.floor(p.random(44, 58)), i * 17));
      }
    };

    const buildBirds = () => {
      p.randomSeed(2304);
      swallows = Array.from({ length: 30 }, (_, index) => new Swallow(p, index, p.width, p.height));
    };

    const sizeCanvas = () => {
      const rect = mount.getBoundingClientRect();
      if (!p.canvas) p.createCanvas(rect.width, rect.height);
      else p.resizeCanvas(rect.width, rect.height);
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 1.5));
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
      const scale = window.innerWidth < 680 ? 1.8 : 1.45;
      const width = Math.max(180, Math.round(p.width / scale));
      const height = Math.max(240, Math.round(p.height / scale));
      const resized = materialCanvas.width !== width || materialCanvas.height !== height;
      if (resized) {
        materialCanvas.width = width;
        materialCanvas.height = height;
      }
      if (!resized && window.innerWidth >= 680 && p.frameCount % 2 === 1) {
        const target = p.drawingContext as CanvasRenderingContext2D;
        target.save();
        target.imageSmoothingEnabled = true;
        target.drawImage(materialCanvas, 0, 0, p.width, p.height);
        target.restore();
        return;
      }
      materialContext.imageSmoothingEnabled = true;
      materialContext.drawImage(p.canvas, 0, 0, width, height);
      const image = materialContext.getImageData(0, 0, width, height);
      const work = new Float32Array(image.data);
      const nearestInk = (r: number, g: number, b: number) => {
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
      p.background(235, 231, 218);
      p.noStroke();
      p.fill(207, 219, 224, 175); p.rect(0, p.height * .18, p.width, p.height * .38);
      p.fill(90, 135, 82, 145);
      p.beginShape(); p.vertex(0, p.height * .54); p.bezierVertex(p.width * .2, p.height * .38, p.width * .33, p.height * .49, p.width * .5, p.height * .41); p.bezierVertex(p.width * .67, p.height * .32, p.width * .8, p.height * .51, p.width, p.height * .39); p.vertex(p.width, p.height * .67); p.vertex(0, p.height * .67); p.endShape(p.CLOSE);
      p.fill(48, 102, 178, 120);
      p.beginShape(); p.vertex(0, p.height * .61); p.bezierVertex(p.width * .18, p.height * .5, p.width * .32, p.height * .64, p.width * .47, p.height * .53); p.bezierVertex(p.width * .66, p.height * .4, p.width * .78, p.height * .6, p.width, p.height * .5); p.vertex(p.width, p.height * .72); p.vertex(0, p.height * .72); p.endShape(p.CLOSE);
      p.fill(226, 174, 37, 120); p.circle(p.width * .78, p.height * .22, p.width * .11);
      p.fill(240, 237, 225, 215);
      p.ellipse(p.width * .28, p.height * .18, p.width * .31, p.height * .08);
      p.ellipse(p.width * .55, p.height * .16, p.width * .36, p.height * .1);
      p.ellipse(p.width * .76, p.height * .19, p.width * .23, p.height * .07);
      p.fill(225, 226, 213, 205); p.rect(0, p.height * .7, p.width, p.height * .3);
      p.stroke(48, 102, 178, 36); p.strokeWeight(.6);
      for (let line = 0; line < 7; line += 1) p.line(0, p.height * (.74 + line * .035), p.width, p.height * (.74 + line * .035));

      const colors = [[31,34,38], [216,222,216], [193,187,30], [98,32,30], [35,63,142], [53,86,58]];
      const curtainAlpha = 1 - clamp01((reveal - .66) / .28);
      p.imageMode(p.CENTER);
      for (let line = 0; line < 26; line += 1) {
        const x = p.map(line, 0, 25, p.width * .1, p.width * .9);
        const curtain = clamp01(reveal * 1.28 - (line % 6) * .025);
        if (curtain <= 0 || curtainAlpha <= 0) continue;
        const endY = p.lerp(p.height * .2, p.height * .76, 1 - Math.pow(1 - curtain, 2.2));
        p.stroke(35, 63, 142, 34 * curtainAlpha); p.strokeWeight(.45);
        p.line(x, p.height * .19, x, endY);
        const count = 3 + (line % 4);
        for (let dropIndex = 0; dropIndex < count; dropIndex += 1) {
          const position = (dropIndex + .65) / count;
          const y = p.lerp(p.height * .22, endY, position);
          if (y > endY - 1) continue;
          const image = rainDropImages[(line * 3 + dropIndex) % rainDropImages.length];
          const color = colors[(line + dropIndex * 2) % colors.length];
          const height = 8 + ((line * 5 + dropIndex * 7) % 12);
          p.tint(color[0], color[1], color[2], 185 * curtainAlpha);
          if (image?.width) p.image(image, x, y, height * image.width / image.height, height);
          else {
            p.noStroke(); p.fill(color[0], color[1], color[2], 150 * curtainAlpha);
            p.beginShape(); p.vertex(x, y - height * .5); p.bezierVertex(x - height * .24, y - height * .1, x - height * .2, y + height * .45, x, y + height * .5); p.bezierVertex(x + height * .2, y + height * .45, x + height * .24, y - height * .1, x, y - height * .5); p.endShape(p.CLOSE);
          }
        }
      }
      p.noTint(); p.imageMode(p.CORNER);
      p.noStroke(); p.fill(31, 47, 74, 150); p.textFont('Georgia'); p.textSize(Math.max(7, p.width * .02));
      p.text('after rain / the light remains', p.width * .54, p.height * .91, p.width * .38);
    };

    const growBranches = () => {
      branchFrame += 1;
      for (const branch of [...branches]) {
        if (branch.grown >= branch.target) {
          if (!branch.split && branch.level < 4) {
            branch.split = true;
            const tip = branch.points[branch.points.length - 1];
            const spread = .48 * Math.pow(.8, branch.level - 1);
            for (const side of [-1, 1]) {
              const child = new GrowingBranch(tip.x, tip.y, branch.angle + side * spread, branch.level + 1, Math.max(7, Math.floor(branch.target * .55)), branch.seed + side * 11);
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
      const height = clamp01((p.height * .79 - point.y) / p.height);
      return reducedMotion ? 0 : p.sin(p.frameCount * .025 + seed + point.y / 90) * 3.2 * height;
    };

    const drawBranches = () => {
      p.background(193, 225, 218);
      p.noStroke();
      p.fill(31, 42, 40, 180);
      p.textFont('Georgia');
      p.textSize(Math.max(6, p.width * .018));
      const fragments = ['MEMORY / GROWTH', 'THE BRANCH KNOWS LIGHT', 'A SMALL UPWARD THING', 'PEANUP STUDY 02'];
      fragments.forEach((text, index) => p.text(text, 10 + (index % 2) * p.width * .52, 24 + index * 31, p.width * .42));
      if (!reducedMotion || branchFrame < 180) {
        growBranches();
        growBranches();
        growBranches();
      }
      for (const branch of branches) {
        if (branch.points.length < 2) continue;
        p.noFill();
        p.stroke(45, 41, 36, 215);
        p.strokeWeight(Math.max(1.05, 2.45 - branch.level * .3));
        p.beginShape();
        branch.points.forEach((point) => p.vertex(point.x + branchOffset(point, branch.seed), point.y));
        p.endShape();
      }
      const colors = [[210, 67, 53], [226, 174, 37], [92, 139, 80]];
      for (const flower of flowers) {
        const point = flower.branch.points[flower.index];
        if (!point) continue;
        const bloom = clamp01((branchFrame - flower.born) / 45);
        const color = colors[(flower.index + flower.branch.level) % colors.length];
        p.noStroke();
        p.fill(color[0], color[1], color[2], 205 * bloom);
        p.circle(point.x + branchOffset(point, flower.branch.seed), point.y, p.lerp(1, flower.size, 1 - Math.pow(1 - bloom, 3)));
      }
      p.noStroke();
      p.fill(245, 239, 202);
      p.beginShape();
      p.vertex(p.width * .43, p.height * .74);
      p.bezierVertex(p.width * .42, p.height * .82, p.width * .34, p.height * .9, p.width * .36, p.height * .98);
      p.vertex(p.width * .64, p.height * .98);
      p.bezierVertex(p.width * .66, p.height * .9, p.width * .58, p.height * .82, p.width * .57, p.height * .74);
      p.endShape(p.CLOSE);
      p.stroke(45, 41, 36, 150);
      p.strokeWeight(1.1);
      p.line(p.width * .43, p.height * .74, p.width * .57, p.height * .74);
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
      p.background(239, 233, 218);
      p.fill(20, 20, 18, 230);
      p.noStroke();
      p.textFont('Georgia');
      p.textAlign(p.CENTER);
      p.textSize(Math.max(13, p.width * .055));
      p.text('Beyond the strings', p.width * .5, p.height * .13);
      p.textSize(Math.max(5, p.width * .014));
      p.text('the wind passes between notes / study 03', p.width * .5, p.height * .155);
      p.textAlign(p.LEFT);
      p.stroke(38, 38, 35, 170);
      p.strokeWeight(.75);
      const staffTop = p.height * .28;
      for (let staff = 0; staff < 5; staff += 1) {
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
          p.noStroke(); p.fill(30, 30, 28, 220); p.ellipse(x, y, 4, 3); p.stroke(30, 30, 28, 220); p.line(x + 2, y, x + 2, y - 10);
        }
      }
      p.noFill();
      p.stroke(98, 32, 30, 54);
      p.strokeWeight(.45);
      for (let stringIndex = 0; stringIndex < 12; stringIndex += 1) {
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

    const drawRefresh = () => {
      const elapsed = p.millis() - refreshStartedAt;
      if (elapsed < 0 || elapsed > 720) return;
      const t = 1 - Math.pow(1 - clamp01(elapsed / 720), 3);
      const scanY = p.lerp(p.height, 0, t);
      p.noStroke();
      p.fill(244, 241, 232, 242);
      p.rect(0, 0, p.width, scanY);
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
    };

    p.preload = () => {
      rainDropImages = rainDropUrls.map((url) => p.loadImage(url, undefined, () => undefined));
    };

    p.draw = () => {
      p.background(244, 241, 232);
      const scroll = progress();
      setPhase(scroll < .335 ? 'rain' : scroll < .67 ? 'branch' : 'bird');
      const rainReveal = clamp01(scroll / .28);
      const birdScroll = clamp01((scroll - .67) / .3);
      if (currentPhase === 'rain') drawRain(rainReveal);
      else if (currentPhase === 'branch') drawBranches();
      else drawBirds(birdScroll);
      drawPaperSurface();
      applyEpaperMaterial();
      drawRefresh();
    };
  }, mount);
}
