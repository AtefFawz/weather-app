import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Clock3, Undo2 } from "lucide-react";
import { formatHour, formatTemperature, formatWeekday, hourOfDay } from "@/core/format";
import { clamp } from "@/core/color";
import { computeSky } from "@/core/sky-state";
import { monotonePath } from "@/core/spline";
import type { TemperatureUnit } from "@/core/units";
import { getCondition } from "@/core/wmo";
import type { HourSample } from "@/data/models";
import { useI18n } from "@/i18n";
import { Button } from "@/components/button";
import { Card } from "./card";

const HEIGHT = 250;
const PAD = { left: 38, right: 18, top: 30, bottom: 62 };
const RIBBON = 12;

interface Props {
  hours: readonly HourSample[];
  latitude: number;
  longitude: number;
  timezone: string;
  unit: TemperatureUnit;
  scrub: number | null;
  onScrub(index: number | null): void;
}

function useWidth() {
  const [width, setWidth] = useState(720);
  const observer = useRef<ResizeObserver | null>(null);
  // Callback ref: (re)attach the observer whenever the element mounts.
  const ref = (node: HTMLDivElement | null) => {
    observer.current?.disconnect();
    if (!node) return;
    setWidth(Math.max(280, node.clientWidth));
    observer.current = new ResizeObserver(([entry]) => entry && setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    observer.current.observe(node);
  };
  return [width, ref] as const;
}

/** Runs of consecutive hours where `pick` is true, as [startIndex, endIndex] inclusive. */
function runs(hours: readonly HourSample[], pick: (h: HourSample) => boolean): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let start = -1;
  hours.forEach((h, i) => {
    if (pick(h) && start === -1) start = i;
    if (!pick(h) && start !== -1) {
      out.push([start, i - 1]);
      start = -1;
    }
  });
  if (start !== -1) out.push([start, hours.length - 1]);
  return out;
}

