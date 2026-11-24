import Link from "next/link";
import { rupees } from "@/lib/format";
import type { DailyStats } from "./daily-stats";

const PERIOD: Record<string, string> = { "7": "last 7 days", "30": "last 30 days", month: "this month" };

// One row per day, newest first, using the same numbers as the chart above it
export function DailyTracker({ stats }: { stats: DailyStats }) {
  const { days, total, range } = stats;
  const rows = [...days].reverse();
  const num = "px-4 py-3 text-right tabular-nums";
  return (
    <section className="space-y-3 rounded-2xl border border-green-950/10 bg-white p-5">
      <div>
        <h2 className="font-display text-xl font-medium text-green-950">Daily tracker</h2>
        <p className="text-sm text-stone-500">
          Orders and amount for each day, {PERIOD[range]}. Tap a day to see its orders. Change the period with the buttons above the chart.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-green-950/10">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="border-b border-green-950/10 bg-green-50/60 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Day</th>
              <th className={`${num} font-semibold`}>Orders</th>
              <th className={`${num} font-semibold`}>Delivered</th>
              <th className={`${num} font-semibold`}>Cancelled</th>
              <th className={`${num} font-semibold`}>Amount paid</th>
              <th className={`${num} font-semibold`}>Not paid yet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-green-950/10">
            {rows.map((d) => {
              const any = d.orders + d.cancelled > 0;
              return (
                <tr key={d.key} className={d.isToday ? "bg-green-50/50" : ""}>
                  <td className="px-4 py-3 font-medium">
                    {any ? (
                      <Link href={`/admin/orders?date=${d.key}`} className="text-green-800 underline">
                        {d.label}
                      </Link>
                    ) : (
                      <span className="text-stone-400">{d.label}</span>
                    )}
                  </td>
                  <td className={`${num} font-semibold`}>{any ? d.orders : <span className="text-stone-300">–</span>}</td>
                  <td className={num}>{d.delivered || <span className="text-stone-300">–</span>}</td>
                  <td className={num}>{d.cancelled ? <span className="text-red-700">{d.cancelled}</span> : <span className="text-stone-300">–</span>}</td>
                  <td className={`${num} font-semibold text-green-900`}>{d.paid ? rupees(d.paid) : <span className="font-normal text-stone-300">–</span>}</td>
                  <td className={`${num} text-amber-800`}>{d.open ? rupees(d.open) : <span className="text-stone-300">–</span>}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-green-950/15 bg-green-50/60 font-semibold">
            <tr>
              <td className="px-4 py-3">
                Total, {days.length} {days.length === 1 ? "day" : "days"}
              </td>
              <td className={num}>{total.orders}</td>
              <td className={num}>{total.delivered}</td>
              <td className={num}>{total.cancelled}</td>
              <td className={`${num} text-green-900`}>{rupees(total.paid)}</td>
              <td className={`${num} text-amber-800`}>{rupees(total.open)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-stone-500">
        &ldquo;Orders&rdquo; does not count cancelled ones. &ldquo;Amount paid&rdquo; is money you have confirmed;
        &ldquo;Not paid yet&rdquo; is the value of live orders still waiting for payment.
      </p>
    </section>
  );
}
