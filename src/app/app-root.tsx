import { I18nProvider, useI18n } from "@/i18n";
import { AppStateProvider, useAppState } from "@/state/context";
import type { AppStore } from "@/state/app-state";
import { ErrorBoundary } from "./error-boundary";
import { Shell } from "./app";

function Localized() {
  const language = useAppState((s) => s.language);
  return (
    <I18nProvider language={language}>
      <ErrorBoundary fallback={(reset) => <Crash onReset={reset} />}>
        <Shell />
      </ErrorBoundary>
    </I18nProvider>
  );
}

function Crash({ onReset }: { onReset(): void }) {
  const { t } = useI18n();
  return (
    <main className="crash" role="alert">
      <h1>{t("crashTitle")}</h1>
      <p>{t("crashBody")}</p>
      <button type="button" className="btn btn--solid btn--md" onClick={onReset}>
        {t("retry")}
      </button>
    </main>
  );
}

export function AppRoot({ store }: { store: AppStore }) {
  return (
    <AppStateProvider store={store}>
      <Localized />
    </AppStateProvider>
  );
}
