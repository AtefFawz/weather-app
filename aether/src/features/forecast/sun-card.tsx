import { Sunrise, Sunset } from "lucide-react";
import { clamp } from "@/core/color";
import { formatClock, splitDuration } from "@/core/format";
import type { DaySample } from "@/data/models";
import { useI18n } from "@/i18n";
import { Card } from "./card";

interface Props {
  day: DaySample | undefined;
  nextDay: DaySample | undefined;
  atMs: number;
  timezone: string;
}

const CX = 120;
const CY = 112;
const R = 98;

export function sunProgress(atMs: number, sunrise: number, sunset: number): number {
  return (atMs - sunrise) / (sunset - sunrise);
}

export function SunCard({ day, nextDay, atMs, timezone }: Props) {
  const { t, language } = useI18n();
  const sunrise = day?.sunrise ?? null;
  const sunset = day?.sunset ?? null;

  if (sunrise === null || sunset === null) {
    return (
      <Card id="sun" title={t("sunTitle")} icon={<Sunrise aria-hidden="true" />}>
        <p className="muted">{t("unavailable")}</p>
      </Card>
    );
  }

  const progress = sunProgress(atMs, sunrise, sunset);
  const up = progress >= 0 && progress <= 1;
  const p = clamp(progress, 0, 1);
  const angle = Math.PI * p;
  const sunX = CX - R * Math.cos(angle);
  const sunY = CY - R * Math.sin(angle);
  const duration = (ms: number) => {
    const { hours, minutes } = splitDuration(ms);
    return t("durationHM", { h: hours, m: minutes });
  };

  let summary: string;
  if (up) summary = t("daylightLeft", { duration: duration(sunset - atMs) });
  else if (progress < 0) summary = t("sunriseIn", { duration: duration(sunrise - atMs) });
  else summary = nextDay?.sunrise ? t("sunriseIn", { duration: duration(nextDay.sunrise - atMs) }) : t("sunHasSet");

  const arc = `M${CX - R},${CY} A${R},${R} 0 0 1 ${CX + R},${CY}`;
  const lit = p > 0 ? `M${CX - R},${CY} A${R},${R} 0 0 1 ${sunX.toFixed(2)},${sunY.toFixed(2)}` : "";

  return (
    <Card id="sun" title={t("sunTitle")} icon={<Sunrise aria-hidden="true" />} className="suncard">
      <svg viewBox="0 0 240 130" className="suncard__svg" role="img" aria-label={summary}>
        <line x1="8" x2="232" y1={CY} y2={CY} className="suncard__horizon" />
        <path d={arc} className="suncard__track" />
        {lit && <path d={lit} className="suncard__lit" />}
        <circle cx={sunX} cy={sunY} r={up ? 9 : 5} className={up ? "suncard__sun" : "suncard__sun suncard__sun--down"} />
      </svg>
      <p className="suncard__summary">{summary}</p>
      <dl className="suncard__times">
        <div>
          <dt>
            <Sunrise aria-hidden="true" /> {t("sunrise")}
          </dt>
          <dd>{formatClock(sunrise, timezone, language)}</dd>
        </div>
        <div>
          <dt>
            <Sunset aria-hidden="true" /> {t("sunset")}
          </dt>
          <dd>{formatClock(sunset, timezone, language)}</dd>
        </div>
      </dl>
    </Card>
  );
}
