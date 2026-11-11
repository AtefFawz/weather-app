import type { CSSProperties } from "react";
import { Leaf } from "lucide-react";
import { AQI_SCALE_MAX, aqiBands, aqiInfo } from "@/core/aqi";
import { clamp } from "@/core/color";
import { formatNumber } from "@/core/format";
import type { AirQuality } from "@/data/models";
import { useI18n, type MessageKey } from "@/i18n";
import { Card } from "./card";

export function AirQualityCard({ air }: { air: AirQuality | null }) {
  const { t, language } = useI18n();
  const aqi = air?.aqi ?? null;

  if (aqi === null) {
    return (
      <Card id="air" title={t("airTitle")} icon={<Leaf aria-hidden="true" />}>
        <p className="muted">{t("airUnavailable")}</p>
      </Card>
    );
  }

  const info = aqiInfo(aqi);
  const gradient = aqiBands
    .filter((b) => b.min < AQI_SCALE_MAX)
    .map((b) => `${b.color} ${(b.min / AQI_SCALE_MAX) * 100}%`)
    .join(", ");

  const pollutants: Array<[string, number | null]> = [
    ["PM2.5", air?.pm25 ?? null],
    ["PM10", air?.pm10 ?? null],
    ["O₃", air?.ozone ?? null],
    ["NO₂", air?.no2 ?? null],
  ];

  return (
    <Card id="air" title={t("airTitle")} icon={<Leaf aria-hidden="true" />} className="aircard">
      <p className="stat__value">
        {formatNumber(aqi, language)}{" "}
        <span className="aircard__band" style={{ "--band": info.color } as CSSProperties}>
          {t(`aqi_${info.band}` as MessageKey)}
        </span>
      </p>
      <div
        className="aircard__track"
        style={{ background: `linear-gradient(90deg, ${gradient})` }}
        role="img"
        aria-label={`AQI ${Math.round(aqi)}`}
      >
        <span className="aircard__marker" style={{ insetInlineStart: `${clamp(aqi / AQI_SCALE_MAX, 0, 1) * 100}%` }} />
      </div>
      <dl className="aircard__pollutants">
        {pollutants.map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{formatNumber(value, language, value !== null && value < 10 ? 1 : 0)}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
