import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCustomer } from "@/lib/session";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage() {
  const user = await getCustomer();
  if (!user) redirect("/login?next=/checkout");

  const [slots, zone] = await Promise.all([
    db.deliverySlot.findMany({ where: { active: true }, orderBy: { startHour: "asc" } }),
    db.deliveryZone.findFirst(),
  ]);
  if (!zone) return <p>Delivery is not set up yet.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-medium text-green-950">Checkout</h1>
      <CheckoutForm
        slots={slots.map((s) => ({ id: s.id, label: s.label, endHour: s.endHour }))}
        zone={{
          radiusKm: zone.radiusKm,
          feePaise: zone.feePaise,
          freeAbovePaise: zone.freeAbovePaise,
          minOrderPaise: zone.minOrderPaise,
        }}
      />
    </div>
  );
}
