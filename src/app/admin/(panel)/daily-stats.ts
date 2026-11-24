import { db } from "@/lib/db";
import { daysAgo, istDayKey, istDayStart } from "@/lib/admin";

export type Range = "7" | "30" | "month";
export const parseRange = (v: unknown): Range => (v === "30" || v === "month" ? v : "7");

export type DayStat = {
  key: string; // "2026-11-24", the India-time calendar day
  label: string; // "Today", "Yesterday", "Sun, 22 Nov"
  short: string; // "Sun 22", for the chart axis
  dm: string; // "22 Nov", for the chart axis on longer periods
  isToday: boolean;
  orders: number; // placed that day, not counting cancelled
  delivered: number;
  cancelled: number;
  paid: number; // paise: confirmed money
  open: number; // paise: live orders still waiting for payment
};

// One entry per day, oldest first. Orders are counted on the day they were placed (India time).
export async function getDailyStats(range: Range) {
  const today = istDayStart();
  const todayKey = istDayKey(today);
  const start = range === "month" ? new Date(`${todayKey.slice(0, 8)}01T00:00:00+05:30`) : daysAgo(range === "30" ? 29 : 6, today);
  const dayCount = Math.round((today.getTime() - start.getTime()) / 86_400_000) + 1;

  const orders = await db.order.findMany({
    where: { createdAt: { gte: start } },
    select: { createdAt: true, status: true, totalPaise: true, payment: { select: { status: true } } },
  });

  const blank = () => ({ orders: 0, delivered: 0, cancelled: 0, paid: 0, open: 0 });
  const byDay = new Map<string, ReturnType<typeof blank>>();
  for (const o of orders) {
    const key = istDayKey(o.createdAt);
    const r = byDay.get(key) ?? blank();
    if (o.status === "CANCELLED") r.cancelled++;
    else {
      r.orders++;
      if (o.status === "DELIVERED") r.delivered++;
      // money counts as received once the payment is confirmed; until then it is still open
      if (o.payment?.status === "PAID") r.paid += o.totalPaise;
      else r.open += o.totalPaise;
    }
    byDay.set(key, r);
  }

  const days: DayStat[] = Array.from({ length: dayCount }, (_, idx) => {
    const i = dayCount - 1 - idx; // days ago
    const d = daysAgo(i, today);
    const key = istDayKey(d);
    const f = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-IN", { ...o, timeZone: "Asia/Kolkata" });
    return {
      key,
      label: i === 0 ? "Today" : i === 1 ? "Yesterday" : f({ weekday: "short", day: "numeric", month: "short" }),
      short: `${f({ weekday: "short" })} ${f({ day: "numeric" })}`,
      dm: f({ day: "numeric", month: "short" }),
      isToday: i === 0,
      ...(byDay.get(key) ?? blank()),
    };
  });

  const total = days.reduce(
    (t, d) => ({
      orders: t.orders + d.orders,
      delivered: t.delivered + d.delivered,
      cancelled: t.cancelled + d.cancelled,
      paid: t.paid + d.paid,
      open: t.open + d.open,
    }),
    blank(),
  );
  return { range, days, total };
}

export type DailyStats = Awaited<ReturnType<typeof getDailyStats>>;
