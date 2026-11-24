import Link from "next/link";
import type { PaymentStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireOwnerPage } from "@/lib/session";
import { expireUnpaidOrders } from "@/lib/payments";
import { rupees } from "@/lib/format";
import { daysAgo, fmtDateTime, istDayStart, ORDER_FILTERS } from "@/lib/admin";

const TABS: [string, string][] = [
  ["all", "All"],
  ["PAID", "Received"],
  ["PENDING", "Pending"],
  ["FAILED", "Not paid"],
  ["REFUNDED", "Refunded"],
];
const STATUSES = ["PAID", "PENDING", "FAILED", "REFUNDED"] as const;
const isStatus = (v: unknown): v is PaymentStatus => typeof v === "string" && (STATUSES as readonly string[]).includes(v);

export default async function AdminPayments(props: PageProps<"/admin/payments">) {
  await requireOwnerPage();
  await expireUnpaidOrders();

  const sp = await props.searchParams;
  const status = isStatus(sp.status) ? sp.status : "all";
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 40);

  const today = istDayStart();
  const received = (since: Date) =>
    db.payment.aggregate({ _sum: { amountPaise: true }, where: { status: "PAID", paidAt: { gte: since } } });

  const where: Prisma.PaymentWhereInput = {
    ...(status === "all" ? {} : { status }),
    ...(q
      ? {
          // up to 5 digits is an order number; longer is a UTR or a phone number
          OR: /^\d{1,5}$/.test(q)
            ? [{ order: { number: Number(q) } }]
            : [{ utr: { contains: q } }, { order: { user: { phone: { contains: q } } } }],
        }
      : {}),
  };

  const [rToday, rWeek, rMonth, toCheck, refunds, payments] = await Promise.all([
    received(today),
    received(daysAgo(6, today)),
    received(daysAgo(29, today)),
    db.order.count({ where: ORDER_FILTERS.payment.where }),
    db.order.count({ where: ORDER_FILTERS.refund.where }),
    db.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { order: { select: { number: true, status: true, paymentMethod: true, user: { select: { id: true, name: true, phone: true } } } } },
    }),
  ]);

  const href = (s: string) => `/admin/payments${s === "all" ? "" : `?status=${s}`}${q ? `${s === "all" ? "?" : "&"}q=${encodeURIComponent(q)}` : ""}`;
  const label = (p: (typeof payments)[number]) =>
    p.status === "PAID"
      ? ["Received", "bg-green-100 text-green-900"]
      : p.status === "REFUNDED"
        ? ["Refunded", "bg-stone-200 text-stone-700"]
        : p.status === "FAILED"
          ? ["Not paid", "bg-red-100 text-red-800"]
          : p.utr
            ? ["Check it", "bg-amber-100 text-amber-900"]
            : ["Waiting", "bg-amber-50 text-amber-800"];

  const stat = (title: string, paise: number | null) => (
    <div className="rounded-2xl border border-green-950/10 bg-white p-4">
      <p className="font-display text-2xl font-medium text-green-950">{rupees(paise ?? 0)}</p>
      <p className="text-sm text-stone-600">{title}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-medium text-green-950">Payments</h1>
        <p className="text-stone-500">UPI money you have confirmed, and what is still open.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stat("Received today", rToday._sum.amountPaise)}
        {stat("Received, last 7 days", rWeek._sum.amountPaise)}
        {stat("Received, last 30 days", rMonth._sum.amountPaise)}
        <Link
          href="/admin/orders?filter=payment"
          className={`rounded-2xl border p-4 transition hover:border-green-900 ${toCheck > 0 ? "border-amber-400 bg-amber-50 ring-2 ring-amber-100" : "border-green-950/10 bg-white"}`}
        >
          <p className="font-display text-2xl font-medium text-green-950">{toCheck}</p>
          <p className="text-sm text-stone-600">To check in your account</p>
        </Link>
      </div>
      {refunds > 0 && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {refunds} cancelled {refunds === 1 ? "order was" : "orders were"} paid and still need a refund.{" "}
          <Link href="/admin/orders?filter=refund" className="font-semibold underline">
            Open refunds
          </Link>
        </p>
      )}

      <nav aria-label="Filter payments" className="flex flex-wrap gap-2">
        {TABS.map(([k, name]) => (
          <Link
            key={k}
            href={href(k)}
            aria-current={status === k ? "page" : undefined}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              status === k ? "border-green-900 bg-green-900 text-white" : "border-green-950/15 bg-white hover:border-green-900"
            }`}
          >
            {name}
          </Link>
        ))}
      </nav>
      <form action="/admin/payments" className="flex gap-2">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search UTR, order no. or phone"
          className="w-full max-w-sm rounded-xl border border-green-950/15 bg-white px-4 py-2 outline-none focus:border-green-900"
        />
        <button className="rounded-full border border-green-900 px-5 py-2 text-sm font-semibold text-green-900 transition hover:bg-green-900 hover:text-white">
          Search
        </button>
      </form>

      {payments.length === 0 ? (
        <p className="text-stone-500">{status === "all" && !q ? "No payments yet." : "No payments match."}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-green-950/10 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-green-950/10 bg-green-50/60 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">UTR</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-950/10">
              {payments.map((p) => {
                const [text, cls] = label(p);
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-stone-600">{fmtDateTime(p.paidAt ?? p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders?q=${p.order.number}`} className="font-semibold text-green-800 underline">
                        #{p.order.number}
                      </Link>
                      {p.order.paymentMethod === "COD" && <span className="ml-1 text-xs text-stone-500">(cash)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${p.order.user.id}`} className="underline">
                        {p.order.user.name ?? "Customer"}
                      </Link>
                      <div className="text-stone-500">{p.order.user.phone}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">{rupees(p.amountPaise)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.utr ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{text}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {payments.length === 100 && <p className="text-xs text-stone-500">Showing the latest 100. Use the search to find older ones.</p>}
    </div>
  );
}
