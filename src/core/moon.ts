const SYNODIC_MONTH = 29.530588853;
/** Julian day of a reference new moon (2000-01-06 18:14 UTC). */
const NEW_MOON_JD = 2451550.1;

export type MoonPhaseName =
  "newMoon" | "waxingCrescent" | "firstQuarter" | "waxingGibbous" | "fullMoon" | "waningGibbous" | "lastQuarter" | "waningCrescent";

const NAMES: readonly MoonPhaseName[] = [
  "newMoon",
  "waxingCrescent",
  "firstQuarter",
  "waxingGibbous",
  "fullMoon",
  "waningGibbous",
  "lastQuarter",
  "waningCrescent",
];

export interface MoonPhase {
  /** 0 = new moon, 0.5 = full moon, back to 1 = new moon. */
  phase: number;
  /** Fraction of the disc that is lit, 0–1. */
  illumination: number;
  name: MoonPhaseName;
}

export function moonPhase(date: Date): MoonPhase {
  const jd = date.getTime() / 86_400_000 + 2440587.5;
  const phase = ((((jd - NEW_MOON_JD) / SYNODIC_MONTH) % 1) + 1) % 1;
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  // Eight buckets centred on the principal phases.
  const name = NAMES[Math.floor(phase * 8 + 0.5) % 8] as MoonPhaseName;
  return { phase, illumination, name };
}
