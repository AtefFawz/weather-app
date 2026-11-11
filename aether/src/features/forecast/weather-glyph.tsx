import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  type LucideProps,
} from "lucide-react";
import { getCondition, type Glyph } from "@/core/wmo";

interface Props extends Omit<LucideProps, "ref"> {
  code: number | null | undefined;
  isDay?: boolean;
}

const DAY: Record<Glyph, typeof Sun> = {
  clear: Sun,
  partly: CloudSun,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  cloud: Cloud,
};
const NIGHT: Record<Glyph, typeof Sun> = { ...DAY, clear: Moon, partly: CloudMoon };

export function WeatherGlyph({ code, isDay = true, ...props }: Props) {
  const glyph = getCondition(code).glyph;
  const Icon = (isDay ? DAY : NIGHT)[glyph];
  return <Icon aria-hidden="true" {...props} />;
}
