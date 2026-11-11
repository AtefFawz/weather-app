import type { Insight } from "@/core/insights";
import { formatClock, formatTemperature, formatWindSpeed, splitDuration, type Locale } from "@/core/format";
import type { TemperatureUnit, WindUnit } from "@/core/units";
import type { MessageKey, Translate } from "@/i18n";

export type InsightIcon =
  | "umbrella"
  | "sun"
  | "thermometer"
  | "snowflake"
  | "wind"
  | "leaf"
  | "sparkles"
  | "sunset"
  | "sunrise"
  | "trending-up"
  | "trending-down"
  | "clock"
  | "moon";

export interface InsightContext {
  t: Translate;
  language: Locale;
  timezone: string;
  temperatureUnit: TemperatureUnit;
  windUnit: WindUnit;
}

export interface InsightView {
  id: Insight["id"];
  tone: Insight["tone"];
  icon: InsightIcon;
  text: string;
}

const ICONS: Record<Insight["id"], InsightIcon> = {
  aqi: "leaf",
  rainSoon: "umbrella",
  rainUntil: "umbrella",
  heat: "thermometer",
  cold: "snowflake",
  windy: "wind",
  uv: "sun",
  bestWindow: "clock",
  dryDay: "sparkles",
  warmerTomorrow: "trending-up",
  coolerTomorrow: "trending-down",
  sunset: "sunset",
  sunrise: "sunrise",
  clearNight: "moon",
};

export function describeInsight(insight: Insight, ctx: InsightContext): InsightView {
  const { t, language, timezone, temperatureUnit, windUnit } = ctx;
  const clock = (ms: number) => formatClock(ms, timezone, language);
  const temp = (c: number) => formatTemperature(c, temperatureUnit, true);
  const duration = (ms: number) => {
    const { hours, minutes } = splitDuration(ms);
    return hours > 0 ? t("durationHM", { h: hours, m: minutes }) : t("durationM", { m: minutes });
  };

  let text: string;
  switch (insight.id) {
    case "aqi":
      text = t("insightAqi", { aqi: insight.aqi, band: t(`aqi_${insight.band}` as MessageKey) });
      break;
    case "rainSoon":
      text = t("insightRainSoon", { time: clock(insight.atMs), chance: insight.probability });
      break;
    case "rainUntil":
      text = t("insightRainUntil", { time: clock(insight.untilMs) });
      break;
    case "heat":
      text = t("insightHeat", { temp: temp(insight.apparentC) });
      break;
    case "cold":
      text = t("insightCold", { temp: temp(insight.apparentC) });
      break;
    case "windy":
      text = t("insightWindy", { wind: formatWindSpeed(insight.gustKmh, windUnit) });
      break;
    case "uv":
      text = t("insightUv", { uv: insight.uv, time: clock(insight.atMs) });
      break;
    case "bestWindow":
      text = t("insightBestWindow", { start: clock(insight.startMs), end: clock(insight.endMs) });
      break;
    case "dryDay":
      text = t("insightDryDay");
      break;
    case "warmerTomorrow":
    case "coolerTomorrow": {
      // A delta is not an absolute temperature: only scale it for Fahrenheit, never offset it.
      const delta = temperatureUnit === "fahrenheit" ? Math.round((insight.deltaC * 9) / 5) : insight.deltaC;
      text = t(insight.id === "warmerTomorrow" ? "insightWarmerTomorrow" : "insightCoolerTomorrow", { delta: `${delta}°` });
      break;
    }
    case "sunset":
      text = t("insightSunset", { duration: duration(insight.inMs) });
      break;
    case "sunrise":
      text = t("insightSunrise", { duration: duration(insight.inMs) });
      break;
    case "clearNight":
      text = t("insightClearNight");
      break;
  }
  return { id: insight.id, tone: insight.tone, icon: ICONS[insight.id], text };
}
