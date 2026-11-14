import { Moon } from "lucide-react";
import { moonPhase } from "@/core/moon";
import { formatNumber } from "@/core/format";
import { useI18n, type MessageKey } from "@/i18n";
import { MoonDisc } from "@/features/sky/moon-disc";
import { Card } from "./card";

export function MoonCard({ atMs }: { atMs: number }) {
  const { t, language } = useI18n();
  const phase = moonPhase(new Date(atMs));
  return (
    <Card id="moon" title={t("moonTitle")} icon={<Moon aria-hidden="true" />} className="mooncard">
      <div className="mooncard__body">
        <MoonDisc phase={phase} size={84} />
        <div>
          <p className="stat__value">{t(`moon_${phase.name}` as MessageKey)}</p>
          <p className="muted">{t("illuminated", { percent: formatNumber(phase.illumination * 100, language) })}</p>
        </div>
      </div>
    </Card>
  );
}
