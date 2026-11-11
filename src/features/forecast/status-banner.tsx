import { CloudOff, RotateCw, TriangleAlert } from "lucide-react";
import type { WeatherApiError } from "@/data/errors";
import { useI18n, type MessageKey } from "@/i18n";
import { Button } from "@/components/button";

interface Props {
  online: boolean;
  error: WeatherApiError | null;
  hasData: boolean;
  updatedLabel: string;
  onRetry(): void;
}

const MESSAGES: Record<WeatherApiError["code"], MessageKey> = {
  network: "errorNetwork",
  timeout: "errorTimeout",
  rate_limited: "errorRateLimited",
  server: "errorServer",
  client: "errorServer",
  invalid_response: "errorInvalid",
};

export function StatusBanner({ online, error, hasData, updatedLabel, onRetry }: Props) {
  const { t } = useI18n();
  if (!online) {
    return (
      <p className="banner banner--info" role="status">
        <CloudOff aria-hidden="true" />
        <span>{hasData ? t("offlineWithData", { updated: updatedLabel }) : t("offline")}</span>
      </p>
    );
  }
  if (error && hasData) {
    return (
      <p className="banner banner--warn" role="status">
        <TriangleAlert aria-hidden="true" />
        <span>{t("refreshFailed", { updated: updatedLabel })}</span>
        <Button variant="ghost" size="sm" onClick={onRetry}>
          <RotateCw aria-hidden="true" /> {t("retry")}
        </Button>
      </p>
    );
  }
  return null;
}

export function ErrorState({ error, onRetry }: { error: WeatherApiError; onRetry(): void }) {
  const { t } = useI18n();
  return (
    <section className="card error-state" role="alert">
      <TriangleAlert aria-hidden="true" />
      <h2>{t("errorTitle")}</h2>
      <p className="muted">{t(MESSAGES[error.code])}</p>
      <Button variant="solid" onClick={onRetry}>
        <RotateCw aria-hidden="true" /> {t("retry")}
      </Button>
    </section>
  );
}
