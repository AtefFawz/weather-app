import { useI18n } from "@/i18n";

export function DashboardSkeleton() {
  const { t } = useI18n();
  return (
    <div className="dashboard" role="status" aria-busy="true" aria-label={t("loading")}>
      <div className="dashboard__top">
        <div className="skeleton skeleton--hero" />
        <div className="skeleton skeleton--card" />
      </div>
      <div className="skeleton skeleton--chart" />
      <div className="dashboard__grid">
        <div className="skeleton skeleton--card" />
        <div className="dashboard__tiles">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton skeleton--tile" />
          ))}
        </div>
      </div>
      <p className="sr-only">{t("loading")}</p>
    </div>
  );
}
