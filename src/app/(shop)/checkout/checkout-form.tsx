"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { guessAddress } from "@/actions/geocode";
import { placeOrder } from "@/actions/orders";
import { useCart } from "@/components/cart";
import { rupees } from "@/lib/format";

type Props = {
  slots: { id: string; label: string; endHour: number }[];
  zone: {
    radiusKm: number;
    feePaise: number;
    freeAbovePaise: number | null;
    minOrderPaise: number;
  };
};

const input = "w-full rounded-xl border border-green-950/15 bg-white px-4 py-3 outline-none transition focus:border-green-900 focus:ring-2 focus:ring-green-900/15";
const card = "space-y-3 rounded-2xl border border-green-950/10 bg-white p-5";
const h2 = "font-display text-xl font-medium text-green-950";

export function CheckoutForm({ slots, zone }: Props) {
  const router = useRouter();
  const { lines, subtotalPaise, clear, ready } = useCart();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [geoMsg, setGeoMsg] = useState("");
  const [locating, setLocating] = useState(false);
  // Exact GPS point: sent with the order and saved in the database, never shown on screen
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [addr, setAddr] = useState({ line1: "", landmark: "", area: "", pincode: "" });
  const [day, setDay] = useState<"today" | "tomorrow">("tomorrow");
  const [slotId, setSlotId] = useState(slots[0]?.id ?? "");

  const fee =
    zone.freeAbovePaise != null && subtotalPaise >= zone.freeAbovePaise ? 0 : zone.feePaise;

  function locate() {
    if (!navigator.geolocation) {
      setGeoMsg("Your browser cannot share location. Please type your address below.");
      return;
    }
    setLocating(true);
    setGeoMsg("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setGeoMsg("Location found. Filling in your address…");
        const guess = await guessAddress(lat, lng).catch(() => null);
        if (guess?.ok) {
          // Fill what we found; anything we could not find keeps what the customer typed
          setAddr((a) => ({
            ...a,
            line1: guess.line1 || a.line1,
            area: guess.area || a.area,
            pincode: guess.pincode || a.pincode,
          }));
          setGeoMsg("Location saved ✓ Please check the address below and add your house / flat number.");
        } else {
          setGeoMsg("Location saved ✓ We could not fill in the address, please type it below.");
        }
        setLocating(false);
      },
      () => {
        setLocating(false);
        setGeoMsg("Could not get your location. Please allow location access and try again.");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  const setField = (name: keyof typeof addr) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddr((a) => ({ ...a, [name]: e.target.value }));

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!coords) {
      setError("Please tap “Use my current location” so we can check delivery distance.");
      return;
    }
    start(async () => {
      const res = await placeOrder({
        items: lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
        address: {
          line1: addr.line1,
          landmark: addr.landmark || undefined,
          area: addr.area,
          pincode: addr.pincode,
          lat: coords.lat,
          lng: coords.lng,
        },
        slotId,
        day,
      });
      if (res.ok) {
        clear();
        router.push(`/orders/${res.orderId}`);
      } else {
        setError(res.error);
      }
    });
  }

  if (!ready) return <p className="text-stone-500">Loading…</p>;
  if (lines.length === 0) return <p>Your cart is empty.</p>;

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className={card}>
        <h2 className={h2}>Delivery address</h2>
        <div>
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="rounded-full border border-green-900 px-5 py-2.5 text-sm font-semibold text-green-900 transition hover:bg-green-900 hover:text-white disabled:opacity-60"
          >
            {locating ? "📍 Finding you…" : coords ? "📍 Update my location" : "📍 Use my current location"}
          </button>
          <p role="status" className="mt-2 text-sm text-stone-600">
            {geoMsg || "Tap the button at your delivery address and we will fill in the details for you."}
          </p>
        </div>
        <input
          name="line1"
          value={addr.line1}
          onChange={setField("line1")}
          placeholder="House / flat no., street"
          className={input}
          required
          minLength={3}
        />
        <input
          name="landmark"
          value={addr.landmark}
          onChange={setField("landmark")}
          placeholder="Landmark (optional)"
          className={input}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            name="area"
            value={addr.area}
            onChange={setField("area")}
            placeholder="Area / locality"
            className={input}
            required
            minLength={2}
          />
          <input
            name="pincode"
            value={addr.pincode}
            onChange={setField("pincode")}
            inputMode="numeric"
            maxLength={6}
            placeholder="PIN code"
            className={input}
            required
          />
        </div>
        <p className="text-xs text-stone-500">
          You can change any of these. We use your location only to check that we deliver to you and to find your door.
        </p>
      </section>

      <section className={card}>
        <h2 className={h2}>Delivery time</h2>
        <div className="flex gap-2">
          {(["today", "tomorrow"] as const).map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => setDay(d)}
              className={`rounded-full border px-5 py-2 text-sm font-medium capitalize ${day === d ? "border-green-900 bg-green-900 text-white" : "border-green-950/15 bg-white"}`}
            >
              {d}
            </button>
          ))}
        </div>
        <select value={slotId} onChange={(e) => setSlotId(e.target.value)} className={input}>
          {slots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </section>

      <section className={`${card} !space-y-1.5`}>
        <h2 className={`${h2} mb-2`}>Summary</h2>
        {lines.map((l) => (
          <div key={l.variantId} className="flex justify-between text-sm">
            <span>
              {l.name} ({l.label}) × {l.qty}
            </span>
            <span>{rupees(l.pricePaise * l.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-green-950/10 pt-2 text-sm">
          <span>Subtotal</span>
          <span>{rupees(subtotalPaise)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery</span>
          <span>{fee === 0 ? "Free" : rupees(fee)}</span>
        </div>
        <div className="flex justify-between font-display text-xl font-medium text-green-950">
          <span>Total</span>
          <span>{rupees(subtotalPaise + fee)}</span>
        </div>
        <p className="text-sm text-stone-600">
          Payment: by UPI. After you place the order you will see a QR code to pay. Orders not paid within 30 minutes
          are cancelled.
        </p>
        {subtotalPaise < zone.minOrderPaise && (
          <p className="text-sm text-amber-700">
            Minimum order is {rupees(zone.minOrderPaise)}.
          </p>
        )}
      </section>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        disabled={pending || subtotalPaise < zone.minOrderPaise}
        className="w-full rounded-full bg-green-900 px-4 py-4 text-lg font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {pending ? "Placing order…" : `Place order & pay · ${rupees(subtotalPaise + fee)}`}
      </button>
    </form>
  );
}
