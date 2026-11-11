import { useI18n } from "@/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <p>
        {t("dataBy")}{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
          Open-Meteo.com
        </a>{" "}
        (CC BY 4.0). {t("disclaimer")}
      </p>
      <p className="muted">{t("shortcutsHint")}</p>
    </footer>
  );
}
