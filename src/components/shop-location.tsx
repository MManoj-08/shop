// The "Visit us" card in the footer: the shop's address with a small square map beside it.
// Address and position come from .env (SHOP_ADDRESS, SHOP_LAT, SHOP_LNG).
// The map is OpenStreetMap's free embed (no account or key). It is a still preview: tapping it
// opens the place in Google Maps, so it never traps a finger that is only trying to scroll.
export function ShopLocation() {
  const lat = Number(process.env.SHOP_LAT);
  const lng = Number(process.env.SHOP_LNG);
  const hasMap =
    Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const address = process.env.SHOP_ADDRESS?.trim() || "Sanjanagar, Bangalore";

  // The embed is drawn 2.2 times bigger than the square and centred, so its own zoom buttons and
  // credit text fall outside the visible part. We show the required credit ourselves below.
  const d = 0.0066; // map area drawn around the shop; the visible middle part is about 600 m across
  const embed = hasMap
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`
    : null;
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <section aria-label="Shop address and map" className="flex w-full gap-4 rounded-3xl border border-green-950/10 bg-white p-4 sm:w-auto">
      {embed && (
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-green-950/10 bg-green-50 sm:h-44 sm:w-44">
          <iframe
            src={embed}
            title="Map showing where Kudla Santhe is"
            loading="lazy"
            referrerPolicy="no-referrer"
            tabIndex={-1}
            className="pointer-events-none absolute border-0"
            style={{ width: "220%", height: "220%", left: "-60%", top: "-60%" }}
          />
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open the shop's location in Google Maps"
            className="absolute inset-0 transition hover:bg-green-950/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700"
          />
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-0 left-0 z-10 rounded-tr-lg bg-white/85 px-1.5 py-0.5 text-[9px] text-stone-600 hover:text-green-900"
          >
            © OpenStreetMap
          </a>
        </div>
      )}
      <div className="flex min-w-0 flex-col justify-center gap-1.5 sm:max-w-xs">
        <p className="text-xs font-semibold uppercase tracking-wider text-green-800">Visit us</p>
        <p className="font-display text-lg font-medium leading-snug text-green-950">Kudla Santhe</p>
        <p className="text-sm leading-relaxed text-stone-600">{address}</p>
        {hasMap && (
          <div className="mt-1 flex flex-wrap gap-2">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-green-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-700"
            >
              Get directions
            </a>
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-green-950/20 px-4 py-2 text-xs font-semibold text-green-950 transition hover:border-green-950"
            >
              Open in Maps
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
