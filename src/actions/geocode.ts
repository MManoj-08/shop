"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/session";

export type AddressGuess =
  | { ok: true; line1: string; area: string; pincode: string }
  | { ok: false; error: string };

const coords = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });

type Nominatim = { address?: Record<string, string> };

// Turns GPS coordinates into a street / area / PIN code guess, using OpenStreetMap's free
// address lookup (Nominatim). The customer can change anything we fill in. It runs on the
// server so the browser is not blocked by CORS, and only for logged-in customers so the
// shop does not become an open proxy for the lookup service.
export async function guessAddress(lat: number, lng: number): Promise<AddressGuess> {
  if (!(await getCurrentUser())) return { ok: false, error: "Please log in first." };
  const p = coords.safeParse({ lat, lng });
  if (!p.success) return { ok: false, error: "Invalid location" };

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.search = new URLSearchParams({
    format: "jsonv2",
    lat: String(p.data.lat),
    lon: String(p.data.lng),
    zoom: "18",
    addressdetails: "1",
    "accept-language": "en",
  }).toString();

  try {
    const res = await fetch(url, {
      // the service asks every app to identify itself
      headers: { "User-Agent": "MangaloreStoresCheckout/1.0" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: "Address lookup is busy right now." };
    const a = ((await res.json()) as Nominatim).address;
    if (!a) return { ok: false, error: "No address found for this spot." };

    const street = [a.house_number, a.road ?? a.pedestrian ?? a.footway ?? a.path].filter(Boolean).join(", ");
    const area =
      a.suburb ?? a.neighbourhood ?? a.residential ?? a.city_district ?? a.quarter ??
      a.village ?? a.town ?? a.city ?? a.county ?? "";
    const pin = (a.postcode ?? "").replace(/\D/g, "");

    return { ok: true, line1: street, area, pincode: pin.length === 6 ? pin : "" };
  } catch {
    return { ok: false, error: "Address lookup is not available right now." };
  }
}
