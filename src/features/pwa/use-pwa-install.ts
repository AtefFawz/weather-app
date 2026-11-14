import { useCallback, useEffect, useState } from "react";
import { detectInstallPlatform, isStandaloneDisplay, type InstallPlatform } from "./platform";

interface InstallChoice {
  outcome: "accepted" | "dismissed";
  platform: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<InstallChoice>;
}

function detectStandalone(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const displayMode = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isStandaloneDisplay(displayMode, iosStandalone);
}

function detectPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "desktop";
  return detectInstallPlatform({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
  });
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(detectStandalone);
  const [helpOpen, setHelpOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const platform = detectPlatform();
  const isIos = platform === "ios";
  const isAndroid = platform === "android";

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setHelpOpen(false);
    };
    const standaloneQuery = typeof window.matchMedia === "function" ? window.matchMedia("(display-mode: standalone)") : null;
    const onDisplayModeChange = () => setInstalled(detectStandalone());

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    standaloneQuery?.addEventListener?.("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      standaloneQuery?.removeEventListener?.("change", onDisplayModeChange);
    };
  }, []);

  const install = useCallback(async () => {
    if (installed) return;
    if (!deferredPrompt) {
      setHelpOpen(true);
      return;
    }

    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch {
      setHelpOpen(true);
    } finally {
      setDeferredPrompt(null);
      setInstalling(false);
    }
  }, [deferredPrompt, installed]);

  const closeHelp = useCallback(() => setHelpOpen(false), []);

  return {
    installed,
    canPrompt: deferredPrompt !== null,
    isIos,
    isAndroid,
    helpOpen,
    installing,
    install,
    closeHelp,
  };
}
