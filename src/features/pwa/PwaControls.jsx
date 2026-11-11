import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "../../lib/icons";
import { formatTemperature } from "../../lib/formatters";
import { getWeatherLabel } from "../weather/utils/weatherCode";
import { isDeviceLocation } from "../weather/utils/location";
import { buildForecastUrl } from "../weather/api/openMeteo";
import { buildWeatherAlert } from "../../pwa/alerts";
import {
  rememberForecast,
  shareForecast,
  showAppNotification,
} from "../../pwa/use-pwa";

const ALERT_KEY = "aether-last-alert";

function placeName(location, t) {
  if (!location) return "";
  if (isDeviceLocation(location) || !location.name) return t("demoLocation");
  return location.name;
}

function permissionLabel(state, t) {
  if (state === "granted") return t("permissionOn");
  if (state === "denied") return t("permissionBlocked");
  if (state === "unsupported") return t("permissionUnsupported");
  return t("permissionOff");
}

export function WeatherAlerts({
  weather,
  location,
  language,
  temperatureUnit,
  windSpeedUnit,
  enabled,
  t,
}) {
  useEffect(() => {
    if (!weather || !location) return undefined;
    const url = buildForecastUrl(location, { temperatureUnit, windSpeedUnit });
    const name = placeName(location, t);
    rememberForecast({
      url: url.toString(),
      placeName: name,
      language,
      temperatureUnit,
    }).catch(() => {});

    if (!enabled) return undefined;
    const alert = buildWeatherAlert({
      hourly: weather.hourly,
      daily: weather.daily,
      placeName: name,
      language,
      temperatureUnit,
    });
    if (!alert) return undefined;

    let seen = "";
    try {
      seen = localStorage.getItem(ALERT_KEY) || "";
    } catch {
      seen = "";
    }
    if (seen === alert.id) return undefined;

    showAppNotification(alert)
      .then(() => {
        try {
          localStorage.setItem(ALERT_KEY, alert.id);
        } catch {
          /* storage is optional */
        }
      })
      .catch(() => {});
    return undefined;
  }, [weather, location, language, temperatureUnit, windSpeedUnit, enabled, t]);

  return null;
}

