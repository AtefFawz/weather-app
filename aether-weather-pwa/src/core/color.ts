export type RGB = readonly [number, number, number];

export function hexToRgb(hex: string): RGB {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n) || full.length !== 6) throw new RangeError(`Invalid hex colour: ${hex}`);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  const part = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Linear blend of two RGB colours. */
export function mixRgb(a: RGB, b: RGB, t: number): RGB {
  const k = clamp(t, 0, 1);
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
}

/** Relative luminance (WCAG 2.x). */
export function luminance([r, g, b]: RGB): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
