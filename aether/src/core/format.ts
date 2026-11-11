import type { TemperatureUnit, WindUnit } from "./units";
import { convertTemperature, convertWind, isFiniteNumber, WIND_LABEL } from "./units";

export type Locale = "en" | "ar";

/** Arabic copy with Western digits keeps numbers consistent across charts, labels and the API's data. */
export const intlLocale = (language: Locale): string => (language === "ar" ? "ar-EG-u-nu-latn" : "en-US");

export const DASH = "—";

export function formatTemperature(celsius: number | null | undefined, unit: TemperatureUnit, withUnit = false): string {
  if (!isFiniteNumber(celsius)) return DASH;
  const rounded = Math.round(convertTemperature(celsius, unit));
  // Normalise "-0" so a rounded -0.4° doesn't render as "-0°".
  const value = Object.is(rounded, -0) ? 0 : rounded;
  return withUnit ? `${value}°${unit === "fahrenheit" ? "F" : "C"}` : `${value}°`;
}

export function formatWindSpeed(kmh: number | null | undefined, unit: WindUnit, withUnit = true): string {
  if (!isFiniteNumber(kmh)) return DASH;
  const value = Math.round(convertWind(kmh, unit));
  return withUnit ? `${value} ${WIND_LABEL[unit]}` : String(value);
}

export function formatNumber(value: number | null | undefined, language: Locale, digits = 0): string {
  if (!isFiniteNumber(value)) return DASH;
  return new Intl.NumberFormat(intlLocale(language), { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
}

export function formatClock(ms: number | null | undefined, timeZone: string, language: Locale): string {
  if (!isFiniteNumber(ms)) return DASH;
  return safeFormat(language, { hour: "numeric", minute: "2-digit" }, timeZone).format(ms);
}

export function formatHour(ms: number, timeZone: string, language: Locale): string {
  return safeFormat(language, { hour: "numeric" }, timeZone).format(ms);
}

export function formatWeekday(ms: number, timeZone: string, language: Locale, style: "short" | "long" = "short"): string {
  return safeFormat(language, { weekday: style }, timeZone).format(ms);
}

export function formatDateTime(ms: number, timeZone: string, language: Locale): string {
  return safeFormat(language, { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }, timeZone).format(ms);
}

/** Calendar-day key (YYYY-MM-DD) in a time zone; used to compare "same day" across zones. */
export function dayKey(ms: number, timeZone: string): string {
  return safeFormat("en", { year: "numeric", month: "2-digit", day: "2-digit" }, timeZone, "en-CA").format(ms);
}

/** Hour of day (0–23) in a time zone. */
export function hourOfDay(ms: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: safeZone(timeZone) }).formatToParts(ms);
  return Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
}

export function compassPoint(degrees: number | null | undefined): number | null {
  if (!isFiniteNumber(degrees)) return null;
  return Math.round((((degrees % 360) + 360) % 360) / 45) % 8;
}

export const COMPASS_POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

export interface Duration {
  hours: number;
  minutes: number;
}

export function splitDuration(ms: number): Duration {
  const total = Math.max(0, Math.round(ms / 60_000));
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

function safeZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return timeZone === "auto" ? "UTC" : timeZone;
  } catch {
    return "UTC";
  }
}

const cache = new Map<string, Intl.DateTimeFormat>();
function safeFormat(language: Locale, options: Intl.DateTimeFormatOptions, timeZone: string, localeOverride?: string): Intl.DateTimeFormat {
  const zone = safeZone(timeZone);
  const locale = localeOverride ?? intlLocale(language);
  const key = `${locale}|${zone}|${JSON.stringify(options)}`;
  let formatter = cache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { ...options, timeZone: zone });
    cache.set(key, formatter);
  }
  return formatter;
}
