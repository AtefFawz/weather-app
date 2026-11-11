import { Wind } from "lucide-react";
import { COMPASS_POINTS, compassPoint, formatWindSpeed } from "@/core/format";
import { WIND_LABEL, type WindUnit } from "@/core/units";
import { useI18n, type MessageKey } from "@/i18n";
import { Card } from "./card";

interface Props {
  speedKmh: number | null;
  gustKmh: number | null;
  directionDeg: number | null;
  unit: WindUnit;
  onUnit(unit: WindUnit): void;
}

export function WindCard({ speedKmh, gustKmh, directionDeg, unit, onUnit }: Props) {
  const { t } = useI18n();
  const point = compassPoint(directionDeg);
  const name = point === null ? null : t(`compass_${COMPASS_POINTS[point]}` as MessageKey);
  // Meteorological direction is where the wind comes FROM; the arrow shows where it is blowing TO.
  const rotation = directionDeg === null ? 0 : directionDeg + 180;

  return (
    <Card
      id="wind"
      title={t("windTitle")}
      icon={<Wind aria-hidden="true" />}
      className="windcard"
      action={
        <div className="segmented segmented--small" role="group" aria-label={t("windUnits")}>
          {(["kmh", "mph", "ms"] as const).map((value) => (
            <button key={value} type="button" aria-pressed={unit === value} onClick={() => onUnit(value)}>
              {WIND_LABEL[value]}
            </button>
          ))}
        </div>
      }
    >
      <div className="windcard__body">
        <svg
          viewBox="-60 -60 120 120"
          className="windcard__compass"
          role="img"
          aria-label={name ? t("windFrom", { direction: name }) : t("unavailable")}
        >
          <circle r="54" className="windcard__ring" />
          {Array.from({ length: 24 }, (_, i) => (
            <line key={i} x1="0" x2="0" y1={i % 6 === 0 ? -54 : -50} y2="-46" transform={`rotate(${i * 15})`} className="windcard__tick" />
          ))}
          {(["N", "E", "S", "W"] as const).map((c, i) => {
            const a = (i * Math.PI) / 2;
            return (
              <text key={c} x={Math.sin(a) * 38} y={-Math.cos(a) * 38 + 4} textAnchor="middle" className="windcard__letter">
                {t(`compass_${c}` as MessageKey)}
              </text>
            );
          })}
          {directionDeg !== null && (
            <g className="windcard__arrow" style={{ transform: `rotate(${rotation}deg)` }}>
              <path d="M0,-26 L8,6 L0,0 L-8,6 Z" />
            </g>
          )}
        </svg>
        <div>
          <p className="stat__value">{formatWindSpeed(speedKmh, unit)}</p>
          {name && <p className="muted">{t("windFrom", { direction: name })}</p>}
          <p className="muted">
            {t("gusts")}: {formatWindSpeed(gustKmh, unit)}
          </p>
        </div>
      </div>
    </Card>
  );
}
