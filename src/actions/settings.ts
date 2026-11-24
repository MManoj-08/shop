"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { slotLabel } from "@/lib/admin";

// Sends the owner back to the settings page with a message to show
function back(kind: "saved" | "error", message: string): never {
  redirect(`/admin/settings?${kind}=${encodeURIComponent(message)}`);
}

const zoneSchema = z.object({
  radiusKm: z.coerce.number({ error: "Enter the delivery distance in km." }).min(0.5, "Distance must be at least 0.5 km.").max(50, "Distance can be 50 km at most."),
  fee: z.coerce.number({ error: "Enter the delivery fee in rupees." }).min(0, "Fee cannot be negative.").max(1000, "Fee can be ₹1000 at most."),
  minOrder: z.coerce.number({ error: "Enter the minimum order in rupees." }).min(0, "Minimum order cannot be negative.").max(100000, "Minimum order is too high."),
});

export async function updateZone(formData: FormData) {
  await requireAdmin();
  const raw = { radiusKm: formData.get("radiusKm"), fee: formData.get("fee"), minOrder: formData.get("minOrder") };
  // a blank box must not count as 0
  if (Object.values(raw).some((v) => String(v ?? "").trim() === "")) {
    back("error", "Please fill in the distance, the delivery fee and the minimum order.");
  }
  const p = zoneSchema.safeParse(raw);
  if (!p.success) back("error", p.error.issues[0]?.message ?? "Please check the numbers.");

  // empty means delivery is never free
  const freeRaw = String(formData.get("freeAbove") ?? "").trim();
  let freeAbovePaise: number | null = null;
  if (freeRaw !== "") {
    const f = Number(freeRaw);
    if (!Number.isFinite(f) || f < 0 || f > 1_000_000) {
      back("error", "Free-delivery amount must be a number of rupees, or empty for no free delivery.");
    }
    freeAbovePaise = Math.round(f * 100);
  }

  const zone = await db.deliveryZone.findFirst();
  if (!zone) back("error", "The delivery area is not set up yet.");
  await db.deliveryZone.update({
    where: { id: zone.id },
    data: {
      radiusKm: p.data.radiusKm,
      feePaise: Math.round(p.data.fee * 100),
      minOrderPaise: Math.round(p.data.minOrder * 100),
      freeAbovePaise,
    },
  });
  revalidatePath("/", "layout");
  back("saved", "Delivery area and charges saved.");
}

const slotSchema = z
  .object({
    start: z.coerce.number().int().min(0).max(23),
    end: z.coerce.number().int().min(1).max(24),
  })
  .refine((s) => s.end > s.start, "The slot must end after it starts.");

export async function addSlot(formData: FormData) {
  await requireAdmin();
  const p = slotSchema.safeParse({ start: formData.get("start"), end: formData.get("end") });
  if (!p.success) back("error", p.error.issues[0]?.message ?? "Choose a start and end time.");
  const { start, end } = p.data;

  const same = await db.deliverySlot.findFirst({ where: { startHour: start, endHour: end } });
  if (same) {
    // the same window already exists: just turn it back on
    if (!same.active) {
      await db.deliverySlot.update({ where: { id: same.id }, data: { active: true } });
      revalidatePath("/", "layout");
      back("saved", `${same.label} is on again.`);
    }
    back("error", `${same.label} already exists.`);
  }
  await db.deliverySlot.create({ data: { label: slotLabel(start, end), startHour: start, endHour: end } });
  revalidatePath("/", "layout");
  back("saved", `Added ${slotLabel(start, end)}.`);
}

// Slots are switched on and off, never edited or deleted: past orders point at their slot,
// so changing one would rewrite when old orders were delivered.
export async function toggleSlot(formData: FormData) {
  await requireAdmin();
  const slot = await db.deliverySlot.findUnique({ where: { id: String(formData.get("id") ?? "") } });
  if (!slot) back("error", "That time slot was not found.");
  if (slot.active && (await db.deliverySlot.count({ where: { active: true } })) <= 1) {
    back("error", "Keep at least one time slot on, or customers cannot place orders.");
  }
  await db.deliverySlot.update({ where: { id: slot.id }, data: { active: !slot.active } });
  revalidatePath("/", "layout");
  back("saved", `${slot.label} is now ${slot.active ? "off" : "on"}.`);
}
