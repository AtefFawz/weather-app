import { useEffect, useRef } from "react";
import { ParticleSystem, type ParticleKind } from "@/core/particles";

interface Props {
  kind: ParticleKind;
  intensity: number;
  wind: number;
}

/**
 * Canvas renderer for rain/snow. Handles device-pixel-ratio, resizing, tab visibility and
 * `prefers-reduced-motion` (a single still frame instead of an animation loop).
 */
export function ParticleCanvas({ kind, intensity, wind }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let system = new ParticleSystem({ kind, intensity, wind, width: canvas.clientWidth, height: canvas.clientHeight, seed: Date.now() });
    let frame = 0;
    let last = 0;

    const fit = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      system.resize(w, h);
      if (reduced) system.draw(ctx);
    };
    fit();

    const loop = (time: number) => {
      const dt = last ? (time - last) / 1000 : 0;
      last = time;
      system.step(dt);
      system.draw(ctx);
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (reduced || frame) return;
      last = 0;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    const observer = new ResizeObserver(fit);
    observer.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      system = null as unknown as ParticleSystem;
    };
  }, [kind, intensity, wind]);

  return <canvas ref={ref} className="sky__particles" aria-hidden="true" />;
}
