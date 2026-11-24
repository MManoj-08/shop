import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { confirmPayment, markRefunded, rejectPayment, setOrderStatus } from "@/actions/admin";
import { rupees, STATUS_LABEL } from "@/lib/format";
import { requireOwnerPage } from "@/lib/session";
import { expireUnpaidOrders } from "@/lib/payments";
import { isFilterKey, ORDER_FILTERS } from "@/lib/admin";

const TABS = [
  ["all", "All"],
  ["payment", ORDER_FILTERS.payment.label],
  ["waiting", ORDER_FILTERS.waiting.label],
  ["accept", ORDER_FILTERS.accept.label],
  ["active", ORDER_FILTERS.active.label],
  ["delivered", ORDER_FILTERS.delivered.label],
  ["cancelled", ORDER_FILTERS.cancelled.label],
  ["refund", ORDER_FILTERS.refund.label],
] as const;

const NEXT: Record<string, string | null> = {
  PLACED: "ACCEPTED",
  ACCEPTED: "PACKED",
  PACKED: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
  DELIVERED: null,
  CANCELLED: null,
};

// What the button says for each step. A new order stays "Order placed" until you press Accept order.
const ACTION: Record<string, string> = {
  ACCEPTED: "Accept order",
  PACKED: "Mark as packed",
  OUT_FOR_DELIVERY: "Mark as out for delivery",
  DELIVERED: "Mark as delivered",
};

