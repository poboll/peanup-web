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
    let branches: GrowingBranch[] = [];
    let flowers: Flower[] = [];
    let swallows: Swallow[] = [];
    let branchFrame = 0;
    let birdStartedAt = 0;
    let refreshStartedAt = -1000;
    let currentPhase: keyof typeof phaseNames = 'rain';

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
      if (phase === 'bird') birdStartedAt = p.millis();
      refreshStartedAt = p.millis();
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
      birdStartedAt = p.millis();
    };

    const sizeCanvas = () => {
      const rect = mount.getBoundingClientRect();
      if (!p.canvas) p.createCanvas(rect.width, rect.height);
      else p.resizeCanvas(rect.width, rect.height);
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 1.5));
      resetBranches();
      buildBirds();
    };

    const drawRain = (reveal: number) => {
      p.background(232, 229, 216);
      p.noStroke();
      p.fill(216, 226, 220, 170); p.rect(0, p.height * .07, p.width, p.height * .18);
      p.fill(205, 220, 235, 190); p.rect(0, p.height * .34, p.width, p.height * .13);
      p.fill(238, 209, 204, 185); p.rect(p.width * .55, p.height * .47, p.width * .45, p.height * .13);
      p.fill(232, 215, 111, 190); p.rect(0, p.height * .66, p.width * .64, p.height * .14);
      p.fill(34, 69, 131, 245);
      const cloudBank = [
        [.16, .255, .2, .105], [.28, .225, .25, .145], [.42, .255, .23, .12],
        [.55, .215, .29, .16], [.69, .25, .24, .125], [.82, .225, .21, .11],
      ];
      cloudBank.forEach(([x, y, width, height]) => p.ellipse(p.width * x, p.height * y, p.width * width, p.height * height));
      const colors = [[18,18,18], [244,241,232], [226,174,37], [210,67,53], [48,102,178], [92,139,80]];
      p.noStroke();
      for (let line = 0; line < 48; line += 1) {
        const x = p.map(line, 0, 47, p.width * .12, p.width * .88);
        const stagger = (line % 9) * .025 + p.noise(line * .73) * .13;
        for (let dropIndex = 0; dropIndex < 5; dropIndex += 1) {
          const fall = clamp01(reveal * 1.55 - stagger - dropIndex * .075);
          if (fall <= 0 || fall >= 1) continue;
          const eased = fall * fall;
          const cloudBottom = p.height * (.27 + p.noise(line * .31) * .055);
          const y = p.lerp(cloudBottom, p.height * 1.08, eased);
          const size = 3.5 + ((line * 7 + dropIndex * 11) % 9);
          const color = colors[(line + dropIndex * 2) % colors.length];
          p.fill(color[0], color[1], color[2], 225 * p.sin(fall * p.PI));
          p.ellipse(x + p.sin(line * 1.7) * 2, y, size * .72, size * 1.55);
        }
      }
      p.noStroke();
      p.fill(31, 47, 74, 175);
      p.textFont('Georgia');
      p.textSize(Math.max(7, p.width * .022));
      p.text('the rain keeps a small piece of today', p.width * .35, p.height * .84, p.width * .58);
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
      const flap = .2 + (p.sin(p.frameCount * .22 + bird.phase) + 1) * .4;
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
      p.text('Control', p.width * .5, p.height * .13);
      p.textSize(Math.max(5, p.width * .014));
      p.text('listen to the quiet between notes', p.width * .5, p.height * .155);
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
            const pulse = p.sin(t * p.TWO_PI * (1.35 + staff * .08) - p.frameCount * .085 - line * .42);
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
      p.stroke(210, 67, 53, 92);
      p.strokeWeight(.6);
      for (let stringIndex = 0; stringIndex < 18; stringIndex += 1) {
        const x = p.map(stringIndex, 0, 17, p.width * .18, p.width * .82);
        p.beginShape();
        for (let step = 0; step <= 20; step += 1) {
          const t = step / 20;
          const spread = (t - .5) * (stringIndex - 8.5) * .7;
          const vibration = p.sin(t * p.PI * 3 - p.frameCount * .1 + stringIndex) * 2.5 * p.sin(t * p.PI);
          p.vertex(x + spread + vibration, p.lerp(p.height * .86, p.height * .2, t));
        }
        p.endShape();
      }
      const cycle = reducedMotion ? 2600 : 6000;
      const elapsed = (p.millis() - birdStartedAt) % cycle;
      for (const bird of swallows) {
        const local = elapsed - bird.delay;
        if (local < 0 || local > bird.duration) continue;
        drawSwallow(bird, local / bird.duration);
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

    p.draw = () => {
      p.background(244, 241, 232);
      const scroll = progress();
      setPhase(scroll < .335 ? 'rain' : scroll < .67 ? 'branch' : 'bird');
      const rainReveal = clamp01(scroll / .28);
      const birdScroll = clamp01((scroll - .67) / .3);
      if (currentPhase === 'rain') drawRain(rainReveal);
      else if (currentPhase === 'branch') drawBranches();
      else drawBirds(birdScroll);
      drawRefresh();
    };
  }, mount);
}
