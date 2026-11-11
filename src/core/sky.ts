import { clamp, hexToRgb, lerp, mixRgb, rgbToHex, type RGB } from "./color";
import { getCondition } from "./wmo";

/** What the sky renderer needs to know about the weather at a moment in time. */
export interface Scene {
  /** 0 (clear) – 1 (solid overcast). */
  cloud: number;
  precip: "none" | "rain" | "snow";
  /** 0–1 */
  intensity: number;
  fog: number;
  lightning: boolean;
  /** Wind speed in km/h; drives particle slant. */
  wind: number;
}

export interface SceneInput {
  weatherCode: number | null | undefined;
  /** Cloud cover percentage, if known. */
  cloudCover?: number | null | undefined;
  windKmh?: number | null | undefined;
}

export function sceneFor({ weatherCode, cloudCover, windKmh }: SceneInput): Scene {
  const condition = getCondition(weatherCode);
  const measured = typeof cloudCover === "number" && Number.isFinite(cloudCover) ? clamp(cloudCover / 100, 0, 1) : null;
  // A precipitating code implies thick cloud even if a cover reading disagrees.
  const cloud = measured === null ? condition.cloud : condition.precip !== "none" ? Math.max(measured, condition.cloud * 0.9) : measured;
  return {
    cloud,
    precip: condition.precip,
    intensity: condition.intensity,
    fog: condition.fog,
    lightning: condition.lightning,
    wind: typeof windKmh === "number" && Number.isFinite(windKmh) ? Math.max(0, windKmh) : 0,
  };
}

interface Stop {
  /** Solar elevation in degrees at which this palette applies. */
  elevation: number;
  top: string;
  mid: string;
  bottom: string;
}

/** Keyframes from deep night to high noon; colours between them are interpolated by elevation. */
const KEYFRAMES: readonly Stop[] = [
  { elevation: -18, top: "#04060e", mid: "#080f22", bottom: "#101a36" },
  { elevation: -12, top: "#0a1230", mid: "#18224c", bottom: "#2a3768" },
  { elevation: -6, top: "#1a2866", mid: "#54529a", bottom: "#d7877f" },
  { elevation: -0.8, top: "#2b4a94", mid: "#d98f78", bottom: "#ffc98a" },
  { elevation: 8, top: "#2c70c6", mid: "#68a4e4", bottom: "#f4d9a4" },
  { elevation: 25, top: "#2271c9", mid: "#4c9ce4", bottom: "#a2d2f6" },
  { elevation: 90, top: "#1a68c0", mid: "#3d92e0", bottom: "#8cc6f3" },
];

const parsed = KEYFRAMES.map((k) => ({ elevation: k.elevation, top: hexToRgb(k.top), mid: hexToRgb(k.mid), bottom: hexToRgb(k.bottom) }));

export interface SkyColors {
  top: string;
  mid: string;
  bottom: string;
  /** 0 (night) – 1 (full daylight). Drives UI scrims and star visibility. */
  daylight: number;
  /** 0–1 star opacity, reduced by cloud and daylight. */
  stars: number;
}

/** Interpolate the clear-sky palette for a solar elevation. */
export function clearSkyPalette(elevation: number): { top: RGB; mid: RGB; bottom: RGB } {
  const first = parsed[0]!;
  const last = parsed[parsed.length - 1]!;
  if (elevation <= first.elevation) return { top: first.top, mid: first.mid, bottom: first.bottom };
  if (elevation >= last.elevation) return { top: last.top, mid: last.mid, bottom: last.bottom };

  let index = 0;
  while (index < parsed.length - 2 && (parsed[index + 1] as (typeof parsed)[number]).elevation < elevation) index += 1;
  const a = parsed[index] as (typeof parsed)[number];
  const b = parsed[index + 1] as (typeof parsed)[number];
  // Smoothstep so changes ease in/out around each keyframe instead of moving linearly.
  const raw = (elevation - a.elevation) / (b.elevation - a.elevation);
  const t = raw * raw * (3 - 2 * raw);
  return { top: mixRgb(a.top, b.top, t), mid: mixRgb(a.mid, b.mid, t), bottom: mixRgb(a.bottom, b.bottom, t) };
}

const luma = ([r, g, b]: RGB) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Desaturate toward a same-brightness grey, then optionally darken. */
function overcast(color: RGB, amount: number, darken: number): RGB {
  const l = luma(color);
  const grey: RGB = [l, l * 1.03, l * 1.08];
  const mixed = mixRgb(color, grey, amount);
  return [mixed[0] * (1 - darken), mixed[1] * (1 - darken), mixed[2] * (1 - darken)];
}

export function skyFor(elevation: number, scene: Scene): SkyColors {
  const clear = clearSkyPalette(elevation);
  const daylight = clamp((elevation + 6) / 18, 0, 1);

  const grey = clamp(scene.cloud * 0.72 + scene.fog * 0.15, 0, 0.88);
  const stormy = scene.lightning ? 0.28 : scene.precip !== "none" ? 0.1 + scene.intensity * 0.14 : scene.cloud * 0.06;

  const fogColor: RGB = hexToRgb(daylight > 0.3 ? "#b6c0c9" : "#2b3342");
  const apply = (color: RGB, depth: number): RGB => {
    const dimmed = overcast(color, grey, stormy * depth);
    return scene.fog > 0 ? mixRgb(dimmed, fogColor, scene.fog * 0.55) : dimmed;
  };

  return {
    top: rgbToHex(apply(clear.top, 1.2)),
    mid: rgbToHex(apply(clear.mid, 1)),
    bottom: rgbToHex(apply(clear.bottom, 0.8)),
    daylight,
    stars: clamp((-elevation - 3) / 9, 0, 1) * (1 - scene.cloud * 0.95) * (1 - scene.fog),
  };
}

/** Where the Sun (or stylised Moon) sits in the viewport, as fractions of width and height. */
export function bodyPosition(elevation: number, azimuth: number): { x: number; y: number } {
  // Looking south: east (90°) is on the left, west (270°) on the right.
  const x = 0.5 + Math.sin((azimuth - 180) * (Math.PI / 180)) * 0.42;
  const y = lerp(0.62, 0.1, clamp(elevation / 65, 0, 1));
  return { x: clamp(x, 0.06, 0.94), y };
}