export function HourlyChart({ hours, latitude, longitude, timezone, unit, scrub, onScrub }: Props) {
  const { t, language } = useI18n();
  const [width, widthRef] = useWidth();
  const dragging = useRef(false);

  const n = hours.length;
  const innerW = width - PAD.left - PAD.right;
  const plotBottom = HEIGHT - PAD.bottom;
  const plotH = plotBottom - PAD.top;
  const step = n > 1 ? innerW / (n - 1) : innerW;
  const x = (i: number) => PAD.left + i * step;

  const geometry = useMemo(() => {
    const temps = hours.map((h) => h.temperature).filter((v): v is number => v !== null);
    const lo = temps.length ? Math.min(...temps) - 2 : 0;
    const hi = temps.length ? Math.max(...temps) + 2 : 30;
    const y = (value: number) => PAD.top + (1 - (value - lo) / (hi - lo || 1)) * plotH;
    const points = hours.flatMap((h, i) => (h.temperature === null ? [] : [{ x: PAD.left + i * step, y: y(h.temperature) }]));
    const line = monotonePath(points);
    const first = points[0];
    const last = points[points.length - 1];
    const area = first && last ? `${line}L${last.x},${plotBottom}L${first.x},${plotBottom}Z` : "";
    return { lo, hi, y, points, line, area };
  }, [hours, step, plotH, plotBottom]);

  const ribbon = useMemo(
    () => hours.map((h) => computeSky(latitude, longitude, h.time, { weatherCode: h.weatherCode, cloudCover: h.cloudCover }).colors.mid),
    [hours, latitude, longitude],
  );

  const nights = useMemo(() => runs(hours, (h) => !h.isDay), [hours]);
  const active = scrub ?? 0;
  const activeHour = hours[active];

  const indexFromEvent = (event: PointerEvent<SVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const local = ((event.clientX - rect.left) / rect.width) * width;
    return clamp(Math.round((local - PAD.left) / step), 0, n - 1);
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    onScrub(indexFromEvent(event));
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (dragging.current) onScrub(indexFromEvent(event));
  };
  const endDrag = () => {
    dragging.current = false;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rtl = language === "ar";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const backward = rtl ? "ArrowRight" : "ArrowLeft";
    const move = (to: number) => {
      event.preventDefault();
      onScrub(clamp(to, 0, n - 1));
    };
    if (event.key === forward || event.key === "ArrowUp") move(active + 1);
    else if (event.key === backward || event.key === "ArrowDown") move(active - 1);
    else if (event.key === "PageUp") move(active + 6);
    else if (event.key === "PageDown") move(active - 6);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(n - 1);
    else if (event.key === "Escape" && scrub !== null) {
      event.preventDefault();
      onScrub(null);
    }
  };

  if (n === 0) return null;

  const valueText = activeHour
    ? `${formatWeekday(activeHour.time, timezone, language, "long")} ${formatHour(activeHour.time, timezone, language)}, ${formatTemperature(activeHour.temperature, unit)}, ${t(getCondition(activeHour.weatherCode).key)}`
    : "";

  const labelEvery = width < 520 ? 8 : 6;
  const cursorX = x(active);
  const bubbleW = 112;
  const bubbleX = clamp(cursorX - bubbleW / 2, 4, width - bubbleW - 4);

  return (
    <Card
      id="hourly"
      title={t("hourlyTitle")}
      icon={<Clock3 aria-hidden="true" />}
      className="hourly"
      action={
        scrub === null ? (
          <span className="muted hourly__hint">{t("scrubHint")}</span>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => onScrub(null)}>
            <Undo2 aria-hidden="true" />
            {t("backToNow")}
          </Button>
        )
      }
    >
      <div
        ref={widthRef}
        className="hourly__chart"
        role="slider"
        tabIndex={0}
        aria-label={t("scrubLabel")}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={n - 1}
        aria-valuenow={active}
        aria-valuetext={valueText}
        onKeyDown={onKeyDown}
        data-testid="hourly-chart"
      >
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="hourly__svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="temp-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.5" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {nights.map(([from, to]) => (
            <rect
              key={from}
              x={x(from) - step / 2}
              y={PAD.top - 6}
              width={(to - from + 1) * step}
              height={plotH + 6}
              className="hourly__night"
            />
          ))}

          {[0, 0.5, 1].map((f) => {
            const value = geometry.lo + (geometry.hi - geometry.lo) * (1 - f);
            const gy = PAD.top + f * plotH;
            return (
              <g key={f}>
                <line x1={PAD.left} x2={width - PAD.right} y1={gy} y2={gy} className="hourly__grid" />
                <text x={PAD.left - 8} y={gy + 4} textAnchor="end" className="hourly__axis">
                  {formatTemperature(value, unit)}
                </text>
              </g>
            );
          })}

          {hours.map((h, i) => {
            const p = clamp((h.precipProbability ?? 0) / 100, 0, 1);
            if (p < 0.05) return null;
            const barH = p * 38;
            return (
              <rect
                key={h.time}
                x={x(i) - step * 0.34}
                y={plotBottom - barH}
                width={step * 0.68}
                height={barH}
                rx={2}
                className="hourly__rain"
              />
            );
          })}

          <path d={geometry.area} fill="url(#temp-fill)" />
          <path d={geometry.line} className="hourly__line" />

          {hours.map((h, i) => {
            const midnight = hourOfDay(h.time, timezone) === 0;
            const tick = i === 0 || midnight || i % labelEvery === 0;
            if (!tick) return null;
            return (
              <g key={`tick-${h.time}`}>
                <line x1={x(i)} x2={x(i)} y1={plotBottom} y2={plotBottom + 4} className="hourly__tick" />
                {i === 0 || i % labelEvery === 0 ? (
                  <text x={x(i)} y={plotBottom + 22 + RIBBON} textAnchor="middle" className="hourly__axis">
                    {i === 0 ? t("now") : formatHour(h.time, timezone, language)}
                  </text>
                ) : null}
                {midnight && i !== 0 ? (
                  <text x={x(i)} y={PAD.top - 12} textAnchor="middle" className="hourly__day">
                    {formatWeekday(h.time, timezone, language)}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* Sky ribbon: the actual sky colour at every hour, computed from solar geometry. */}
          {ribbon.map((color, i) => (
            <rect
              key={i}
              x={x(i) - step / 2}
              y={plotBottom + 6}
              width={step + 0.6}
              height={RIBBON}
              fill={color}
              rx={i === 0 || i === n - 1 ? 4 : 0}
            />
          ))}

          {activeHour && (
            <g className={scrub === null ? "hourly__cursor hourly__cursor--live" : "hourly__cursor"}>
              <line x1={cursorX} x2={cursorX} y1={PAD.top - 4} y2={plotBottom + 6 + RIBBON} />
              {activeHour.temperature !== null && <circle cx={cursorX} cy={geometry.y(activeHour.temperature)} r={6} />}
              <g transform={`translate(${bubbleX},${PAD.top - 28})`}>
                <rect width={bubbleW} height={22} rx={11} />
                <text x={bubbleW / 2} y={15} textAnchor="middle">
                  {formatHour(activeHour.time, timezone, language)} · {formatTemperature(activeHour.temperature, unit)}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>
      <p className="hourly__legend muted">
        <span className="legend legend--rain" /> {t("precipChance")}
      </p>
    </Card>
  );
}
