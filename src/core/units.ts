export type TemperatureUnit = "celsius" | "fahrenheit";
export type WindUnit = "kmh" | "mph" | "ms";
export type PressureUnit = "hpa";

/** The API is always queried in metric; everything the user sees is converted here. */
export const toFahrenheit = (celsius: number) => (celsius * 9) / 5 + 32;
export const kmhToMph = (kmh: number) => kmh * 0.621371;
export const kmhToMs = (kmh: number) => kmh / 3.6;

export function convertTemperature(celsius: number, unit: TemperatureUnit): number {
  return unit === "fahrenheit" ? toFahrenheit(celsius) : celsius;
}

export function convertWind(kmh: number, unit: WindUnit): number {
  if (unit === "mph") return kmhToMph(kmh);
  if (unit === "ms") return kmhToMs(kmh);
  return kmh;
}

export const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export const WIND_LABEL: Record<WindUnit, string> = { kmh: "km/h", mph: "mph", ms: "m/s" };
