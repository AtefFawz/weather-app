import type { Locale } from "@/core/format";
import type { Place } from "@/data/models";
import type { Translate } from "@/i18n";

/** Device locations have no name; the default city gets an Arabic label; everything else is as geocoded. */
export function placeLabel(place: Place, language: Locale, t: Translate): { name: string; subtitle: string } {
  if (place.source === "device") return { name: t("yourLocation"), subtitle: t("deviceLocationSubtitle") };
  if (place.source === "default" && language === "ar") return { name: "كفر الدوار", subtitle: "محافظة البحيرة، مصر" };
  const separator = language === "ar" ? "، " : ", ";
  return { name: place.name || "—", subtitle: [place.admin1, place.country].filter(Boolean).join(separator) || "—" };
}
