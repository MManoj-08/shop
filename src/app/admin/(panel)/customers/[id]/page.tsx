import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireOwnerPage } from "@/lib/session";
import { rupees, STATUS_LABEL } from "@/lib/format";
import { fmtDate, fmtDateTime } from "@/lib/admin";

const card = "rounded-2xl border border-green-950/10 bg-white p-5";
const h2 = "font-display text-xl font-medium text-green-950";

export default async function AdminCustomer(props: PageProps<"/admin/customers/[id]">) {
  await requireOwnerPage();
  const { id } = await props.params;

  const user = await db.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true,
      addresses: { orderBy: { id: "desc" } },
      orders: { orderBy: { createdAt: "desc" }, include: { payment: true } },
    },
  });
  if (!user) notFound();

  const paidOrders = user.orders.filter((o) => o.payment?.status === "PAID" && o.status !== "CANCELLED");
  const spent = paidOrders.reduce((a, o) => a + o.totalPaise, 0);
  const neverPaid = user.orders.filter((o) => o.status === "CANCELLED" && o.payment?.status === "FAILED").length;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/customers" className="text-sm font-medium text-stone-500 hover:text-green-900">
          ← All customers
        </Link>
        <h1 className="mt-1 font-display text-3xl font-medium text-green-950">{user.name ?? "No name"}</h1>
        <p className="text-stone-600">
          <a href={`tel:${user.phone}`} className="font-medium text-green-800 underline">
            {user.phone}
          </a>{" "}
          · joined {fmtDate(user.createdAt)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Orders", user.orders.length],
          ["Paid so far", rupees(spent)],
          ["Average paid order", paidOrders.length ? rupees(Math.round(spent / paidOrders.length)) : "—"],
          ["Never paid", neverPaid],
        ].map(([label, value]) => (
          <div key={label as string} className={`rounded-2xl border p-4 ${label === "Never paid" && Number(value) >= 2 ? "border-red-300 bg-red-50" : "border-green-950/10 bg-white"}`}>
            <p className="font-display text-2xl font-medium text-green-950">{value}</p>
            <p className="text-sm text-stone-600">{label}</p>
          </div>
        ))}
      </div>

      <section className={card}>
        <h2 className={`${h2} mb-3`}>Saved addresses</h2>
        {user.addresses.length === 0 ? (
          <p className="text-sm text-stone-500">None yet. An address is saved with each order.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {user.addresses.map((a) => (
              <li key={a.id}>
                📍 {a.line1}
                {a.landmark ? `, ${a.landmark}` : ""}, {a.area} - {a.pincode} ·{" "}
                <a
                  className="text-green-700 underline"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.google.com/maps?q=${a.lat},${a.lng}`}
                >
                  Open in Maps
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <h2 className={`${h2} mb-3`}>Order history</h2>
        {user.orders.length === 0 ? (
          <p className="text-sm text-stone-500">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-green-950/10 text-sm">
            {user.orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span>
                  <Link href={`/admin/orders?q=${o.number}`} className="font-semibold text-green-800 underline">
                    #{o.number}
                  </Link>{" "}
                  · <span className="text-stone-500">{fmtDateTime(o.createdAt)}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-semibold">{rupees(o.totalPaise)}</span>
                  <span className="text-xs text-stone-500">
                    {o.payment?.status === "PAID"
                      ? "Paid"
                      : o.payment?.status === "REFUNDED"
                        ? "Refunded"
                        : o.payment?.status === "FAILED"
                          ? "Not paid"
                          : o.payment?.utr
                            ? "Payment being checked"
                            : "Unpaid"}
                  </span>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-900">{STATUS_LABEL[o.status]}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
