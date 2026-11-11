import type { MoonPhase } from "@/core/moon";

interface Props {
  phase: MoonPhase;
  size?: number;
  className?: string;
}

/** Path of the lit part of the Moon for a phase, drawn for a viewer in the northern hemisphere. */
export function moonLitPath(phase: number, r: number): string {
  const waxing = phase <= 0.5;
  const p = waxing ? phase : 1 - phase;
  const k = Math.cos(2 * Math.PI * p); // +1 new … -1 full
  const rx = Math.abs(k) * r;
  const sweep = k > 0 ? 0 : 1;
  return `M0,${-r} A${r},${r} 0 0 1 0,${r} A${rx.toFixed(3)},${r} 0 0 ${sweep} 0,${-r} Z`;
}

export function MoonDisc({ phase, size = 120, className }: Props) {
  const r = 50;
  const flip = phase.phase > 0.5 ? "scale(-1,1)" : undefined;
  return (
    <svg viewBox="-60 -60 120 120" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <radialGradient id="moon-lit" cx="40%" cy="38%" r="70%">
          <stop offset="0" stopColor="#fffdf2" />
          <stop offset="1" stopColor="#d9dcec" />
        </radialGradient>
      </defs>
      <circle r={r} fill="#1b2340" stroke="rgba(255,255,255,.18)" strokeWidth="1" />
      <g transform={flip}>
        <path d={moonLitPath(phase.phase, r)} fill="url(#moon-lit)" />
      </g>
    </svg>
  );
}