export default async function AdminOrders(props: PageProps<"/admin/orders">) {
  await requireOwnerPage();
  await expireUnpaidOrders();

  const sp = await props.searchParams;
  const filter = isFilterKey(sp.filter) ? sp.filter : "all";
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 60);
  // ?date=2026-11-24 shows the orders placed on that day (India time), linked from the daily tracker
  const dateRaw = typeof sp.date === "string" ? sp.date : "";
  const dayStart = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? new Date(`${dateRaw}T00:00:00+05:30`) : null;
  const date = dayStart && !Number.isNaN(dayStart.getTime()) ? dateRaw : "";
  const where: Prisma.OrderWhereInput = {
    ...(date && dayStart ? { createdAt: { gte: dayStart, lt: new Date(dayStart.getTime() + 86_400_000) } } : {}),
    ...(filter === "all" ? {} : ORDER_FILTERS[filter].where),
    ...(q
      ? {
          // up to 5 digits is an order number; anything longer is a phone number, and text is a name
          OR: /^\d{1,5}$/.test(q)
            ? [{ number: Number(q) }]
            : [
                { user: { phone: { contains: q } } },
                { user: { name: { contains: q, mode: "insensitive" as const } } },
              ],
        }
      : {}),
  };
  // a link to this screen that keeps the current filter, search and day unless told otherwise
  const href = (o: { filter?: string; q?: string; date?: string } = {}) => {
    const p = new URLSearchParams();
    const f = o.filter ?? filter;
    const qq = o.q ?? q;
    const dd = o.date ?? date;
    if (f !== "all") p.set("filter", f);
    if (qq) p.set("q", qq);
    if (dd) p.set("date", dd);
    const s = p.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: true, address: true, slot: true, items: true, payment: true },
  });

  return (
    <div className="space-y-3">
      <h1 className="font-display text-3xl font-medium text-green-950">Orders</h1>
      <nav aria-label="Filter orders" className="flex flex-wrap gap-2">
        {TABS.map(([k, label]) => (
          <Link
            key={k}
            href={href({ filter: k })}
            aria-current={filter === k ? "page" : undefined}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              filter === k ? "border-green-900 bg-green-900 text-white" : "border-green-950/15 bg-white hover:border-green-900"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {date && (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-900">
            Orders placed on{" "}
            {new Date(`${date}T12:00:00+05:30`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
          </span>
          <Link href={href({ date: "" })} className="text-stone-500 underline">
            Show all days
          </Link>
        </p>
      )}
      <form action="/admin/orders" className="flex gap-2">
        {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        {date && <input type="hidden" name="date" value={date} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search order no., name or phone"
          className="w-full max-w-sm rounded-xl border border-green-950/15 bg-white px-4 py-2 outline-none focus:border-green-900"
        />
        <button className="rounded-full border border-green-900 px-5 py-2 text-sm font-semibold text-green-900 transition hover:bg-green-900 hover:text-white">
          Search
        </button>
        {q && (
          <Link href={href({ q: "" })} className="self-center text-sm text-stone-500 underline">
            Clear
          </Link>
        )}
      </form>
      {orders.length === 0 && <p className="text-stone-500">{filter === "all" && !q && !date ? "No orders yet." : "No orders match."}</p>}
      {orders.length === 50 && <p className="text-xs text-stone-500">Showing the latest 50. Use the search to find older ones.</p>}
      {orders.map((o) => {
        const next = NEXT[o.status];
        const pay = o.payment;
        const online = o.paymentMethod === "ONLINE";
        // a UPI order cannot be accepted until the money is confirmed in the shop account
        const unpaid = online && pay?.status !== "PAID";
        const time = (d: Date | null | undefined) =>
          d?.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
        return (
          <div
            key={o.id}
            className={`space-y-2 rounded-2xl border bg-white p-5 text-sm ${o.status === "PLACED" ? "border-amber-400 ring-2 ring-amber-100" : "border-green-950/10"}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-semibold">
                  #{o.number} · {o.user.name ?? "Customer"} ·{" "}
                  <a className="text-green-700 underline" href={`tel:${o.user.phone}`}>
                    {o.user.phone}
                  </a>
                </p>
                <p className="text-stone-500">
                  {o.deliveryDate.toLocaleDateString("en-IN")}, {o.slot.label}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{rupees(o.totalPaise)}</p>
                {o.status === "PLACED" ? (
                  <p className="mt-1 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                    {!online
                      ? "New · waiting for you to accept"
                      : pay?.status === "PAID"
                        ? "Paid · ready to accept"
                        : pay?.utr
                          ? "Check the payment"
                          : "Waiting for payment"}
                  </p>
                ) : o.status === "CANCELLED" ? (
                  <p className="mt-1 inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                    {STATUS_LABEL[o.status]}
                  </p>
                ) : (
                  <p className="mt-1 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-900">
                    {STATUS_LABEL[o.status]}
                  </p>
                )}
              </div>
            </div>
            <p>
              📍 {o.address.line1}
              {o.address.landmark ? `, ${o.address.landmark}` : ""}, {o.address.area} -{" "}
              {o.address.pincode} ·{" "}
              <a
                className="text-green-700 underline"
                target="_blank"
                rel="noreferrer"
                href={`https://www.google.com/maps?q=${o.address.lat},${o.address.lng}`}
              >
                Open in Maps
              </a>
            </p>
            <ul className="list-disc pl-5">
              {o.items.map((i) => (
                <li key={i.id}>
                  {i.nameSnap} × {i.qty}
                </li>
              ))}
            </ul>
            {online && pay && o.status === "PLACED" && pay.status === "PENDING" &&
              (pay.utr ? (
                <div className="space-y-2 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
                  <p className="font-semibold">The customer says they paid {rupees(o.totalPaise)}.</p>
                  <p>
                    UTR: <b className="font-mono text-base tracking-wide">{pay.utr}</b> · payment note: Order {o.number}
                  </p>
                  <p className="text-stone-600">
                    Open your own UPI / bank app and check that {rupees(o.totalPaise)} really arrived with this
                    reference. Do not go by a screenshot.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <form action={confirmPayment}>
                      <input type="hidden" name="id" value={o.id} />
                      <button className="rounded-full bg-green-900 px-5 py-2 font-semibold text-white transition hover:bg-green-700">
                        ✓ Payment received
                      </button>
                    </form>
                    <form action={rejectPayment}>
                      <input type="hidden" name="id" value={o.id} />
                      <button className="rounded-full border border-red-300 px-5 py-2 text-red-700 transition hover:bg-red-50">
                        ✗ Not in my account
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <p className="rounded-xl bg-stone-50 p-3 text-stone-700">
                  ⏳ Waiting for the customer to pay {rupees(o.totalPaise)}. Do not pack yet. The order cancels itself
                  at {time(pay.payBy)} if nothing arrives.
                </p>
              ))}
            {online && pay?.status === "PAID" && o.status !== "CANCELLED" && (
              <p className="font-semibold text-green-700">✓ Paid by UPI · UTR {pay.utr}</p>
            )}
            {o.status === "CANCELLED" && pay?.status === "PAID" && (
              <div className="space-y-2 rounded-xl border-2 border-red-300 bg-red-50 p-4">
                <p className="font-semibold text-red-800">
                  Refund {rupees(o.totalPaise)} to this customer by UPI (their payment: UTR {pay.utr}).
                </p>
                <form action={markRefunded}>
                  <input type="hidden" name="id" value={o.id} />
                  <button className="rounded-full bg-red-700 px-5 py-2 font-semibold text-white transition hover:bg-red-800">
                    I have refunded it
                  </button>
                </form>
              </div>
            )}
            {pay?.status === "REFUNDED" && <p className="font-semibold text-stone-600">Refunded to the customer ✓</p>}
            <div className="flex gap-2">
              {next && !unpaid && (
                <form action={setOrderStatus}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="status" value={next} />
                  <button className="rounded-full bg-green-900 px-5 py-2 font-semibold text-white transition hover:bg-green-700">
                    {ACTION[next] ?? `Mark as ${STATUS_LABEL[next]}`}
                  </button>
                </form>
              )}
              {o.status !== "DELIVERED" && o.status !== "CANCELLED" && (
                <form action={setOrderStatus}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="status" value="CANCELLED" />
                  <button className="rounded-full border border-red-300 px-5 py-2 text-red-700 transition hover:bg-red-50">
                    {o.status === "PLACED" ? "Reject / cancel" : "Cancel"}
                  </button>
                </form>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
