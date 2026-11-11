import { useEffect } from "react";
import type { Language, ThemePreference } from "@/state/app-state";
import { directionFor } from "@/i18n";

/** Reflect language, direction and theme onto <html>. `system` follows the OS and updates live. */
export function useDocumentSettings(language: Language, theme: ThemePreference) {
  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = directionFor(language);
  }, [language]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const apply = () => {
      const resolved = theme === "system" ? (media.matches ? "light" : "dark") : theme;
      document.documentElement.dataset.theme = resolved;
    };
    apply();
    if (theme !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
}
