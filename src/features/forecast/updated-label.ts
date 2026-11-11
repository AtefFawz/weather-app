import type { Translate } from "@/i18n";

/** "Updated just now" / "Updated 7 min ago" / "Updated 3 h ago" from an age in milliseconds. */
export function updatedLabel(ageMs: number, t: Translate): string {
  const minutes = Math.floor(Math.max(0, ageMs) / 60_000);
  if (minutes < 1) return t("updatedNow");
  if (minutes < 60) return t("updatedMinutes", { minutes });
  return t("updatedHours", { hours: Math.floor(minutes / 60) });
}