export function InstallBanner({ pwa, t }) {
  if (!pwa.showInstallBanner) return null;
  return (
    <div className="install-banner" role="region" aria-label={t("installApp")}>
      <Icon name="download" size={18} />
      <p>
        <strong>{t("installTitle")}</strong>
        <span>{pwa.iosInstall ? t("installIosHint") : t("installHint")}</span>
      </p>
      {pwa.canInstall && (
        <button
          type="button"
          className="install-banner__action"
          onClick={pwa.promptInstall}
        >
          {t("installApp")}
        </button>
      )}
      <button
        type="button"
        className="install-banner__dismiss"
        onClick={pwa.dismissInstall}
        aria-label={t("dismiss")}
      >
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}

export function OfflineNotice({ online, t }) {
  if (online) return null;
  return (
    <div className="inline-alert offline-notice" role="status">
      <Icon name="cloud" size={16} />
      {t("offlineNotice")}
    </div>
  );
}

function PermissionRow({ icon, title, detail, actionLabel, onAction, done }) {
  return (
    <div className="permission-row">
      <span className="permission-row__icon">
        <Icon name={icon} size={16} />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      {done || !onAction ? (
        <em>{actionLabel}</em>
      ) : (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function PwaSheet({
  open,
  onClose,
  pwa,
  t,
  onLocate,
  geoLoading,
  onShare,
  shareState,
}) {
  const titleId = useId();
  const dialogRef = useRef(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    dialogRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const notificationsGranted = pwa.notificationPermission === "granted";
  const notificationsClosed =
    pwa.notificationPermission === "denied" ||
    pwa.notificationPermission === "unsupported";
  const locationGranted = pwa.locationPermission === "granted";
  const locationClosed = pwa.locationPermission === "denied";
  const backgroundClosed =
    pwa.backgroundSync === "granted" ||
    pwa.backgroundSync === "unsupported" ||
    pwa.backgroundSync === "denied";
  const installLabel = pwa.installed
    ? t("permissionOn")
    : pwa.canInstall
      ? t("installApp")
      : t("installWaiting");

  return (
    <div className="pwa-sheet-backdrop" onClick={onClose}>
      <div
        className="pwa-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="pwa-sheet__header">
          <div>
            <span className="section-kicker">{t("mobileApp")}</span>
            <h2 id={titleId}>{t("appPermissions")}</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label={t("dismiss")}
          >
            <Icon name="close" size={16} />
          </button>
        </header>
        <p className="pwa-sheet__lead">{t("permissionsLead")}</p>

        <PermissionRow
          icon="download"
          title={t("installApp")}
          detail={
            pwa.installed
              ? t("installedDetail")
              : pwa.iosInstall
                ? t("installIosHint")
                : t("installHint")
          }
          actionLabel={installLabel}
          done={pwa.installed || (!pwa.canInstall && !pwa.iosInstall)}
          onAction={pwa.canInstall ? pwa.promptInstall : undefined}
        />
        <PermissionRow
          icon="locate"
          title={t("useLocation")}
          detail={permissionLabel(pwa.locationPermission, t)}
          actionLabel={
            locationGranted || locationClosed
              ? permissionLabel(pwa.locationPermission, t)
              : geoLoading
                ? t("refreshing")
                : t("allow")
          }
          done={locationGranted || locationClosed}
          onAction={onLocate}
        />
        <PermissionRow
          icon="bell"
          title={t("notifications")}
          detail={
            pwa.iosInstall
              ? t("notificationsNeedInstall")
              : permissionLabel(pwa.notificationPermission, t)
          }
          actionLabel={
            notificationsGranted || notificationsClosed
              ? permissionLabel(pwa.notificationPermission, t)
              : t("allow")
          }
          done={notificationsGranted || notificationsClosed}
          onAction={pwa.requestNotifications}
        />
        <PermissionRow
          icon="refresh"
          title={t("backgroundRefresh")}
          detail={permissionLabel(pwa.backgroundSync, t)}
          actionLabel={
            backgroundClosed
              ? permissionLabel(pwa.backgroundSync, t)
              : t("allow")
          }
          done={backgroundClosed}
          onAction={pwa.registerBackgroundSync}
        />
        <PermissionRow
          icon="shield"
          title={t("keepData")}
          detail={
            pwa.storagePersisted ? t("permissionOn") : t("keepDataDetail")
          }
          actionLabel={pwa.storagePersisted ? t("permissionOn") : t("allow")}
          done={pwa.storagePersisted}
          onAction={pwa.requestPersistentStorage}
        />
        <PermissionRow
          icon="share"
          title={t("shareForecast")}
          detail={
            shareState === "copied"
              ? t("forecastCopied")
              : t("shareForecastDetail")
          }
          actionLabel={t("share")}
          done={false}
          onAction={onShare}
        />
      </div>
    </div>
  );
}

export function useForecastShare({
  weather,
  location,
  language,
  temperatureUnit,
  t,
}) {
  const [shareState, setShareState] = useState("");

  async function onShare() {
    const name = placeName(location, t);
    const temperature = formatTemperature(
      weather?.current?.temperature_2m,
      temperatureUnit,
    );
    const condition = getWeatherLabel(weather?.current?.weather_code, t);
    const title = `${t("brand")} — ${name}`;
    const text = `${name}: ${temperature}, ${condition}`;
    try {
      const result = await shareForecast({
        title,
        text,
        url: window.location.href,
      });
      setShareState(result);
    } catch (error) {
      if (error?.name !== "AbortError") setShareState("unavailable");
    }
  }

  return { shareState, onShare };
}
