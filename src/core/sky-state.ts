import { moonPhase, type MoonPhase } from "./moon";
import { bodyPosition, sceneFor, skyFor, type Scene, type SceneInput, type SkyColors } from "./sky";
import { solarPosition } from "./solar";

export interface SkyState {
  atMs: number;
  elevation: number;
  azimuth: number;
  scene: Scene;
  colors: SkyColors;
  sun: { x: number; y: number; visible: boolean };
  moon: { x: number; y: number; visible: boolean; phase: MoonPhase };
}

/**
 * Everything the sky renderer needs for a place at an instant: real solar geometry from coordinates and
 * time, combined with the weather at that moment. Pure, so it can be tested and called for any hour
 * (the time-travel scrubber and the sky ribbon under the chart both use it).
 */
export function computeSky(latitude: number, longitude: number, atMs: number, weather: SceneInput): SkyState {
  const { elevation, azimuth } = solarPosition(new Date(atMs), latitude, longitude);
  const scene = sceneFor(weather);
  const colors = skyFor(elevation, scene);
  const sun = bodyPosition(elevation, azimuth);
  // The Moon is stylised: opposite the Sun, mirrored in height. Real lunar ephemeris is out of scope.
  const moonPos = bodyPosition(-elevation, (azimuth + 180) % 360);
  const phase = moonPhase(new Date(atMs));
  return {
    atMs,
    elevation,
    azimuth,
    scene,
    colors,
    sun: { ...sun, visible: elevation > -4 },
    moon: { ...moonPos, visible: elevation < 2 && phase.illumination > 0.04, phase },
  };
}
