import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCustomer } from "@/lib/session";
import { logout } from "@/actions/auth";
import { rupees } from "@/lib/format";
import { NameForm } from "./name-form";
import { EmailForm } from "./email-form";

export const metadata: Metadata = { title: "My profile | Kudla Santhe" };

export default async function ProfilePage() {
  const user = await getCustomer();
  if (!user) redirect("/login?next=/profile");

  const [addresses, orderCount, spent] = await Promise.all([
    db.address.findMany({ where: { userId: user.id }, orderBy: { id: "desc" } }),
    db.order.count({ where: { userId: user.id } }),
    db.order.aggregate({
      where: { userId: user.id, status: { not: "CANCELLED" } },
      _sum: { totalPaise: true },
    }),
  ]);

  // every order saves its address, so show each place only once (newest first)
  const seen = new Set<string>();
  const places = addresses.filter((a) => {
    const key = `${a.line1}|${a.area}|${a.pincode}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const card = "rounded-2xl border border-green-950/10 bg-white p-6";
  const isAdmin = user.role === "OWNER" || user.role === "STAFF";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-medium text-green-950">My profile</h1>

      <section className={card}>
        <div className="mb-5 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-900 font-display text-2xl text-white">
            {(user.name?.trim()[0] ?? "#").toUpperCase()}
          </span>
          <div>
            <p className="font-display text-xl font-medium text-green-950">{user.name ?? "No name yet"}</p>
            <p className="text-stone-500">+91 {user.phone}</p>
          </div>
          {isAdmin && (
            <span className="ml-auto rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              Shop owner
            </span>
          )}
        </div>
        <NameForm name={user.name ?? ""} />
        {!isAdmin && <EmailForm email={user.email ?? ""} />}
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className={card}>
          <p className="text-sm text-stone-500">Orders</p>
          <p className="font-display text-3xl font-medium text-green-950">{orderCount}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-stone-500">Total spent</p>
          <p className="font-display text-3xl font-medium text-green-950">{rupees(spent._sum.totalPaise ?? 0)}</p>
        </div>
      </section>

      <section className={card}>
        <h2 className="mb-3 font-display text-xl font-medium text-green-950">Delivery addresses</h2>
        {places.length === 0 ? (
          <p className="text-stone-500">No addresses yet. Your address is saved when you place an order.</p>
        ) : (
          <ul className="divide-y divide-green-950/10">
            {places.map((a) => (
              <li key={a.id} className="py-3">
                <p className="font-medium text-green-950">{a.line1}</p>
                <p className="text-sm text-stone-500">
                  {a.landmark ? `${a.landmark}, ` : ""}
                  {a.area} - {a.pincode}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/orders"
          className="rounded-full bg-green-900 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
        >
          My orders
        </Link>
        {isAdmin && (
          <Link
            href="/admin/orders"
            className="rounded-full border border-amber-400 px-6 py-3 font-semibold text-amber-900 transition hover:bg-amber-50"
          >
            Admin dashboard
          </Link>
        )}
        <form action={logout}>
          <button className="rounded-full border border-red-300 px-6 py-3 font-semibold text-red-700 transition hover:bg-red-50">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
