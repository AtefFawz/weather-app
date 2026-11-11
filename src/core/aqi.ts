/** US EPA Air Quality Index bands. */
export type AqiBand = "good" | "moderate" | "sensitive" | "unhealthy" | "veryUnhealthy" | "hazardous";

export interface AqiInfo {
  band: AqiBand;
  /** Lower bound of the band. */
  min: number;
  /** CSS colour for the band. */
  color: string;
}

const BANDS: readonly (AqiInfo & { max: number })[] = [
  { band: "good", min: 0, max: 50, color: "#4ade80" },
  { band: "moderate", min: 51, max: 100, color: "#facc15" },
  { band: "sensitive", min: 101, max: 150, color: "#fb923c" },
  { band: "unhealthy", min: 151, max: 200, color: "#f87171" },
  { band: "veryUnhealthy", min: 201, max: 300, color: "#c084fc" },
  { band: "hazardous", min: 301, max: 500, color: "#be123c" },
];

export const AQI_SCALE_MAX = 300;

export function aqiInfo(value: number): AqiInfo {
  const v = Math.max(0, value);
  const found = BANDS.find((b) => v <= b.max) ?? (BANDS[BANDS.length - 1] as (typeof BANDS)[number]);
  return { band: found.band, min: found.min, color: found.color };
}

export const aqiBands = BANDS.map(({ band, min, max, color }) => ({ band, min, max, color }));
