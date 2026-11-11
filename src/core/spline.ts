export interface Point {
  x: number;
  y: number;
}

/**
 * Monotone cubic interpolation (Fritsch–Carlson). Unlike a Catmull-Rom or plain cubic spline it never
 * overshoots the data, so a temperature curve can't dip below a real minimum between two samples.
 * Returns the tangent slope at every point.
 */
export function monotoneTangents(points: readonly Point[]): number[] {
  const n = points.length;
  if (n < 2) return new Array<number>(n).fill(0);

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    const a = points[i] as Point;
    const b = points[i + 1] as Point;
    const step = b.x - a.x;
    dx.push(step);
    slope.push(step === 0 ? 0 : (b.y - a.y) / step);
  }

  const tangents: number[] = new Array<number>(n).fill(0);
  tangents[0] = slope[0] as number;
  tangents[n - 1] = slope[n - 2] as number;
  for (let i = 1; i < n - 1; i += 1) {
    const prev = slope[i - 1] as number;
    const next = slope[i] as number;
    tangents[i] = prev * next <= 0 ? 0 : (prev + next) / 2;
  }

  for (let i = 0; i < n - 1; i += 1) {
    const m = slope[i] as number;
    if (m === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = (tangents[i] as number) / m;
    const b = (tangents[i + 1] as number) / m;
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      tangents[i] = tau * a * m;
      tangents[i + 1] = tau * b * m;
    }
  }
  return tangents;
}

const fmt = (value: number) => Number(value.toFixed(2));

/** SVG path data (`M … C …`) through the points. */
export function monotonePath(points: readonly Point[]): string {
  if (points.length === 0) return "";
  const first = points[0] as Point;
  if (points.length === 1) return `M${fmt(first.x)},${fmt(first.y)}`;

  const tangents = monotoneTangents(points);
  let path = `M${fmt(first.x)},${fmt(first.y)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i] as Point;
    const p1 = points[i + 1] as Point;
    const h = (p1.x - p0.x) / 3;
    path += `C${fmt(p0.x + h)},${fmt(p0.y + h * (tangents[i] as number))},${fmt(p1.x - h)},${fmt(p1.y - h * (tangents[i + 1] as number))},${fmt(p1.x)},${fmt(p1.y)}`;
  }
  return path;
}

/** Evaluate the interpolated curve at an arbitrary x (used for the scrub cursor). */
export function monotoneValueAt(points: readonly Point[], x: number): number {
  if (points.length === 0) return Number.NaN;
  const first = points[0] as Point;
  const last = points[points.length - 1] as Point;
  if (x <= first.x) return first.y;
  if (x >= last.x) return last.y;

  const tangents = monotoneTangents(points);
  let i = 0;
  while (i < points.length - 2 && (points[i + 1] as Point).x < x) i += 1;
  const p0 = points[i] as Point;
  const p1 = points[i + 1] as Point;
  const h = p1.x - p0.x;
  const t = (x - p0.x) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * p0.y +
    (t3 - 2 * t2 + t) * h * (tangents[i] as number) +
    (-2 * t3 + 3 * t2) * p1.y +
    (t3 - t2) * h * (tangents[i + 1] as number)
  );
}
