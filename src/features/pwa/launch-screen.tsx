import { useEffect, useState } from "react";
import { useI18n } from "@/i18n";

const SESSION_KEY = "aether:pwa-launch-seen";

function shouldShowLaunch(): boolean {
  // Keep normal browser visits unobstructed. The cinematic intro is reserved for
  // installed standalone launches, after the operating system splash screen.
  const standalone =
    (typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches === true) ||
    (typeof navigator !== "undefined" && (navigator as Navigator & { standalone?: boolean }).standalone === true);
  if (!standalone) return false;

  try {
    return sessionStorage.getItem(SESSION_KEY) !== "1";
  } catch {
    return false;
  }
}

export function LaunchScreen() {
  const { t, language } = useI18n();
  const [visible, setVisible] = useState(shouldShowLaunch);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // The launch animation is optional when browser storage is unavailable.
    }

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const exitTimer = window.setTimeout(() => setLeaving(true), reducedMotion ? 120 : 1_080);
    const removeTimer = window.setTimeout(() => setVisible(false), reducedMotion ? 220 : 1_520);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`launch-screen${leaving ? " launch-screen--leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={t("launchLoading")}
    >
      <div className="launch-screen__stars" aria-hidden="true" />
      <div className="launch-screen__orbit launch-screen__orbit--one" aria-hidden="true" />
      <div className="launch-screen__orbit launch-screen__orbit--two" aria-hidden="true" />
      <div className="launch-screen__content">
        <img className="launch-screen__icon" src={`${import.meta.env.BASE_URL}icons/icon-512.png`} alt="" width="104" height="104" />
        <p className="launch-screen__kicker">THE SKY, REIMAGINED</p>
        <h1>AETHER</h1>
        <p className="launch-screen__tagline">{language === "ar" ? "الطقس كسماء حيّة" : "The weather, as a living sky."}</p>
        <div className="launch-screen__progress" aria-hidden="true">
          <span />
        </div>
        <span className="launch-screen__loading">{t("launchLoading")}</span>
      </div>
      <span className="launch-screen__version">AETHER WEATHER EXPERIENCE</span>
    </div>
  );
}
