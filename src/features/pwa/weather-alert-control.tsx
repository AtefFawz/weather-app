import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/button";
import { useI18n } from "@/i18n";
import { detectInstallPlatform, isStandaloneDisplay, requiresHomeScreenInstall } from "./platform";

const STORAGE_KEY = "aether:v2:weather-alerts";

export function readWeatherAlertsPreference(): boolean {
  try {
    return (
      localStorage.getItem(STORAGE_KEY) === "enabled" &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    );
  } catch {
    return false;
  }
}

interface Props {
  enabled: boolean;
  onChange(enabled: boolean): void;
}

export function WeatherAlertControl({ enabled, onChange }: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const supported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
  const permission = supported ? Notification.permission : "unsupported";
  const platform =
    typeof navigator === "undefined"
      ? "desktop"
      : detectInstallPlatform({
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          maxTouchPoints: navigator.maxTouchPoints,
        });
  const standalone =
    typeof window !== "undefined" && typeof navigator !== "undefined"
      ? isStandaloneDisplay(
          window.matchMedia?.("(display-mode: standalone)").matches ?? false,
          (navigator as Navigator & { standalone?: boolean }).standalone === true,
        )
      : false;
  const needsIosInstall = requiresHomeScreenInstall(platform, standalone);

  const toggle = async () => {
    if (!supported || busy || permission === "denied" || needsIosInstall) {
      setBlocked(permission === "denied");
      return;
    }

    setBusy(true);
    try {
      const result = permission === "granted" ? "granted" : await Notification.requestPermission();
      if (result !== "granted") {
        setBlocked(result === "denied");
        return;
      }
      const next = !enabled;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "enabled" : "disabled");
      } catch {
        // The preference still applies for the current session.
      }
      onChange(next);
      setBlocked(false);
    } catch {
      setBlocked(true);
    } finally {
      setBusy(false);
    }
  };

  const title = !supported
    ? t("weatherAlertsUnavailable")
    : needsIosInstall
      ? t("weatherAlertsInstallRequired")
      : permission === "denied" || blocked
        ? t("weatherAlertsBlocked")
        : enabled
          ? t("weatherAlertsOn")
          : t("weatherAlertsOff");

  return (
    <Button
      variant="glass"
      size="icon"
      className={`weather-alert-control${enabled ? " weather-alert-control--enabled" : ""}`}
      onClick={() => void toggle()}
      disabled={!supported || permission === "denied" || needsIosInstall || busy}
      aria-label={title}
      aria-pressed={enabled}
      title={title}
    >
      {enabled ? <Bell aria-hidden="true" /> : <BellOff aria-hidden="true" />}
    </Button>
  );
}
