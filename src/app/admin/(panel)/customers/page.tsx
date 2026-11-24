import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireOwnerPage } from "@/lib/session";
import { rupees } from "@/lib/format";
import { fmtDate, PAID_ORDER } from "@/lib/admin";

export default async function AdminCustomers(props: PageProps<"/admin/customers">) {
  await requireOwnerPage();
  const sp = await props.searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 60);

  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(q ? { OR: [{ phone: { contains: q } }, { name: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [total, users] = await Promise.all([
    db.user.count({ where: { role: "CUSTOMER" } }),
    // never select passwordHash: the owner screens have no use for it
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, name: true, phone: true, createdAt: true },
    }),
  ]);
  const ids = users.map((u) => u.id);

  const [all, paid, unpaid] = await Promise.all([
    db.order.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _count: { _all: true }, _max: { createdAt: true } }),
    db.order.groupBy({ by: ["userId"], where: { userId: { in: ids }, ...PAID_ORDER, status: { not: "CANCELLED" } }, _sum: { totalPaise: true } }),
    // orders that were cancelled without ever being paid: many of these can mean fake orders
    db.order.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, status: "CANCELLED", payment: { is: { status: "FAILED" } } },
      _count: { _all: true },
    }),
  ]);
  const allBy = new Map(all.map((r) => [r.userId, r]));
  const paidBy = new Map(paid.map((r) => [r.userId, r._sum.totalPaise ?? 0]));
  const unpaidBy = new Map(unpaid.map((r) => [r.userId, r._count._all]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-medium text-green-950">Customers</h1>
        <p className="text-stone-500">{total} signed up</p>
      </div>

      <form action="/admin/customers" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name or phone"
          className="w-full max-w-sm rounded-xl border border-green-950/15 bg-white px-4 py-2 outline-none focus:border-green-900"
        />
        <button className="rounded-full border border-green-900 px-5 py-2 text-sm font-semibold text-green-900 transition hover:bg-green-900 hover:text-white">
          Search
        </button>
        {q && (
          <Link href="/admin/customers" className="self-center text-sm text-stone-500 underline">
            Clear
          </Link>
        )}
      </form>

      {users.length === 0 ? (
        <p className="text-stone-500">{q ? "No customers match." : "No customers yet."}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-green-950/10 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-green-950/10 bg-green-50/60 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Orders</th>
                <th className="px-4 py-3 font-semibold">Paid so far</th>
                <th className="px-4 py-3 font-semibold">Never paid</th>
                <th className="px-4 py-3 font-semibold">Last order</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-950/10">
              {users.map((u) => {
                const stats = allBy.get(u.id);
                const never = unpaidBy.get(u.id) ?? 0;
                return (
                  <tr key={u.id} className="hover:bg-green-50/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${u.id}`} className="font-semibold text-green-900 underline">
                        {u.name ?? "No name"}
                      </Link>
                      <div className="text-stone-500">{u.phone}</div>
                    </td>
                    <td className="px-4 py-3">{stats?._count._all ?? 0}</td>
                    <td className="px-4 py-3 font-medium">{rupees(paidBy.get(u.id) ?? 0)}</td>
                    <td className="px-4 py-3">
                      {never > 0 ? (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${never >= 2 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}>
                          {never}
                        </span>
                      ) : (
                        <span className="text-stone-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{fmtDate(stats?._max.createdAt) || "—"}</td>
                    <td className="px-4 py-3 text-stone-600">{fmtDate(u.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {users.length === 100 && <p className="text-xs text-stone-500">Showing the newest 100. Use the search to find others.</p>}
      <p className="text-xs text-stone-500">
        &ldquo;Never paid&rdquo; counts orders that were cancelled before any payment arrived. A customer with several is
        worth a phone call before you pack.
      </p>
    </div>
  );
}
