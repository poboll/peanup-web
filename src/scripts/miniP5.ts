type Sketch = (instance: MiniP5) => void;
type Lifecycle = () => void;
type ImageCallback = (image: MiniImage) => void;
type ImageErrorCallback = (event: Event) => void;

type Paint = {
  css: string;
  red: number;
  green: number;
  blue: number;
  alpha: number;
};

type DrawingState = {
  fillEnabled: boolean;
  fillStyle: string;
  strokeEnabled: boolean;
  strokeStyle: string;
  strokeWidth: number;
  fontFamily: string;
  fontSize: number;
  horizontalAlign: CanvasTextAlign;
  verticalAlign: CanvasTextBaseline;
  imageAnchor: 'corner' | 'center';
  tint: Paint | null;
};

export class MiniImage {
  readonly element: HTMLImageElement;
  width = 0;
  height = 0;

  constructor(element: HTMLImageElement) {
    this.element = element;
  }
}

const clampChannel = (value: number) => Math.max(0, Math.min(255, value));

const paintFrom = (values: number[]): Paint => {
  let red = 0;
  let green = 0;
  let blue = 0;
  let alpha = 255;

  if (values.length === 1) {
    red = green = blue = values[0];
  } else if (values.length === 2) {
    red = green = blue = values[0];
    alpha = values[1];
  } else {
    [red = 0, green = 0, blue = 0, alpha = 255] = values;
  }

  red = clampChannel(red);
  green = clampChannel(green);
  blue = clampChannel(blue);
  alpha = clampChannel(alpha);

  return {
    red,
    green,
    blue,
    alpha,
    css: `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`,
  };
};

/** The small instance-mode subset used by heroSketch, without the full p5 runtime. */
export default class MiniP5 {
  readonly PI = Math.PI;
  readonly TWO_PI = Math.PI * 2;
  readonly HALF_PI = Math.PI / 2;
  readonly CENTER = 'center' as const;
  readonly CORNER = 'corner' as const;
  readonly CLOSE = 'close' as const;
  readonly LEFT = 'left' as const;
  readonly RIGHT = 'right' as const;
  readonly TOP = 'top' as const;

  width = 100;
  height = 100;
  frameCount = 0;
  canvas?: HTMLCanvasElement;
  setup?: Lifecycle;
  preload?: Lifecycle;
  draw?: Lifecycle;

  private readonly mount: HTMLElement;
  private context?: CanvasRenderingContext2D;
  private density = 1;
  private targetFrameRate = 60;
  private animationFrame = 0;
  private lastDrawAt = 0;
  private startedAt = performance.now();
  private ready = false;
  private looping = true;
  private redrawPending = false;
  private canvasVisible = true;
  private viewportObserver?: IntersectionObserver;
  private randomState = Math.floor(Math.random() * 0x100000000) >>> 0;
  private pendingLoads: Promise<void>[] = [];
  private shapeStarted = false;
  private stateStack: DrawingState[] = [];
  private tintCache = new WeakMap<MiniImage, Map<string, HTMLCanvasElement>>();
  private state: DrawingState = {
    fillEnabled: true,
    fillStyle: 'rgba(255, 255, 255, 1)',
    strokeEnabled: true,
    strokeStyle: 'rgba(0, 0, 0, 1)',
    strokeWidth: 1,
    fontFamily: 'sans-serif',
    fontSize: 12,
    horizontalAlign: 'left',
    verticalAlign: 'alphabetic',
    imageAnchor: 'corner',
    tint: null,
  };

  constructor(sketch: Sketch, mount: HTMLElement | string) {
    const target = typeof mount === 'string' ? document.querySelector<HTMLElement>(mount) : mount;
    if (!target) throw new Error('MiniP5 mount element was not found.');
    this.mount = target;
    sketch(this);
    queueMicrotask(() => this.boot());
  }

  get drawingContext(): CanvasRenderingContext2D {
    if (!this.context) throw new Error('Canvas has not been created yet.');
    return this.context;
  }

  private async boot() {
    this.preload?.();
    await Promise.allSettled(this.pendingLoads);
    this.startedAt = performance.now();
    this.setup?.();
    this.ready = true;
    if (this.redrawPending) this.scheduleFrame();
    this.scheduleFrame();
  }

