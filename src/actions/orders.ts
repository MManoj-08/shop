"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { distanceKm } from "@/lib/geo";
import { getCurrentUser } from "@/lib/session";
import { payDeadline, upiConfig } from "@/lib/payments";
import { qtyLabel, type UnitName } from "@/lib/format";

const inputSchema = z.object({
  items: z
    .array(z.object({ variantId: z.string(), qty: z.number().int().min(1).max(50) }))
    .min(1)
    .max(60),
  address: z.object({
    line1: z.string().trim().min(3, "Please enter your house / flat number and street (at least 3 characters).").max(200),
    landmark: z.string().trim().max(100).optional(),
    area: z.string().trim().min(2, "Please enter your area or locality.").max(80),
    pincode: z.string().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  slotId: z.string(),
  day: z.enum(["today", "tomorrow"]),
});

export type CheckoutResult =
  | { ok: true; orderId: string; number: number }
  | { ok: false; error: string };

export async function placeOrder(raw: unknown): Promise<CheckoutResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to place an order." };

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid order" };
  }
  const { items, address, slotId, day } = parsed.data;

  // Every order is paid by UPI, so the shop's UPI details must be set up first
  if (!upiConfig()) return { ok: false, error: "Ordering is not open yet. Please try again later." };

  const zone = await db.deliveryZone.findFirst();
  if (!zone) return { ok: false, error: "Delivery is not set up yet." };

  // 1. Delivery radius check (server-side, never trust the browser)
  const km = distanceKm(zone.shopLat, zone.shopLng, address.lat, address.lng);
  if (km > zone.radiusKm) {
    return {
      ok: false,
      error: "Sorry, we do not deliver to your location yet.",
    };
  }

  // 2. Re-price every item from the database
  const merged = new Map<string, number>();
  for (const i of items) merged.set(i.variantId, (merged.get(i.variantId) ?? 0) + i.qty);
  const variants = await db.productVariant.findMany({
    where: { id: { in: [...merged.keys()] } },
    include: { product: true },
  });
  if (variants.length !== merged.size) {
    return { ok: false, error: "Some items are no longer available. Please refresh your cart." };
  }
  const unavailable = variants.find((v) => !v.product.active || !v.product.inStock);
  if (unavailable) {
    return { ok: false, error: `${unavailable.product.nameEn} is out of stock today. Please remove it from your cart.` };
  }
  let subtotal = 0;
  const lines = variants.map((v) => {
    const qty = merged.get(v.id)!;
    subtotal += v.pricePaise * qty;
    return {
      variantId: v.id,
      qty,
      pricePaise: v.pricePaise,
      nameSnap: `${v.product.nameEn} (${qtyLabel(v.unit as UnitName, v.quantity)})`,
    };
  });

  if (subtotal < zone.minOrderPaise) {
    return {
      ok: false,
      error: `Minimum order is ₹${zone.minOrderPaise / 100}. Please add more items.`,
    };
  }
  const fee =
    zone.freeAbovePaise != null && subtotal >= zone.freeAbovePaise ? 0 : zone.feePaise;

  // 3. Slot
  const slot = await db.deliverySlot.findFirst({ where: { id: slotId, active: true } });
  if (!slot) return { ok: false, error: "Please choose a delivery slot." };
  const deliveryDate = new Date();
  if (day === "tomorrow") deliveryDate.setDate(deliveryDate.getDate() + 1);
  else if (new Date().getHours() >= slot.endHour) {
    return { ok: false, error: "That slot has already passed today. Choose another." };
  }

  // 4. Create everything together
  try {
    const order = await db.$transaction(async (tx) => {
      const addr = await tx.address.create({
        data: { ...address, userId: user.id },
      });
      return tx.order.create({
        data: {
          userId: user.id,
          addressId: addr.id,
          slotId: slot.id,
          deliveryDate,
          subtotalPaise: subtotal,
          feePaise: fee,
          totalPaise: subtotal + fee,
          paymentMethod: "ONLINE", // paid by UPI: the customer pays after placing the order
          items: { create: lines },
          payment: { create: { amountPaise: subtotal + fee, payBy: payDeadline() } },
        },
      });
    });
    return { ok: true, orderId: order.id, number: order.number };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not place order" };
  }
}
