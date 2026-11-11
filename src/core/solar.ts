/**
 * Solar geometry based on the NOAA Solar Calculator (Meeus, "Astronomical Algorithms").
 * Accurate to roughly a minute for sunrise/sunset at non-polar latitudes, which is far
 * more than the sky renderer needs. All functions are pure and take explicit instants.
 */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const MS_PER_DAY = 86_400_000;

/** Elevation of the Sun's centre at which sunrise/sunset is conventionally defined (refraction + radius). */
export const SUNRISE_ELEVATION = -0.833;
export const CIVIL_TWILIGHT_ELEVATION = -6;

const mod = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;

export function julianDay(date: Date): number {
  return date.getTime() / MS_PER_DAY + 2440587.5;
}

export interface SolarPosition {
  /** Degrees above the horizon (negative when the Sun is below it). */
  elevation: number;
  /** Degrees clockwise from true north. */
  azimuth: number;
  /** Solar declination in degrees. */
  declination: number;
}

export function solarPosition(date: Date, latitude: number, longitude: number): SolarPosition {
  const T = (julianDay(date) - 2451545.0) / 36525;

  const meanLongitude = mod(280.46646 + T * (36000.76983 + T * 0.0003032), 360);
  const meanAnomaly = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const eccentricity = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);

  const m = meanAnomaly * RAD;
  const equationOfCentre =
    Math.sin(m) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * m) * (0.019993 - 0.000101 * T) + Math.sin(3 * m) * 0.000289;

  const trueLongitude = meanLongitude + equationOfCentre;
  const omega = 125.04 - 1934.136 * T;
  const apparentLongitude = trueLongitude - 0.00569 - 0.00478 * Math.sin(omega * RAD);

  const meanObliquity = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const obliquity = meanObliquity + 0.00256 * Math.cos(omega * RAD);

  const declination = Math.asin(Math.sin(obliquity * RAD) * Math.sin(apparentLongitude * RAD));

  const y = Math.tan((obliquity * RAD) / 2) ** 2;
  const l0 = meanLongitude * RAD;
  const equationOfTime =
    4 *
    DEG *
    (y * Math.sin(2 * l0) -
      2 * eccentricity * Math.sin(m) +
      4 * eccentricity * y * Math.sin(m) * Math.cos(2 * l0) -
      0.5 * y * y * Math.sin(4 * l0) -
      1.25 * eccentricity * eccentricity * Math.sin(2 * m));

  const minutesUtc = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60 + date.getUTCMilliseconds() / 60_000;
  const trueSolarTime = mod(minutesUtc + equationOfTime + 4 * longitude, 1440);
  const hourAngle = trueSolarTime / 4 - 180;

  const lat = latitude * RAD;
  const ha = hourAngle * RAD;
  const cosZenith = clampUnit(Math.sin(lat) * Math.sin(declination) + Math.cos(lat) * Math.cos(declination) * Math.cos(ha));
  const zenith = Math.acos(cosZenith);
  const sinZenith = Math.sin(zenith);

  let azimuth = 180;
  if (sinZenith > 1e-6 && Math.abs(Math.cos(lat)) > 1e-9) {
    const cosAz = clampUnit((Math.sin(lat) * cosZenith - Math.sin(declination)) / (Math.cos(lat) * sinZenith));
    const az = Math.acos(cosAz) * DEG;
    azimuth = hourAngle > 0 ? mod(az + 180, 360) : mod(540 - az, 360);
  }

  return { elevation: 90 - zenith * DEG, azimuth, declination: declination * DEG };
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(-1, value));
}

export interface SolarEvents {
  solarNoon: Date;
  sunrise: Date | null;
  sunset: Date | null;
  civilDawn: Date | null;
  civilDusk: Date | null;
  /** Set when the Sun never crosses the horizon on this solar day. */
  polar: "day" | "night" | null;
}

/**
 * Solar events for the solar day around `date` at the given location.
 * Found numerically (bisection) so the same code handles any latitude and date.
 */
export function solarEvents(date: Date, latitude: number, longitude: number): SolarEvents {
  const elevationAt = (ms: number) => solarPosition(new Date(ms), latitude, longitude).elevation;

  // Local solar noon is when the Sun is due south/north: ~12:00 UTC shifted by longitude.
  const midnightUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const roughNoon = midnightUtc + (12 - longitude / 15) * 3_600_000;

  // Refine the noon by ternary search on the elevation maximum.
  let lo = roughNoon - 3 * 3_600_000;
  let hi = roughNoon + 3 * 3_600_000;
  for (let i = 0; i < 40; i += 1) {
    const a = lo + (hi - lo) / 3;
    const b = hi - (hi - lo) / 3;
    if (elevationAt(a) < elevationAt(b)) lo = a;
    else hi = b;
  }
  const noon = (lo + hi) / 2;
  const noonElevation = elevationAt(noon);
  const midnight = noon - 12 * 3_600_000;

  const crossing = (threshold: number, from: number, to: number): Date | null => {
    const fromAbove = elevationAt(from) > threshold;
    const toAbove = elevationAt(to) > threshold;
    if (fromAbove === toAbove) return null;
    let a = from;
    let b = to;
    for (let i = 0; i < 40; i += 1) {
      const mid = (a + b) / 2;
      if (elevationAt(mid) > threshold === fromAbove) a = mid;
      else b = mid;
    }
    return new Date((a + b) / 2);
  };

  const sunrise = crossing(SUNRISE_ELEVATION, midnight, noon);
  const sunset = crossing(SUNRISE_ELEVATION, noon, noon + 12 * 3_600_000);

  return {
    solarNoon: new Date(noon),
    sunrise,
    sunset,
    civilDawn: crossing(CIVIL_TWILIGHT_ELEVATION, midnight, noon),
    civilDusk: crossing(CIVIL_TWILIGHT_ELEVATION, noon, noon + 12 * 3_600_000),
    polar: sunrise || sunset ? null : noonElevation > SUNRISE_ELEVATION ? "day" : "night",
  };
}
