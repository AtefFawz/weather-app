import { Sun } from "lucide-react";
import { clamp } from "@/core/color";
import { formatNumber } from "@/core/format";
import { useI18n, type MessageKey } from "@/i18n";
import { Card } from "./card";

export type UvLevel = "low" | "moderate" | "high" | "veryHigh" | "extreme";

export function uvLevel(uv: number): UvLevel {
  if (uv < 3) return "low";
  if (uv < 6) return "moderate";
  if (uv < 8) return "high";
  if (uv < 11) return "veryHigh";
  return "extreme";
}

const SEGMENTS = [
  { to: 3, color: "#4ade80" },
  { to: 6, color: "#facc15" },
  { to: 8, color: "#fb923c" },
  { to: 11, color: "#f87171" },
  { to: 13, color: "#c084fc" },
] as const;

const R = 52;
const point = (fraction: number, radius = R) => {
  const a = Math.PI * (1 - fraction);
  return [60 + radius * Math.cos(a), 60 - radius * Math.sin(a)] as const;
};

interface Props {
  uv: number | null;
  peak: number | null;
}

export function UvCard({ uv, peak }: Props) {
  const { t, language } = useI18n();
  const value = uv ?? 0;
  const fraction = clamp(value / 13, 0, 1);
  const [nx, ny] = point(fraction, 40);

  const arcs = SEGMENTS.map((segment, i) => {
    const from = SEGMENTS[i - 1]?.to ?? 0;
    const a = point(from / 13);
    const b = point(segment.to / 13);
    return { d: `M${a[0].toFixed(2)},${a[1].toFixed(2)} A${R},${R} 0 0 1 ${b[0].toFixed(2)},${b[1].toFixed(2)}`, color: segment.color };
  });

  return (
    <Card id="uv" title={t("uvTitle")} icon={<Sun aria-hidden="true" />} className="uvcard">
      <div className="uvcard__body">
        <svg viewBox="0 0 120 70" className="uvcard__gauge" role="img" aria-label={`${t("uvTitle")} ${formatNumber(uv, language, 1)}`}>
          {arcs.map((arc) => (
            <path key={arc.color} d={arc.d} stroke={arc.color} className="uvcard__arc" />
          ))}
          {uv !== null && (
            <>
              <line x1="60" y1="60" x2={nx} y2={ny} className="uvcard__needle" />
              <circle cx="60" cy="60" r="4" className="uvcard__hub" />
            </>
          )}
        </svg>
        <div>
          <p className="stat__value">{formatNumber(uv, language, 1)}</p>
          <p className="muted">{uv === null ? t("unavailable") : t(`uv_${uvLevel(value)}` as MessageKey)}</p>
          {peak !== null && (
            <p className="muted">
              {t("peakToday")}: {formatNumber(peak, language, 1)}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
