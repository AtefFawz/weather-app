/** WMO weather interpretation codes, as used by Open-Meteo. */

export type ConditionKey =
  | "clear"
  | "mainlyClear"
  | "partlyCloudy"
  | "overcast"
  | "fog"
  | "rimeFog"
  | "lightDrizzle"
  | "drizzle"
  | "heavyDrizzle"
  | "freezingDrizzle"
  | "heavyFreezingDrizzle"
  | "lightRain"
  | "rain"
  | "heavyRain"
  | "freezingRain"
  | "heavyFreezingRain"
  | "lightSnow"
  | "snow"
  | "heavySnow"
  | "snowGrains"
  | "lightShowers"
  | "showers"
  | "heavyShowers"
  | "snowShowers"
  | "heavySnowShowers"
  | "thunderstorm"
  | "thunderstormHail"
  | "heavyThunderstormHail"
  | "unknown";

export type Glyph = "clear" | "partly" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "storm";

export interface WeatherCondition {
  key: ConditionKey;
  glyph: Glyph;
  precip: "none" | "rain" | "snow";
  /** 0–1 precipitation intensity implied by the code. */
  intensity: number;
  /** Default cloud fraction implied by the code (0–1). */
  cloud: number;
  fog: number;
  lightning: boolean;
}

const c = (
  key: ConditionKey,
  glyph: Glyph,
  precip: WeatherCondition["precip"],
  intensity: number,
  cloud: number,
  extra: Partial<Pick<WeatherCondition, "fog" | "lightning">> = {},
): WeatherCondition => ({ key, glyph, precip, intensity, cloud, fog: extra.fog ?? 0, lightning: extra.lightning ?? false });

const TABLE: Record<number, WeatherCondition> = {
  0: c("clear", "clear", "none", 0, 0.04),
  1: c("mainlyClear", "partly", "none", 0, 0.2),
  2: c("partlyCloudy", "partly", "none", 0, 0.5),
  3: c("overcast", "cloud", "none", 0, 0.92),
  45: c("fog", "fog", "none", 0, 0.7, { fog: 0.85 }),
  48: c("rimeFog", "fog", "none", 0, 0.7, { fog: 0.9 }),
  51: c("lightDrizzle", "drizzle", "rain", 0.2, 0.8),
  53: c("drizzle", "drizzle", "rain", 0.32, 0.85),
  55: c("heavyDrizzle", "drizzle", "rain", 0.45, 0.9),
  56: c("freezingDrizzle", "drizzle", "rain", 0.3, 0.85),
  57: c("heavyFreezingDrizzle", "drizzle", "rain", 0.45, 0.9),
  61: c("lightRain", "rain", "rain", 0.35, 0.85),
  63: c("rain", "rain", "rain", 0.6, 0.9),
  65: c("heavyRain", "rain", "rain", 0.9, 0.95),
  66: c("freezingRain", "rain", "rain", 0.55, 0.9),
  67: c("heavyFreezingRain", "rain", "rain", 0.85, 0.95),
  71: c("lightSnow", "snow", "snow", 0.3, 0.85),
  73: c("snow", "snow", "snow", 0.55, 0.9),
  75: c("heavySnow", "snow", "snow", 0.9, 0.95),
  77: c("snowGrains", "snow", "snow", 0.3, 0.85),
  80: c("lightShowers", "rain", "rain", 0.4, 0.75),
  81: c("showers", "rain", "rain", 0.65, 0.85),
  82: c("heavyShowers", "rain", "rain", 1, 0.95),
  85: c("snowShowers", "snow", "snow", 0.5, 0.85),
  86: c("heavySnowShowers", "snow", "snow", 0.9, 0.95),
  95: c("thunderstorm", "storm", "rain", 0.8, 0.95, { lightning: true }),
  96: c("thunderstormHail", "storm", "rain", 0.9, 0.97, { lightning: true }),
  99: c("heavyThunderstormHail", "storm", "rain", 1, 0.98, { lightning: true }),
};

const UNKNOWN: WeatherCondition = c("unknown", "cloud", "none", 0, 0.5);

export function getCondition(code: number | null | undefined): WeatherCondition {
  if (code === null || code === undefined) return UNKNOWN;
  return TABLE[Math.trunc(code)] ?? UNKNOWN;
}

export const isPrecipitating = (code: number | null | undefined) => getCondition(code).precip !== "none";
