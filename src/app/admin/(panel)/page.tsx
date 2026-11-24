import Link from "next/link";
import { db } from "@/lib/db";
import { requireOwnerPage } from "@/lib/session";
import { expireUnpaidOrders } from "@/lib/payments";
import { rupees, STATUS_LABEL } from "@/lib/format";
import { daysAgo, fmtDateTime, istDayKey, istDayStart, ORDER_FILTERS, PAID_ORDER } from "@/lib/admin";
import { getDailyStats, parseRange } from "./daily-stats";
import { DailyTracker } from "./daily-tracker";
import { SalesChart } from "./sales-chart";

const card = "rounded-2xl border border-green-950/10 bg-white p-5";
const h2 = "font-display text-xl font-medium text-green-950";

function Stat({ label, value, sub, href, hot }: { label: string; value: string | number; sub?: string; href?: string; hot?: boolean }) {
  const body = (
    <div
      className={`h-full rounded-2xl border p-4 transition ${
        hot ? "border-amber-400 bg-amber-50 ring-2 ring-amber-100" : "border-green-950/10 bg-white"
      } ${href ? "hover:border-green-900" : ""}`}
    >
      <p className="font-display text-3xl font-medium text-green-950">{value}</p>
      <p className="text-sm font-medium text-stone-700">{label}</p>
      {sub && <p className="text-xs text-stone-500">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function Dashboard(props: PageProps<"/admin">) {
  await requireOwnerPage();
  await expireUnpaidOrders();
  const range = parseRange((await props.searchParams).range);
  const stats = await getDailyStats(range);

  const today = istDayStart();
  const weekStart = daysAgo(6, today);
  const monthStart = daysAgo(29, today);

  const [payment, accept, active, refund, waiting, ordersToday, weekOrders, customers, newToday, soldItems, outCount, outList, recent] =
    await Promise.all([
      db.order.count({ where: ORDER_FILTERS.payment.where }),
      db.order.count({ where: ORDER_FILTERS.accept.where }),
      db.order.count({ where: ORDER_FILTERS.active.where }),
      db.order.count({ where: ORDER_FILTERS.refund.where }),
      db.order.count({ where: ORDER_FILTERS.waiting.where }),
      db.order.count({ where: { createdAt: { gte: today }, status: { not: "CANCELLED" } } }),
      db.order.findMany({
        where: { createdAt: { gte: weekStart }, status: { not: "CANCELLED" }, ...PAID_ORDER },
        select: { createdAt: true, totalPaise: true },
      }),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: today } } }),
      db.orderItem.findMany({
        where: { order: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" }, ...PAID_ORDER } },
        select: { qty: true, pricePaise: true, variant: { select: { product: { select: { id: true, nameEn: true } } } } },
      }),
      db.product.count({ where: { active: true, inStock: false } }),
      db.product.findMany({ where: { active: true, inStock: false }, select: { id: true, nameEn: true }, orderBy: { nameEn: "asc" }, take: 8 }),
      db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: true, payment: true } }),
    ]);

  // sales for each of the last 7 days (paid orders only)
  const byDay = new Map<string, number>();
  for (const o of weekOrders) byDay.set(istDayKey(o.createdAt), (byDay.get(istDayKey(o.createdAt)) ?? 0) + o.totalPaise);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = daysAgo(6 - i, today);
    const key = istDayKey(d);
    return {
      key,
      paise: byDay.get(key) ?? 0,
      label: d.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" }),
      day: d.toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" }),
    };
  });
  const salesToday = byDay.get(istDayKey(today)) ?? 0;
  const salesWeek = days.reduce((a, d) => a + d.paise, 0);

  // best sellers over the last 30 days
  const sold = new Map<string, { name: string; qty: number; paise: number }>();
  for (const i of soldItems) {
    const p = i.variant.product;
    const row = sold.get(p.id) ?? { name: p.nameEn, qty: 0, paise: 0 };
    row.qty += i.qty;
    row.paise += i.qty * i.pricePaise;
    sold.set(p.id, row);
  }
  const best = [...sold.values()].sort((a, b) => b.paise - a.paise).slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium text-green-950">Dashboard</h1>
        <p className="text-stone-500">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" })}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className={h2}>Needs you</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Payments to check" value={payment} sub="Customer sent a UTR" href="/admin/orders?filter=payment" hot={payment > 0} />
          <Stat label="Orders to accept" value={accept} sub="Paid, ready for you" href="/admin/orders?filter=accept" hot={accept > 0} />
          <Stat label="In progress" value={active} sub="Packing or on the way" href="/admin/orders?filter=active" />
          <Stat label="Refunds to send" value={refund} sub="Paid, then cancelled" href="/admin/orders?filter=refund" hot={refund > 0} />
        </div>
        {waiting > 0 && (
          <p className="text-sm text-stone-600">
            ⏳ {waiting} {waiting === 1 ? "order is" : "orders are"} waiting for the customer to pay.{" "}
            <Link href="/admin/orders?filter=waiting" className="font-semibold text-green-800 underline">
              See
            </Link>
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className={h2}>Sales</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Orders today" value={ordersToday} sub="Not counting cancelled" />
          <Stat label="Sales today" value={rupees(salesToday)} sub="Paid orders" />
          <Stat label="Sales, last 7 days" value={rupees(salesWeek)} sub="Paid orders" />
          <Stat label="Customers" value={customers} sub={newToday > 0 ? `${newToday} new today` : "Signed up"} href="/admin/customers" />
        </div>
        <SalesChart days={stats.days} range={range} />
      </section>

      <DailyTracker stats={stats} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={card}>
          <h2 className={`${h2} mb-3`}>Best sellers · last 30 days</h2>
          {best.length === 0 ? (
            <p className="text-sm text-stone-500">No paid orders yet.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {best.map((b, i) => (
                <li key={b.name} className="flex items-baseline justify-between gap-3">
                  <span>
                    <span className="mr-2 text-stone-400">{i + 1}.</span>
                    {b.name}
                  </span>
                  <span className="shrink-0 text-stone-600">
                    {b.qty} sold · <b className="text-green-900">{rupees(b.paise)}</b>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={card}>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className={h2}>Out of stock today</h2>
            <Link href="/admin/products" className="text-sm font-semibold text-green-800 underline">
              Manage stock
            </Link>
          </div>
          {outCount === 0 ? (
            <p className="text-sm text-stone-500">Everything is in stock. 🎉</p>
          ) : (
            <>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {outList.map((p) => (
                  <li key={p.id}>{p.nameEn}</li>
                ))}
              </ul>
              {outCount > outList.length && <p className="mt-2 text-xs text-stone-500">and {outCount - outList.length} more</p>}
            </>
          )}
        </section>
      </div>

      <section className={card}>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className={h2}>Latest orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-green-800 underline">
            All orders
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-stone-500">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-green-950/10 text-sm">
            {recent.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span>
                  <b>#{o.number}</b> · {o.user.name ?? "Customer"} · <span className="text-stone-500">{fmtDateTime(o.createdAt)}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-semibold">{rupees(o.totalPaise)}</span>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-900">
                    {o.status === "PLACED" && o.paymentMethod === "ONLINE" && o.payment?.status === "PENDING"
                      ? o.payment.utr
                        ? "Check payment"
                        : "Awaiting payment"
                      : STATUS_LABEL[o.status]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