  private scheduleFrame() {
    if (!this.ready || (!this.looping && !this.redrawPending) || !this.canvasVisible || document.hidden || this.animationFrame) return;
    this.animationFrame = requestAnimationFrame(this.renderFrame);
  }

  private renderFrame = (timestamp: number) => {
    this.animationFrame = 0;
    if ((!this.looping && !this.redrawPending) || !this.canvasVisible || document.hidden) return;

    const interval = 1000 / this.targetFrameRate;
    if (!this.lastDrawAt || timestamp - this.lastDrawAt >= interval - 0.5) {
      const elapsed = this.lastDrawAt ? timestamp - this.lastDrawAt : interval;
      this.lastDrawAt = timestamp - (elapsed % interval);
      this.frameCount += 1;
      this.redrawPending = false;
      this.draw?.();
    }

    this.scheduleFrame();
  };

  private configureCanvas(width: number, height: number) {
    if (!this.canvas) return;
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.canvas.width = Math.max(1, Math.round(this.width * this.density));
    this.canvas.height = Math.max(1, Math.round(this.height * this.density));
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.context = this.canvas.getContext('2d', { willReadFrequently: true }) ?? undefined;
    if (!this.context) throw new Error('Canvas 2D is not available.');
    this.context.setTransform(this.density, 0, 0, this.density, 0, 0);
    this.context.lineCap = 'round';
    this.applyState();
  }

  private applyState() {
    if (!this.context) return;
    this.context.fillStyle = this.state.fillStyle;
    this.context.strokeStyle = this.state.strokeStyle;
    this.context.lineWidth = this.state.strokeWidth;
    this.context.textAlign = this.state.horizontalAlign;
    this.context.textBaseline = this.state.verticalAlign;
    this.context.font = this.fontDeclaration();
  }

  private fontDeclaration() {
    const family = this.state.fontFamily.replaceAll('"', '\\"');
    return `${this.state.fontSize}px "${family}"`;
  }

  private drawPath() {
    if (!this.context) return;
    if (this.state.fillEnabled) this.context.fill();
    if (this.state.strokeEnabled) this.context.stroke();
  }

  private wrapText(value: string, maxWidth: number) {
    if (!this.context || maxWidth <= 0) return [value];
    const lines: string[] = [];

    for (const paragraph of value.replaceAll('\r', '').split('\n')) {
      if (!paragraph) {
        lines.push('');
        continue;
      }

      const tokens = paragraph.match(/\s+|[^\s]+/gu) ?? [paragraph];
      let line = '';
      for (const token of tokens) {
        const candidate = line + token;
        if (!line || this.context.measureText(candidate).width <= maxWidth) {
          line = candidate;
          continue;
        }
        lines.push(line.trimEnd());
        line = '';
        if (this.context.measureText(token).width <= maxWidth) {
          line = token.trimStart();
          continue;
        }
        for (const character of Array.from(token)) {
          if (line && this.context.measureText(line + character).width > maxWidth) {
            lines.push(line);
            line = '';
          }
          line += character;
        }
      }
      lines.push(line.trimEnd());
    }

    return lines;
  }

  private tintedSource(image: MiniImage, tint: Paint) {
    let variants = this.tintCache.get(image);
    if (!variants) {
      variants = new Map();
      this.tintCache.set(image, variants);
    }
    const key = `${Math.round(tint.red)},${Math.round(tint.green)},${Math.round(tint.blue)}`;
    const cached = variants.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return image.element;
    context.drawImage(image.element, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height);
    for (let index = 0; index < pixels.data.length; index += 4) {
      pixels.data[index] = pixels.data[index] * tint.red / 255;
      pixels.data[index + 1] = pixels.data[index + 1] * tint.green / 255;
      pixels.data[index + 2] = pixels.data[index + 2] * tint.blue / 255;
    }
    context.putImageData(pixels, 0, 0);
    variants.set(key, canvas);
    return canvas;
  }

  pixelDensity(value?: number) {
    if (value === undefined) return this.density;
    this.density = Math.max(1, value);
    return this.density;
  }

