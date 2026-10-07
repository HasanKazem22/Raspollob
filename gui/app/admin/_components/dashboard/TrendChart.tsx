"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Single-metric trend: current period (brand green line + 10% area wash) vs the previous
 * period at the same position (de-emphasis gray line). One axis, hairline grid,
 * crosshair + tooltip on hover/keyboard. Colors validated against the white card surface;
 * the gray is below 3:1 contrast, so the legend, tooltip and table view carry its values.
 */

/** Follows the store's brand colour (set in Admin → Home → Brand & Colors) */
const ACCENT = "var(--brand)";
const PREVIOUS = "#a8a29e";
const GRID = "#ececea";
const BASELINE = "#d4d4d1";
const HEIGHT = 260;
const M = { top: 20, right: 20, bottom: 30, left: 56 };

export interface TrendPoint {
  label: string;
  title: string;
  value: number;
  previous: number;
}

/** Round the axis max up to 1/2/2.5/5 × 10^n and return 4 even steps. */
function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 1, 2, 3, 4];
  const rough = max / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * pow).find((s) => s >= rough) ?? 10 * pow;
  return [0, 1, 2, 3, 4].map((i) => i * step);
}

export function TrendChart({
  points,
  seriesLabel,
  previousLabel,
  formatValue,
  formatTick,
}: {
  points: TrendPoint[];
  seriesLabel: string;
  previousLabel: string;
  formatValue: (n: number) => string;
  formatTick: (n: number) => string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const n = points.length;
  const innerW = Math.max(0, width - M.left - M.right);
  const innerH = HEIGHT - M.top - M.bottom;
  const ticks = niceTicks(Math.max(0, ...points.flatMap((p) => [p.value, p.previous])));
  const yMax = ticks[ticks.length - 1] || 1;

  const x = (i: number) => (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1));
  const y = (v: number) => innerH - (v / yMax) * innerH;

  const linePath = (key: "value" | "previous") =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");
  const areaPath =
    n > 0 ? `${linePath("value")} L${x(n - 1).toFixed(1)},${innerH} L${x(0).toFixed(1)},${innerH} Z` : "";

  // Thin out x labels so they never collide (~64px per label), always keeping the last
  const maxLabels = Math.max(2, Math.floor(innerW / 64));
  const labelEvery = Math.ceil(n / maxLabels);
  const showLabel = (i: number) => i === n - 1 || (i % labelEvery === 0 && n - 1 - i >= labelEvery / 2);

  const indexFromPointer = (clientX: number, rect: DOMRect) => {
    const px = clientX - rect.left - M.left;
    if (n <= 1) return 0;
    return Math.min(n - 1, Math.max(0, Math.round((px / innerW) * (n - 1))));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (n === 0) return;
    if (e.key === "ArrowRight") setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
    else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? n) - 1));
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  };

  const last = n - 1;
  const activePoint = active !== null ? points[active] : null;
  const tooltipLeft = active !== null ? M.left + x(active) : 0;
  const flip = active !== null && tooltipLeft > width - 180;

  return (
    <div>
      {/* Legend: line keys mirror the marks */}
      <div className="flex items-center gap-4 mb-3 text-xs text-zinc-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded-full" style={{ background: ACCENT }} /> {seriesLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded-full" style={{ background: PREVIOUS }} /> {previousLabel}
        </span>
      </div>

      <div
        ref={wrapRef}
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-brand/30 rounded-lg"
        tabIndex={0}
        role="img"
        aria-label={`${seriesLabel} trend. Use left and right arrow keys to read values.`}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        {width > 0 && (
          <svg width={width} height={HEIGHT} className="block select-none">
            <g transform={`translate(${M.left},${M.top})`}>
              {/* Grid + y ticks */}
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} stroke={t === 0 ? BASELINE : GRID} strokeWidth={1} />
                  <text x={-10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-zinc-400 text-[10px] tabular-nums">
                    {formatTick(t)}
                  </text>
                </g>
              ))}

              {/* X labels */}
              {points.map((p, i) =>
                showLabel(i) ? (
                  <text key={i} x={x(i)} y={innerH + 18} textAnchor={i === last && n > 1 ? "end" : "middle"} className="fill-zinc-400 text-[10px]">
                    {p.label}
                  </text>
                ) : null
              )}

              {/* Previous period (context), then current (the story) */}
              <path d={linePath("previous")} fill="none" stroke={PREVIOUS} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              <path d={areaPath} style={{ fill: ACCENT }} fillOpacity={0.1} />
              <path d={linePath("value")} fill="none" style={{ stroke: ACCENT }} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

              {/* End marker + direct label on the current series */}
              {n > 0 && active === null && (
                <>
                  <circle cx={x(last)} cy={y(points[last].value)} r={4} style={{ fill: ACCENT }} stroke="#fff" strokeWidth={2} />
                  <text
                    x={x(last)}
                    y={y(points[last].value) - 10}
                    textAnchor={n > 1 ? "end" : "middle"}
                    className="fill-zinc-700 text-[11px] font-semibold"
                  >
                    {formatValue(points[last].value)}
                  </text>
                </>
              )}

              {/* Crosshair */}
              {activePoint && active !== null && (
                <g>
                  <line x1={x(active)} x2={x(active)} y1={0} y2={innerH} stroke={BASELINE} strokeWidth={1} />
                  <circle cx={x(active)} cy={y(activePoint.previous)} r={4} fill={PREVIOUS} stroke="#fff" strokeWidth={2} />
                  <circle cx={x(active)} cy={y(activePoint.value)} r={4.5} style={{ fill: ACCENT }} stroke="#fff" strokeWidth={2} />
                </g>
              )}

              {/* Hit area: the pointer only needs to be near a date */}
              <rect
                x={0}
                y={0}
                width={innerW}
                height={innerH}
                fill="transparent"
                onPointerMove={(e) => setActive(indexFromPointer(e.clientX, (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect()))}
                onPointerLeave={() => setActive(null)}
              />
            </g>
          </svg>
        )}

        {/* Tooltip: values lead, labels follow */}
        {activePoint && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[160px] rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-lg"
            style={flip ? { right: width - tooltipLeft + 12 } : { left: tooltipLeft + 12 }}
          >
            <p className="text-[11px] font-semibold text-zinc-500 mb-1.5">{activePoint.title}</p>
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span className="w-3 h-0.5 rounded-full" style={{ background: ACCENT }} />
                {seriesLabel}
              </span>
              <span className="text-sm font-bold text-zinc-900 tabular-nums">{formatValue(activePoint.value)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 mt-0.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span className="w-3 h-0.5 rounded-full" style={{ background: PREVIOUS }} />
                {previousLabel}
              </span>
              <span className="text-xs font-semibold text-zinc-600 tabular-nums">{formatValue(activePoint.previous)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Accessible alternative to the chart: every value, no hovering needed. */
export function TrendTable({
  points,
  seriesLabel,
  previousLabel,
  formatValue,
}: {
  points: TrendPoint[];
  seriesLabel: string;
  previousLabel: string;
  formatValue: (n: number) => string;
}) {
  return (
    <div className="max-h-[300px] overflow-y-auto rounded-lg border border-zinc-100">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
          <tr>
            <th className="text-left font-semibold px-3 py-2">Period</th>
            <th className="text-right font-semibold px-3 py-2">{seriesLabel}</th>
            <th className="text-right font-semibold px-3 py-2">{previousLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {points.map((p, i) => (
            <tr key={i}>
              <td className="px-3 py-1.5 text-zinc-700">{p.title}</td>
              <td className="px-3 py-1.5 text-right font-semibold text-zinc-900 tabular-nums">{formatValue(p.value)}</td>
              <td className="px-3 py-1.5 text-right text-zinc-500 tabular-nums">{formatValue(p.previous)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
