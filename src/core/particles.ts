import { clamp } from "./color";
import { createRng } from "./random";

export type ParticleKind = "rain" | "snow";

export interface ParticleConfig {
  kind: ParticleKind;
  /** 0–1 */
  intensity: number;
  /** Wind in km/h; slants the fall. */
  wind: number;
  width: number;
  height: number;
  seed?: number;
}

/**
 * Struct-of-arrays particle pool. All state lives in typed arrays so a frame allocates nothing,
 * and the simulation is separate from drawing so it can be unit-tested without a canvas.
 */
export class ParticleSystem {
  readonly kind: ParticleKind;
  readonly count: number;
  readonly x: Float32Array;
  readonly y: Float32Array;
  /** Per-particle depth 0.3–1: scales speed, size and opacity for parallax. */
  readonly depth: Float32Array;
  readonly sway: Float32Array;
  private width: number;
  private height: number;
  private readonly slant: number;
  private readonly rng: () => number;
  private time = 0;

  constructor(config: ParticleConfig) {
    this.kind = config.kind;
    this.width = Math.max(1, config.width);
    this.height = Math.max(1, config.height);
    this.rng = createRng(config.seed ?? 1);

    const area = (this.width * this.height) / (1280 * 720);
    const perArea = config.kind === "rain" ? 420 : 160;
    this.count = Math.round(clamp(perArea * clamp(config.intensity, 0, 1) * clamp(area, 0.35, 2.2), 0, 1200));

    // Positive slant pushes particles to the right; capped so heavy wind stays readable.
    this.slant = clamp(config.wind / 60, 0, 1) * (config.kind === "rain" ? 0.45 : 0.9);

    this.x = new Float32Array(this.count);
    this.y = new Float32Array(this.count);
    this.depth = new Float32Array(this.count);
    this.sway = new Float32Array(this.count);
    for (let i = 0; i < this.count; i += 1) {
      this.x[i] = this.rng() * this.width;
      this.y[i] = this.rng() * this.height;
      this.depth[i] = 0.3 + this.rng() * 0.7;
      this.sway[i] = this.rng() * Math.PI * 2;
    }
  }

  get size(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  resize(width: number, height: number): void {
    const sx = Math.max(1, width) / this.width;
    const sy = Math.max(1, height) / this.height;
    for (let i = 0; i < this.count; i += 1) {
      this.x[i] = (this.x[i] as number) * sx;
      this.y[i] = (this.y[i] as number) * sy;
    }
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
  }

  /** Advance by `dt` seconds (clamped so a background tab resuming doesn't teleport everything). */
  step(dt: number): void {
    const delta = clamp(dt, 0, 0.05);
    this.time += delta;
    const rain = this.kind === "rain";
    const speed = rain ? 900 : 70;

    for (let i = 0; i < this.count; i += 1) {
      const d = this.depth[i] as number;
      let x = this.x[i] as number;
      let y = this.y[i] as number;

      y += speed * d * delta;
      x +=
        (rain ? speed * d * this.slant : speed * 1.4 * this.slant * d + Math.sin(this.time * 1.3 + (this.sway[i] as number)) * 18) * delta;

      if (y > this.height + 20) {
        y = -20;
        x = this.rng() * (this.width + this.height * this.slant);
      }
      if (x > this.width + 20) x -= this.width + 40;
      if (x < -20) x += this.width + 40;

      this.x[i] = x;
      this.y[i] = y;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, this.width, this.height);
    if (this.kind === "rain") {
      ctx.lineCap = "round";
      for (let i = 0; i < this.count; i += 1) {
        const d = this.depth[i] as number;
        const x = this.x[i] as number;
        const y = this.y[i] as number;
        const length = 10 + 22 * d;
        ctx.strokeStyle = `rgba(200, 222, 255, ${0.12 + 0.34 * d})`;
        ctx.lineWidth = 0.6 + d * 0.9;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - length * this.slant, y - length);
        ctx.stroke();
      }
    } else {
      for (let i = 0; i < this.count; i += 1) {
        const d = this.depth[i] as number;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + 0.55 * d})`;
        ctx.beginPath();
        ctx.arc(this.x[i] as number, this.y[i] as number, 0.8 + d * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
