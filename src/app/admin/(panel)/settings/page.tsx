import { db } from "@/lib/db";
import { requireOwnerPage } from "@/lib/session";
import { addSlot, toggleSlot, updateZone } from "@/actions/settings";
import { hourLabel } from "@/lib/admin";

const card = "space-y-4 rounded-2xl border border-green-950/10 bg-white p-5";
const h2 = "font-display text-xl font-medium text-green-950";
const input =
  "w-full rounded-xl border border-green-950/15 bg-white px-4 py-2.5 outline-none transition focus:border-green-900 focus:ring-2 focus:ring-green-900/15";
const btn = "rounded-full bg-green-900 px-6 py-2.5 font-semibold text-white transition hover:bg-green-700";

// paise to a plain rupee number for an input box: 3000 -> "30", 4550 -> "45.5"
const rs = (paise: number) => String(paise / 100);

export default async function AdminSettings(props: PageProps<"/admin/settings">) {
  await requireOwnerPage();
  const sp = await props.searchParams;
  const saved = typeof sp.saved === "string" ? sp.saved.slice(0, 200) : "";
  const error = typeof sp.error === "string" ? sp.error.slice(0, 200) : "";

  const [zone, slots] = await Promise.all([
    db.deliveryZone.findFirst(),
    db.deliverySlot.findMany({ orderBy: [{ startHour: "asc" }, { endHour: "asc" }] }),
  ]);

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-medium text-green-950">Settings</h1>
        <p className="text-stone-500">Where and when you deliver, and what it costs. Changes apply to new orders straight away.</p>
      </div>

      {saved && (
        <p role="status" className="rounded-xl bg-green-100 p-3 text-sm font-medium text-green-900">
          ✓ {saved}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <section className={card}>
        <h2 className={h2}>Delivery area &amp; charges</h2>
        {!zone ? (
          <p className="text-sm text-stone-500">The delivery area is not set up yet. Run the seed to create it.</p>
        ) : (
          <form action={updateZone} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="radiusKm" className="mb-1 block text-sm font-medium">
                  We deliver within (km)
                </label>
                <input id="radiusKm" name="radiusKm" type="number" step="0.5" min="0.5" max="50" defaultValue={zone.radiusKm} className={input} required />
                <p className="mt-1 text-xs text-stone-500">Measured in a straight line from your shop.</p>
              </div>
              <div>
                <label htmlFor="fee" className="mb-1 block text-sm font-medium">
                  Delivery fee (₹)
                </label>
                <input id="fee" name="fee" type="number" step="1" min="0" max="1000" defaultValue={rs(zone.feePaise)} className={input} required />
              </div>
              <div>
                <label htmlFor="freeAbove" className="mb-1 block text-sm font-medium">
                  Free delivery above (₹)
                </label>
                <input
                  id="freeAbove"
                  name="freeAbove"
                  type="number"
                  step="1"
                  min="0"
                  defaultValue={zone.freeAbovePaise == null ? "" : rs(zone.freeAbovePaise)}
                  placeholder="Leave empty for never free"
                  className={input}
                />
              </div>
              <div>
                <label htmlFor="minOrder" className="mb-1 block text-sm font-medium">
                  Minimum order (₹)
                </label>
                <input id="minOrder" name="minOrder" type="number" step="1" min="0" defaultValue={rs(zone.minOrderPaise)} className={input} required />
              </div>
            </div>
            <button className={btn}>Save delivery area</button>
          </form>
        )}
      </section>

      <section className={card}>
        <div>
          <h2 className={h2}>Delivery time slots</h2>
          <p className="text-sm text-stone-500">
            Customers pick one of the slots that are on. To change a slot&apos;s hours, add the new one and turn the old
            one off, so your past orders keep their original times.
          </p>
        </div>
        <ul className="divide-y divide-green-950/10 rounded-xl border border-green-950/10">
          {slots.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="flex items-center gap-3">
                <span className={`font-medium ${s.active ? "" : "text-stone-400 line-through"}`}>{s.label}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.active ? "bg-green-100 text-green-900" : "bg-stone-200 text-stone-600"}`}>
                  {s.active ? "On" : "Off"}
                </span>
              </span>
              <form action={toggleSlot}>
                <input type="hidden" name="id" value={s.id} />
                <button
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                    s.active ? "border-red-300 text-red-700 hover:bg-red-50" : "border-green-900 text-green-900 hover:bg-green-50"
                  }`}
                >
                  {s.active ? "Turn off" : "Turn on"}
                </button>
              </form>
            </li>
          ))}
          {slots.length === 0 && <li className="px-4 py-3 text-sm text-stone-500">No slots yet. Add one below.</li>}
        </ul>

        <form action={addSlot} className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="start" className="mb-1 block text-sm font-medium">
              From
            </label>
            <select id="start" name="start" defaultValue="7" className={input}>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="end" className="mb-1 block text-sm font-medium">
              To
            </label>
            <select id="end" name="end" defaultValue="10" className={input}>
              {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </div>
          <button className={btn}>Add slot</button>
        </form>
      </section>
    </div>
  );
}