  createCanvas(width: number, height: number) {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'p5Canvas';
      this.mount.append(this.canvas);
      if ('IntersectionObserver' in window) {
        this.viewportObserver = new IntersectionObserver(([entry]) => {
          const visible = Boolean(entry?.isIntersecting);
          if (visible === this.canvasVisible) return;
          this.canvasVisible = visible;
          if (!visible && this.animationFrame) cancelAnimationFrame(this.animationFrame);
          this.animationFrame = 0;
          this.lastDrawAt = 0;
          if (visible) this.scheduleFrame();
        }, { rootMargin: '200px' });
        this.viewportObserver.observe(this.canvas);
      }
    }
    this.configureCanvas(width, height);
    return this.canvas;
  }

  resizeCanvas(width: number, height: number) {
    this.configureCanvas(width, height);
  }

  frameRate(value?: number) {
    if (value !== undefined && value > 0) this.targetFrameRate = value;
    return this.targetFrameRate;
  }

  noLoop() {
    this.looping = false;
    if (!this.redrawPending) {
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
  }

  loop() {
    const wasLooping = this.looping;
    this.looping = true;
    if (!wasLooping) this.lastDrawAt = 0;
    this.scheduleFrame();
  }

  redraw() {
    this.redrawPending = true;
    this.scheduleFrame();
  }

  millis() {
    return performance.now() - this.startedAt;
  }

  loadImage(url: string, onLoad?: ImageCallback, onError?: ImageErrorCallback) {
    const element = new Image();
    element.decoding = 'async';
    const image = new MiniImage(element);
    const pending = new Promise<void>((resolve) => {
      element.addEventListener('load', () => {
        image.width = element.naturalWidth;
        image.height = element.naturalHeight;
        onLoad?.(image);
        resolve();
      }, { once: true });
      element.addEventListener('error', (event) => {
        onError?.(event);
        resolve();
      }, { once: true });
    });
    this.pendingLoads.push(pending);
    element.src = url;
    return image;
  }

  background(...values: number[]) {
    if (!this.context) return;
    const color = paintFrom(values);
    this.context.save();
    this.context.setTransform(this.density, 0, 0, this.density, 0, 0);
    this.context.fillStyle = color.css;
    this.context.fillRect(0, 0, this.width, this.height);
    this.context.restore();
  }

  fill(...values: number[]) {
    const color = paintFrom(values);
    this.state.fillEnabled = true;
    this.state.fillStyle = color.css;
    if (this.context) this.context.fillStyle = color.css;
  }

  noFill() {
    this.state.fillEnabled = false;
  }

  stroke(...values: number[]) {
    const color = paintFrom(values);
    this.state.strokeEnabled = true;
    this.state.strokeStyle = color.css;
    if (this.context) this.context.strokeStyle = color.css;
  }

  noStroke() {
    this.state.strokeEnabled = false;
  }

  strokeWeight(value: number) {
    this.state.strokeWidth = value;
    if (this.context) this.context.lineWidth = value;
  }

  line(x1: number, y1: number, x2: number, y2: number) {
    if (!this.context || !this.state.strokeEnabled) return;
    this.context.beginPath();
    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.stroke();
  }

  rect(x: number, y: number, width: number, height: number) {
    if (!this.context) return;
    this.context.beginPath();
    this.context.rect(x, y, width, height);
    this.drawPath();
  }

  ellipse(x: number, y: number, width: number, height: number) {
    if (!this.context) return;
    this.context.beginPath();
    this.context.ellipse(x, y, Math.abs(width) / 2, Math.abs(height) / 2, 0, 0, this.TWO_PI);
    this.drawPath();
  }

  circle(x: number, y: number, diameter: number) {
    this.ellipse(x, y, diameter, diameter);
  }

  beginShape() {
    if (!this.context) return;
    this.context.beginPath();
    this.shapeStarted = false;
  }

  vertex(x: number, y: number) {
    if (!this.context) return;
    if (!this.shapeStarted) {
      this.context.moveTo(x, y);
      this.shapeStarted = true;
    } else {
      this.context.lineTo(x, y);
    }
  }

  bezierVertex(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
    if (!this.context) return;
    this.context.bezierCurveTo(x1, y1, x2, y2, x3, y3);
    this.shapeStarted = true;
  }

  endShape(mode?: string) {
    if (!this.context) return;
    if (mode === this.CLOSE) this.context.closePath();
    this.drawPath();
    this.shapeStarted = false;
  }

  push() {
    if (!this.context) return;
    this.context.save();
    this.stateStack.push({ ...this.state, tint: this.state.tint ? { ...this.state.tint } : null });
  }

  pop() {
    if (!this.context) return;
    this.context.restore();
    const previous = this.stateStack.pop();
    if (previous) this.state = previous;
  }

  translate(x: number, y: number) {
    this.context?.translate(x, y);
  }

  rotate(angle: number) {
    this.context?.rotate(angle);
  }

  scale(x: number, y = x) {
    this.context?.scale(x, y);
  }

  imageMode(mode: 'corner' | 'center') {
    this.state.imageAnchor = mode;
  }

  tint(...values: number[]) {
    this.state.tint = paintFrom(values);
  }

  noTint() {
    this.state.tint = null;
  }

  image(
    image: MiniImage,
    x: number,
    y: number,
    width = image.width,
    height = image.height,
    sourceX = 0,
    sourceY = 0,
    sourceWidth = image.width,
    sourceHeight = image.height,
  ) {
    if (!this.context || !image.width || !image.height || width === 0 || height === 0) return;
    const drawX = this.state.imageAnchor === 'center' ? x - width / 2 : x;
    const drawY = this.state.imageAnchor === 'center' ? y - height / 2 : y;
    const source = this.state.tint ? this.tintedSource(image, this.state.tint) : image.element;
    this.context.save();
    if (this.state.tint) this.context.globalAlpha *= this.state.tint.alpha / 255;
    this.context.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, drawX, drawY, width, height);
    this.context.restore();
  }

  textFont(family: string) {
    this.state.fontFamily = family;
    if (this.context) this.context.font = this.fontDeclaration();
  }

  textSize(size: number) {
    this.state.fontSize = size;
    if (this.context) this.context.font = this.fontDeclaration();
    return size;
  }

  textAlign(horizontal: 'left' | 'center' | 'right', vertical?: 'top' | 'center') {
    this.state.horizontalAlign = horizontal;
    if (vertical) this.state.verticalAlign = vertical === 'center' ? 'middle' : vertical;
    if (!this.context) return;
    this.context.textAlign = this.state.horizontalAlign;
    this.context.textBaseline = this.state.verticalAlign;
  }

  text(value: string | number, x: number, y: number, maxWidth?: number, maxHeight?: number) {
    if (!this.context) return;
    const text = String(value);
    const lines = maxWidth === undefined ? text.replaceAll('\r', '').split('\n') : this.wrapText(text, maxWidth);
    const lineHeight = this.state.fontSize * 1.25;
    const maxLines = maxHeight === undefined ? lines.length : Math.max(1, Math.floor(maxHeight / lineHeight));
    const drawX = maxWidth === undefined
      ? x
      : this.state.horizontalAlign === 'center'
        ? x + maxWidth / 2
        : this.state.horizontalAlign === 'right'
          ? x + maxWidth
          : x;

    lines.slice(0, maxLines).forEach((line, index) => {
      const drawY = y + index * lineHeight;
      if (this.state.fillEnabled) this.context?.fillText(line, drawX, drawY);
      if (this.state.strokeEnabled) this.context?.strokeText(line, drawX, drawY);
    });
  }

  randomSeed(seed: number) {
    this.randomState = seed >>> 0;
  }

  random(min?: number, max?: number) {
    this.randomState = (Math.imul(1664525, this.randomState) + 1013904223) >>> 0;
    const value = this.randomState / 0x100000000;
    if (min === undefined) return value;
    if (max === undefined) return value * min;
    return min + value * (max - min);
  }

  map(value: number, start1: number, stop1: number, start2: number, stop2: number) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
  }

  lerp(start: number, stop: number, amount: number) {
    return start + (stop - start) * amount;
  }

  constrain(value: number, low: number, high: number) {
    return Math.min(Math.max(value, low), high);
  }

  sin(value: number) { return Math.sin(value); }
  cos(value: number) { return Math.cos(value); }
  atan2(y: number, x: number) { return Math.atan2(y, x); }
  floor(value: number) { return Math.floor(value); }
}
