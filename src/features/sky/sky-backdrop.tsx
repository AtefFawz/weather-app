import { memo, useMemo, type CSSProperties } from "react";
import { createRng } from "@/core/random";
import type { SkyState } from "@/core/sky-state";
import { MoonDisc } from "./moon-disc";
import { ParticleCanvas } from "./particle-canvas";

const STAR_COUNT = 90;

/** Stars are generated once with a fixed seed so they never jump between renders. */
function useStars() {
  return useMemo(() => {
    const rng = createRng(20261110);
    return Array.from({ length: STAR_COUNT }, () => ({
      x: rng() * 100,
      y: rng() * 62,
      size: 1 + rng() * 1.8,
      delay: rng() * 6,
      duration: 3 + rng() * 4,
      opacity: 0.35 + rng() * 0.65,
    }));
  }, []);
}

const CLOUDS = [
  { top: 8, size: 46, speed: 140, delay: -20, opacity: 1 },
  { top: 22, size: 60, speed: 190, delay: -90, opacity: 0.85 },
  { top: 38, size: 52, speed: 160, delay: -50, opacity: 0.95 },
  { top: 12, size: 38, speed: 230, delay: -170, opacity: 0.7 },
  { top: 50, size: 66, speed: 210, delay: -120, opacity: 0.8 },
  { top: 30, size: 44, speed: 250, delay: -10, opacity: 0.75 },
] as const;

interface Props {
  sky: SkyState;
}

/**
 * The page background: a gradient driven by the real solar elevation, with stars, Sun/Moon, drifting
 * clouds, fog, precipitation and lightning layered on top according to the weather. Everything is
 * pointer-events:none and aria-hidden; it is decoration over the data, never the data itself.
 */
export const SkyBackdrop = memo(function SkyBackdrop({ sky }: Props) {
  const stars = useStars();
  const { colors, scene } = sky;

  const style = {
    "--sky-top": colors.top,
    "--sky-mid": colors.mid,
    "--sky-bottom": colors.bottom,
    "--sun-x": `${(sky.sun.x * 100).toFixed(1)}%`,
    "--sun-y": `${(sky.sun.y * 100).toFixed(1)}%`,
    "--sun-opacity": sky.sun.visible ? String(Math.max(0, 1 - scene.cloud * 0.85) * Math.min(1, (sky.elevation + 4) / 6)) : "0",
    "--daylight": colors.daylight.toFixed(3),
    "--cloud-opacity": String(0.12 + scene.cloud * 0.8),
    "--cloud-tone": colors.daylight > 0.25 ? (scene.precip !== "none" ? "#8b97a8" : "#ffffff") : "#5b6482",
    "--fog": scene.fog.toFixed(2),
    "--stars": colors.stars.toFixed(3),
  } as CSSProperties;

  const cloudCount = Math.round(scene.cloud * CLOUDS.length + (scene.cloud > 0.1 ? 1 : 0));
  const particles = scene.precip !== "none" && scene.intensity > 0 ? scene.precip : null;

  return (
    <div className="sky" style={style} aria-hidden="true" data-testid="sky" data-daylight={colors.daylight.toFixed(2)}>
      <div className="sky__gradient" />

      <div className="sky__stars">
        {stars.map((star, i) => (
          <span
            key={i}
            className="sky__star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="sky__sun" />
      {sky.moon.visible && (
        <div className="sky__moon" style={{ left: `${sky.moon.x * 100}%`, top: `${sky.moon.y * 100}%` }}>
          <MoonDisc phase={sky.moon.phase} size={96} />
        </div>
      )}

      <div className="sky__clouds">
        {CLOUDS.slice(0, cloudCount).map((cloud, i) => (
          <span
            key={i}
            className="sky__cloud"
            style={{
              top: `${cloud.top}%`,
              width: `${cloud.size}vw`,
              height: `${cloud.size * 0.22}vw`,
              opacity: cloud.opacity,
              animationDuration: `${cloud.speed}s`,
              animationDelay: `${cloud.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="sky__fog" />
      {particles && <ParticleCanvas kind={particles} intensity={scene.intensity} wind={scene.wind} />}
      {scene.lightning && <div className="sky__lightning" />}
      <div className="sky__horizon" />
      <div className="sky__scrim" />
    </div>
  );
});
