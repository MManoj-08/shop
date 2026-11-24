"use client";

import Link from "next/link";
import { useState } from "react";
import { rupees } from "@/lib/format";
import type { DayStat, Range } from "./daily-stats";

const TABS: [Range, string][] = [
  ["7", "7 days"],
  ["30", "30 days"],
  ["month", "This month"],
];

// A tidy top for the vertical axis (₹100, ₹200, ₹500, ₹1k...) so the grid lines land on round numbers
function niceScale(maxRupees: number) {
  if (maxRupees <= 0) return { step: 100, top: 400 };
  const rough = maxRupees / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const r = rough / mag;
  const step = Math.max((r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * mag, 1);
  return { step, top: Math.ceil(maxRupees / step) * step };
}
const tickLabel = (v: number) => (v >= 1000 ? `₹${+(v / 1000).toFixed(1)}k` : `₹${v}`);

export function SalesChart({ days, range }: { days: DayStat[]; range: Range }) {
  const [active, setActive] = useState<number | null>(null);
  const n = days.length;

  const maxPaise = Math.max(...days.map((d) => d.paid + d.open), 0);
  const { step, top } = niceScale(maxPaise / 100);
  const topPaise = top * 100;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const pct = (paise: number) => `${(paise / topPaise) * 100}%`;

  const totalPaid = days.reduce((a, d) => a + d.paid, 0);
  const avg = Math.round(totalPaid / n);
  const best = days.reduce((b, d) => (d.paid > b.paid ? d : b), days[0]);
  const empty = maxPaise === 0;
  const roomy = n <= 10; // few bars: show a label and order count under each one

  const a = active === null ? null : days[active];
  const p = active === null ? 0 : ((active + 0.5) / n) * 100;

  return (
    <div className="rounded-2xl border border-green-950/10 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-medium text-green-950">Sales by day</h3>
          <p className="text-sm text-stone-500">Hover or tap a bar to see that day.</p>
        </div>
        <nav aria-label="Choose period" className="flex gap-1.5 rounded-full bg-green-950/5 p-1">
          {TABS.map(([k, label]) => (
            <Link
              key={k}
              href={k === "7" ? "/admin" : `/admin?range=${k}`}
              scroll={false}
              aria-current={range === k ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                range === k ? "bg-green-900 text-white shadow-sm" : "text-stone-600 hover:text-green-950"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-stone-500">Paid in this period</dt>
          <dd className="font-display text-xl font-medium text-green-950">{rupees(totalPaid)}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Average per day</dt>
          <dd className="font-display text-xl font-medium text-green-950">{rupees(avg)}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Best day</dt>
          <dd className="font-display text-xl font-medium text-green-950">
            {best.paid > 0 ? rupees(best.paid) : "–"}
            {best.paid > 0 && <span className="ml-1.5 text-xs font-normal text-stone-500">{best.isToday ? "today" : best.short}</span>}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex" role="group" aria-label="Bar chart of sales for each day. The table below has the same numbers.">
        {/* vertical axis */}
        <div className="relative h-56 w-11 shrink-0" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-2 translate-y-1/2 text-[11px] tabular-nums text-stone-500" style={{ bottom: pct(t * 100) }}>
              {tickLabel(t)}
            </span>
          ))}
        </div>

        <div className="relative h-56 min-w-0 flex-1" onMouseLeave={() => setActive(null)}>
          {/* grid lines */}
          {ticks.map((t) => (
            <div
              key={t}
              aria-hidden
              className={`absolute inset-x-0 border-t ${t === 0 ? "border-green-950/30" : "border-dashed border-green-950/10"}`}
              style={{ bottom: pct(t * 100) }}
            />
          ))}

          {/* average line */}
          {!empty && avg > 0 && (
            <div aria-hidden className="absolute inset-x-0 z-10 border-t-2 border-dashed border-amber-500/80" style={{ bottom: pct(avg) }}>
              <span className="absolute right-0 -top-[22px] rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
                Average {rupees(avg)}
              </span>
            </div>
          )}

          {/* bars */}
          <div className={`absolute inset-0 flex items-end ${n > 20 ? "gap-0.5" : "gap-1.5 sm:gap-2.5"}`}>
            {days.map((d, i) => {
              const total = d.paid + d.open;
              return (
                <button
                  key={d.key}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive(active === i ? null : i)}
                  aria-label={`${d.label}: ${d.orders} ${d.orders === 1 ? "order" : "orders"}, ${rupees(d.paid)} paid${d.open ? `, ${rupees(d.open)} not paid yet` : ""}`}
                  className={`group relative flex h-full min-w-0 flex-1 cursor-pointer flex-col justify-end rounded-t-md outline-none focus-visible:ring-2 focus-visible:ring-green-700 ${
                    active === i ? "bg-green-950/5" : ""
                  }`}
                >
                  {total === 0 ? (
                    <div className="h-[3px] w-full rounded-full bg-stone-200" />
                  ) : (
                    <div
                      className={`flex w-full flex-col-reverse overflow-hidden rounded-t-md transition-opacity ${active !== null && active !== i ? "opacity-50" : ""}`}
                      style={{ height: pct(total), minHeight: 4 }}
                    >
                      {d.paid > 0 && <div style={{ flexGrow: d.paid }} className={d.isToday ? "bg-green-800" : "bg-green-600"} />}
                      {d.open > 0 && <div style={{ flexGrow: d.open }} className="bg-amber-300" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* details for the bar you are pointing at */}
          {a && (
            <div
              role="status"
              className="pointer-events-none absolute top-1 z-20 w-48 rounded-xl border border-green-950/10 bg-white p-3 text-xs shadow-lg"
              style={{ left: `${p}%`, transform: `translateX(${p < 22 ? "-8%" : p > 78 ? "-92%" : "-50%"})` }}
            >
              <p className="mb-1.5 text-sm font-semibold text-green-950">{a.label}</p>
              <p className="flex justify-between"><span className="text-stone-500">Orders</span><b>{a.orders}</b></p>
              <p className="flex justify-between"><span className="text-stone-500">Delivered</span><b>{a.delivered}</b></p>
              <p className="flex justify-between"><span className="text-stone-500">Paid</span><b className="text-green-800">{rupees(a.paid)}</b></p>
              <p className="flex justify-between"><span className="text-stone-500">Not paid yet</span><b className="text-amber-700">{rupees(a.open)}</b></p>
              {a.cancelled > 0 && (
                <p className="flex justify-between"><span className="text-stone-500">Cancelled</span><b className="text-red-700">{a.cancelled}</b></p>
              )}
            </div>
          )}

          {empty && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-stone-500">No sales in this period yet</p>
          )}
        </div>
      </div>

      {/* day labels */}
      <div className={`ml-11 mt-1.5 flex ${n > 20 ? "gap-0.5" : "gap-1.5 sm:gap-2.5"}`} aria-hidden>
        {days.map((d, i) => {
          const showLabel = roomy || (n - 1 - i) % 5 === 0;
          // longer periods: just the day number, with the month on the first label and on the 1st
          const first = i === days.findIndex((_, j) => (n - 1 - j) % 5 === 0);
          const axis = roomy ? d.short : first || d.key.endsWith("-01") ? d.dm : d.dm.split(" ")[0];
          return (
            <div key={d.key} className="relative h-9 min-w-0 flex-1 text-center">
              {showLabel && (
                <span className={`absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap text-[11px] ${d.isToday ? "font-bold text-green-900" : "text-stone-500"}`}>
                  {axis}
                </span>
              )}
              {roomy && (
                <span className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap text-[10px] text-stone-400">
                  {d.orders} {d.orders === 1 ? "order" : "orders"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <ul className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-stone-600" aria-label="Legend">
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-green-600" /> Paid</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-green-800" /> Paid, today</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-amber-300" /> Not paid yet</li>
        <li className="flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed border-amber-500" /> Daily average</li>
      </ul>
    </div>
  );
}
