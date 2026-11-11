import { clamp } from "./color";

export interface ComfortSample {
  /** °C, feels-like */
  apparent: number;
  /** 0–100 */
  precipProbability: number;
  /** km/h */
  wind: number;
  uv: number;
  isDay: boolean;
}

/**
 * 0–100 "how pleasant is it to be outside" score. Deliberately simple and explainable:
 * start from 100 and subtract penalties for each discomfort.
 */
export function comfortScore(s: ComfortSample): number {
  let score = 100;
  // Temperature: ideal 18–26 °C feels-like, penalise distance from the band.
  const distance = s.apparent < 18 ? 18 - s.apparent : s.apparent > 26 ? s.apparent - 26 : 0;
  score -= Math.min(55, distance * 3.2);
  score -= (s.precipProbability / 100) * 40;
  score -= clamp((s.wind - 15) * 0.9, 0, 25);
  score -= clamp((s.uv - 7) * 4, 0, 14);
  if (!s.isDay) score -= 18;
  return clamp(score, 0, 100);
}

export interface Window {
  startIndex: number;
  /** Exclusive end index. */
  endIndex: number;
  score: number;
}

/** Best contiguous window of `length` samples by mean comfort score. Ties keep the earliest. */
export function bestWindow(samples: readonly ComfortSample[], length = 2): Window | null {
  if (samples.length < length || length < 1) return null;
  const scores = samples.map(comfortScore);
  let best: Window | null = null;
  let sum = 0;
  for (let i = 0; i < scores.length; i += 1) {
    sum += scores[i] as number;
    if (i >= length) sum -= scores[i - length] as number;
    if (i >= length - 1) {
      const mean = sum / length;
      if (!best || mean > best.score + 1e-9) best = { startIndex: i - length + 1, endIndex: i + 1, score: mean };
    }
  }
  return best;
}
