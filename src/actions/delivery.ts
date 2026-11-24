"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { distanceKm } from "@/lib/geo";

export type DeliveryCheck =
  | { ok: true; km: number; radiusKm: number; within: boolean }
  | { ok: false; error: string };

const schema = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });

export async function checkDelivery(lat: number, lng: number): Promise<DeliveryCheck> {
  const p = schema.safeParse({ lat, lng });
  if (!p.success) return { ok: false, error: "Invalid location" };
  const zone = await db.deliveryZone.findFirst();
  if (!zone) return { ok: false, error: "Delivery is not set up yet" };
  const km = distanceKm(zone.shopLat, zone.shopLng, p.data.lat, p.data.lng);
  return { ok: true, km, radiusKm: zone.radiusKm, within: km <= zone.radiusKm };
}
