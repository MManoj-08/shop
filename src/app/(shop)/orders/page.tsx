import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCustomer } from "@/lib/session";
import { rupees, STATUS_LABEL } from "@/lib/format";
import { reorderLines } from "@/lib/reorder";
import { ReorderButton } from "@/components/reorder-button";
import { expireUnpaidOrders } from "@/lib/payments";

export default async function OrdersPage() {
  const user = await getCustomer();
  if (!user) redirect("/login?next=/orders");
  await expireUnpaidOrders();
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { variant: { include: { product: true } } } }, payment: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-medium text-green-950">My orders</h1>
      {orders.length === 0 && <p className="text-stone-500">No orders yet.</p>}
      <ul className="space-y-3">
        {orders.map((o) => {
          const { lines, unavailable } = reorderLines(o.items);
          return (
            <li key={o.id} className="rounded-2xl border border-green-950/10 bg-white p-5">
              <Link href={`/orders/${o.id}`} className="flex items-center justify-between">
                <div>
                  <p className="font-display text-lg font-medium text-green-950">Order #{o.number}</p>
                  <p className="text-sm text-stone-500">{o.createdAt.toLocaleDateString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-950">{rupees(o.totalPaise)}</p>
                  <p className="text-sm text-green-700">
                    {o.status === "PLACED" && o.paymentMethod === "ONLINE" && o.payment?.status === "PENDING"
                      ? o.payment.utr
                        ? "Checking your payment"
                        : "Payment due"
                      : STATUS_LABEL[o.status]}
                  </p>
                </div>
              </Link>
              <div className="mt-4 border-t border-green-950/10 pt-4">
                <ReorderButton lines={lines} unavailable={unavailable} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
