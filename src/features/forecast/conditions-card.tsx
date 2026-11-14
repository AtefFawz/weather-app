import { CloudSun, Droplets, Gauge, Umbrella } from "lucide-react";
import { clamp } from "@/core/color";
import { formatNumber } from "@/core/format";
import { useI18n } from "@/i18n";
import { Card } from "./card";

interface Props {
  humidity: number | null;
  pressure: number | null;
  cloudCover: number | null;
  precipProbability: number | null;
}

export function ConditionsCard({ humidity, pressure, cloudCover, precipProbability }: Props) {
  const { t, language } = useI18n();
  const rows = [
    {
      key: "humidity",
      icon: Droplets,
      label: t("humidity"),
      value: humidity === null ? "—" : `${formatNumber(humidity, language)}%`,
      bar: humidity,
    },
    {
      key: "cloud",
      icon: CloudSun,
      label: t("cloudCover"),
      value: cloudCover === null ? "—" : `${formatNumber(cloudCover, language)}%`,
      bar: cloudCover,
    },
    {
      key: "rain",
      icon: Umbrella,
      label: t("precipChance"),
      value: precipProbability === null ? "—" : `${formatNumber(precipProbability, language)}%`,
      bar: precipProbability,
    },
    {
      key: "pressure",
      icon: Gauge,
      label: t("pressure"),
      value: pressure === null ? "—" : `${formatNumber(pressure, language)} hPa`,
      bar: pressure === null ? null : ((clamp(pressure, 980, 1040) - 980) / 60) * 100,
    },
  ];
  return (
    <Card id="conditions" title={t("conditionsTitle")} icon={<Gauge aria-hidden="true" />} className="conditions">
      <ul className="conditions__list">
        {rows.map(({ key, icon: Icon, label, value, bar }) => (
          <li key={key}>
            <span className="conditions__label">
              <Icon aria-hidden="true" /> {label}
            </span>
            <span className="conditions__value">{value}</span>
            <span className="conditions__bar" aria-hidden="true">
              <span style={{ width: `${clamp(bar ?? 0, 0, 100)}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
