import { useEffect, useState } from "react";

const INSTALL_DISMISS_KEY = "aether-install-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIosDevice() {
  const userAgent = window.navigator.userAgent || "";
  const iPhone = /iphone|ipad|ipod/i.test(userAgent);
  const iPadOs =
    window.navigator.platform === "MacIntel" &&
    window.navigator.maxTouchPoints > 1;
  return iPhone || iPadOs;
}

async function readPermission(name) {
  if (!navigator.permissions?.query) return "unknown";
  try {
    const status = await navigator.permissions.query({ name });
    return status;
  } catch {
    return null;
  }
}

export function usePwa() {
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [online, setOnline] = useState(() => navigator.onLine);
  const [iosInstall, setIosInstall] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(
    () => sessionStorage.getItem(INSTALL_DISMISS_KEY) === "1",
  );
  const [notificationPermission, setNotificationPermission] = useState(() =>
    typeof Notification === "undefined"
      ? "unsupported"
      : Notification.permission,
  );
  const [locationPermission, setLocationPermission] = useState("unknown");
  const [storagePersisted, setStoragePersisted] = useState(false);
  const [backgroundSync, setBackgroundSync] = useState("unsupported");

  useEffect(() => {
    setIosInstall(isIosDevice() && !isStandalone());

    const onPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
      setIosInstall(false);
    };
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const onDisplayMode = () => setInstalled(isStandalone());

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    displayMode.addEventListener?.("change", onDisplayMode);

    if (navigator.storage?.persisted) {
      navigator.storage
        .persisted()
        .then(setStoragePersisted)
        .catch(() => {});
    }

    let locationStatus;
    let notificationStatus;
    let syncStatus;
    readPermission("geolocation").then((status) => {
      if (!status || typeof status === "string") return;
      locationStatus = status;
      setLocationPermission(status.state);
      status.onchange = () => setLocationPermission(status.state);
    });
    readPermission("notifications").then((status) => {
      if (!status || typeof status === "string") return;
      notificationStatus = status;
      setNotificationPermission(status.state);
      status.onchange = () => setNotificationPermission(status.state);
    });
    readPermission("periodic-background-sync").then((status) => {
      if (!status) {
        setBackgroundSync("unsupported");
        return;
      }
      syncStatus = status;
      setBackgroundSync(status.state);
      status.onchange = () => setBackgroundSync(status.state);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      displayMode.removeEventListener?.("change", onDisplayMode);
      if (locationStatus) locationStatus.onchange = null;
      if (notificationStatus) notificationStatus.onchange = null;
      if (syncStatus) syncStatus.onchange = null;
    };
  }, []);

  async function promptInstall() {
    if (!installEvent) return false;
    installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice.outcome === "accepted") setInstalled(true);
    return choice.outcome === "accepted";
  }

  function dismissInstall() {
    sessionStorage.setItem(INSTALL_DISMISS_KEY, "1");
    setInstallDismissed(true);
  }

  async function requestNotifications() {
    if (typeof Notification === "undefined") return "unsupported";
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
    if (result === "granted") await registerBackgroundSync();
    return result;
  }

  async function requestPersistentStorage() {
    if (!navigator.storage?.persist) return false;
    const granted = await navigator.storage.persist();
    setStoragePersisted(granted);
    return granted;
  }

  async function registerBackgroundSync() {
    if (
      !("serviceWorker" in navigator) ||
      !("periodicSync" in (await navigator.serviceWorker.ready))
    ) {
      setBackgroundSync("unsupported");
      return "unsupported";
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.periodicSync.register("weather-refresh", {
        minInterval: 12 * 60 * 60 * 1000,
      });
      setBackgroundSync("granted");
      return "granted";
    } catch {
      return "denied";
    }
  }

  return {
    canInstall: Boolean(installEvent),
    installed,
    iosInstall,
    showInstallBanner:
      !installed && !installDismissed && (Boolean(installEvent) || iosInstall),
    online,
    notificationPermission,
    locationPermission,
    storagePersisted,
    backgroundSync,
    promptInstall,
    dismissInstall,
    requestNotifications,
    requestPersistentStorage,
    registerBackgroundSync,
  };
}

export async function rememberForecast(payload) {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage({ type: "REMEMBER_FORECAST", payload });
}

export async function showAppNotification(alert) {
  const registration = await navigator.serviceWorker.ready;
  const icon = `${import.meta.env.BASE_URL}icons/icon-192.png`;
  await registration.showNotification(alert.title, {
    body: alert.body,
    icon,
    badge: icon,
    tag: alert.tag,
    lang: alert.lang,
    data: { url: import.meta.env.BASE_URL || "/" },
  });
  registration.active?.postMessage({ type: "ALERT_SHOWN", id: alert.id });
}

export async function shareForecast({ title, text, url }) {
  if (navigator.share) {
    await navigator.share({ title, text, url });
    return "shared";
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
    return "copied";
  }
  return "unavailable";
}
