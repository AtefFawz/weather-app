import { useEffect, useRef } from "react";
import { Check, Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/button";
import { useI18n } from "@/i18n";
import { usePwaInstall } from "./use-pwa-install";

export function InstallControl() {
  const { t } = useI18n();
  const { installed, isIos, isAndroid, helpOpen, installing, install, closeHelp } = usePwaInstall();
  const triggerButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!helpOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeHelp();
        return;
      }
      if (event.key !== "Tab" || !dialog.current) return;
      const focusable = Array.from(
        dialog.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.current.contains(document.activeElement))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.current.contains(document.activeElement))) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => triggerButton.current?.focus());
    };
  }, [helpOpen, closeHelp]);

  const instructions = isIos
    ? [t("installIosStepOne"), t("installIosStepTwo"), t("installIosStepThree")]
    : isAndroid
      ? [t("installAndroidStepOne"), t("installAndroidStepTwo"), t("installAndroidStepThree")]
      : [t("installDesktopStepOne"), t("installDesktopStepTwo")];

  return (
    <>
      <Button
        variant={installed ? "glass" : "solid"}
        size="sm"
        className="install-control"
        ref={triggerButton}
        onClick={() => void install()}
        disabled={installed || installing}
        aria-haspopup="dialog"
        aria-label={installed ? t("installedApp") : t("installApp")}
        title={installed ? t("installedApp") : t("installApp")}
      >
        {installed ? <Check aria-hidden="true" /> : <Download aria-hidden="true" className={installing ? "spin" : undefined} />}
        <span>{installed ? t("installedApp") : installing ? t("installingApp") : t("installApp")}</span>
      </Button>

      {helpOpen && (
        <div
          className="install-dialog-backdrop"
          onClick={(event) => event.target === event.currentTarget && closeHelp()}
        >
          <section
            ref={dialog}
            className="install-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-dialog-title"
            aria-describedby="install-dialog-description"
          >
            <button ref={closeButton} className="install-dialog__close" type="button" onClick={closeHelp} aria-label={t("close")}>
              <X aria-hidden="true" />
            </button>
            <div className="install-dialog__brand">
              <img
                src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
                alt=""
                width="68"
                height="68"
              />
              <span className="install-dialog__eyebrow">AETHER / APP EXPERIENCE</span>
            </div>
            <h2 id="install-dialog-title">{t("installDialogTitle")}</h2>
            <p id="install-dialog-description">{t("installDialogDescription")}</p>
            <ol className="install-dialog__steps">
              {instructions.map((step, index) => (
                <li key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
            <div className="install-dialog__privacy">
              <Smartphone aria-hidden="true" />
              <p>{t("installPrivacyNote")}</p>
            </div>
            <Button variant="solid" size="md" className="install-dialog__done" onClick={closeHelp}>
              {t("gotIt")}
            </Button>
          </section>
        </div>
      )}
    </>
  );
}
