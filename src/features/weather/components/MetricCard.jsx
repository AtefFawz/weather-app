import { Icon } from '../../../lib/icons';

export function MetricCard({ icon, label, value, detail, accent }) {
  return (
    <article className={`metric-card ${accent ? `metric-card--${accent}` : ''}`}>
      <div className="metric-card__top">
        <span className="metric-card__icon"><Icon name={icon} size={18} /></span>
        <span className="metric-card__label">{label}</span>
      </div>
      <div className="metric-card__value">{value}</div>
      {detail && <div className="metric-card__detail">{detail}</div>}
    </article>
  );
}
