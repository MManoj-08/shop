import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { PHOTOS } from "@/lib/photos";
import { HeroCarousel } from "@/components/hero-carousel";
import { DeliveryChecker } from "@/components/delivery-check";

const heroSlides = [
  { src: PHOTOS.bananaChips, alt: "Golden Mangalore banana chips", label: "Banana chips", note: "Crisp, golden, fried in coconut oil", bg: "#e9b94a" },
  { src: PHOTOS.veg, alt: "Fresh tomatoes, radishes, carrots and brinjal", label: "Fresh vegetables", note: "Picked fresh every morning", bg: "#0b0b0b", pos: "42% 50%" },
  { src: PHOTOS.chakli, alt: "Chakli", label: "Chakli", note: "Crunchy spiral snack", bg: "#ecebea" },
  { src: PHOTOS.fruits, alt: "Fresh fruits", label: "Fresh fruits", note: "Seasonal and sweet", bg: "#f2efe8" },
  { src: PHOTOS.pickle, alt: "Mango pickle in clay pots", label: "Mango pickle", note: "Home-style, aged in clay", bg: "#e8e4dc" },
  { src: PHOTOS.mango, alt: "Alphonso mangoes", label: "Alphonso mangoes", note: "In season", bg: "#f2c14e" },
];

const ticker = [
  "Fresh vegetables",
  "Udupi Gulla brinjal",
  "Kodubale",
  "Alphonso mangoes",
  "Banana chips",
  "Colocasia leaves",
  "Mangalore pickles",
  "Jackfruit chips",
  "Elakki bananas",
  "Goli baje mix",
];

const extras = [
  { label: "All products", emoji: ["🛒"], href: "/shop" },
  { label: "Delivery & payment", emoji: ["🛵"], href: "/help" },
  { label: "Our story", emoji: ["🏪"], href: "/about" },
];

function SectionHead({ title, sub, href }: { title: string; sub?: string; href?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl font-medium tracking-tight text-green-950 sm:text-4xl">{title}</h2>
        {sub && <p className="mt-2 text-stone-500">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 text-sm font-semibold text-green-900 underline-offset-4 hover:underline">
          View all →
        </Link>
      )}
    </div>
  );
}

// One well-known item from each group, shown on its card
const FEATURED: Record<string, string> = {
  "snacks-sweets": "A-One Banana Chips",
  pickles: "Kaveri Roasted Lime Pickle",
  "masalas-spices": "Nayaks Chilli Powder",
  groceries: "Rajamudi Rice",
  "papad-sandige": "Chilli Papad",
  "pooja-festival": "Copper Kalash for Pooja & Sandhyavandana",
  household: "Cast Iron Dosa Tawa (9 inch diameter)",
  wellness: "Herbal Kasturi Manjal Soap",
};
const TONES = ["#f3ecd9", "#e4eee4", "#f5e5dd", "#e3ebf1", "#efe8f0", "#f1ead9", "#e5efe9", "#f4e9d8", "#e8efe0"];

function CategoryCard({
  label,
  sub,
  photo,
  href,
  tone,
}: {
  label: string;
  sub?: string | null;
  photo: string | null;
  href: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      style={{ background: tone }}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_rgba(20,36,27,0.5)]"
    >
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="absolute inset-x-6 top-5 h-[calc(100%-5.5rem)] w-[calc(100%-3rem)] object-contain mix-blend-multiply transition duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-medium leading-tight text-green-950">{label}</p>
          {sub && <p className="truncate text-sm text-green-950/60">{sub}</p>}
        </div>
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-950 text-white transition group-hover:translate-x-1"
        >
          →
        </span>
      </div>
    </Link>
  );
}

export default async function Home() {
  const withCard = { category: true, variants: { orderBy: { pricePaise: "asc" as const } } };

  const [categories, featuredRows, fresh, favourites] = await Promise.all([
    // the menu groups (top level) that have something to buy, directly or in a sub-category
    db.category.findMany({
      where: {
        parentId: null,
        OR: [
          { products: { some: { active: true } } },
          { children: { some: { products: { some: { active: true } } } } },
        ],
      },
      orderBy: { sortOrder: "asc" },
    }),
    db.product.findMany({
      where: { nameEn: { in: Object.values(FEATURED) }, imageUrl: { not: null } },
      select: { nameEn: true, imageUrl: true },
    }),
    db.product.findMany({
      where: { active: true, inStock: true, category: { parent: { slug: "fresh-produce" } } },
      include: withCard,
      // the ones with a photo first, then everyday basics before the rest
      orderBy: [{ imageUrl: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }],
      take: 15,
    }),
    db.product.findMany({
      where: {
        active: true,
        inStock: true,
        category: {
          OR: [
            { slug: { in: ["snacks-sweets", "pickles"] } },
            { parent: { slug: { in: ["snacks-sweets", "pickles"] } } },
          ],
        },
      },
      include: withCard,
      // show the ones that have a photo first
      orderBy: [{ imageUrl: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }],
      take: 10,
    }),
  ]);

  const featured = new Map(featuredRows.map((r) => [r.nameEn, r.imageUrl]));

  return (
    <div className="space-y-20">
      {/* ===== HERO ===== */}
      <section className="grid items-center gap-10 pt-2 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-8">
        <div className="slide-up">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            Kudla Santhe · Sanjanagar, Bangalore
          </p>
          <h1 className="mt-5 font-display text-5xl font-medium leading-[1.05] tracking-tight text-green-950 sm:text-6xl lg:text-[4.5rem]">
            Fresh groceries,
            <br />
            delivered to <em className="font-normal text-green-600">your door.</em>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-stone-600">
            Fruits, vegetables and the Mangalore &amp; Udupi snacks you grew up with, picked fresh at our shop
            in Bangalore.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-3 rounded-full bg-green-900 px-8 py-4 text-base font-semibold text-white transition hover:bg-green-700"
            >
              Start shopping
              <span aria-hidden className="transition group-hover:translate-x-1">
                →
              </span>
            </Link>
            <DeliveryChecker />
          </div>
        </div>

        <HeroCarousel slides={heroSlides} />
      </section>

      {/* ===== ENDLESS SCROLLING STRIP (left to right) ===== */}
      <div
        aria-label="Some of what we sell"
        className="marquee overflow-hidden border-y border-green-950/10 py-5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      >
        <div className="marquee-track">
          {[0, 1].map((set) => (
            <ul
              key={set}
              aria-hidden={set === 1}
              className="flex shrink-0 items-center gap-10 pr-10 font-display text-xl italic text-green-900"
            >
              {[...ticker, ...ticker].map((t, i) => (
                <li key={i} className="flex items-center gap-10 whitespace-nowrap">
                  {t}
                  <span aria-hidden className="text-sm not-italic text-gold">
                    ✦
                  </span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* ===== FRESH TODAY ===== */}
      {fresh.length > 0 && (
        <section>
          <SectionHead title="Fresh today" sub="Fruits and vegetables picked for you" href="/category/fresh-produce" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {fresh.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ===== CATEGORY CARDS ===== */}
      <section>
        <SectionHead title="Shop by category" sub="Each card opens its own page" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => (
            <CategoryCard
              key={c.id}
              label={c.nameEn}
              sub={c.nameKn}
              photo={c.slug === "fresh-produce" ? PHOTOS.mango : (featured.get(FEATURED[c.slug]) ?? null)}
              href={`/category/${c.slug}`}
              tone={TONES[i % TONES.length]}
            />
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {extras.map((x) => (
            <Link
              key={x.href}
              href={x.href}
              className="rounded-full border border-green-950/15 px-5 py-2.5 text-sm font-semibold text-green-950 transition hover:bg-green-950 hover:text-white"
            >
              {x.emoji[0]} {x.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ===== A TASTE OF HOME ===== */}
      {favourites.length > 0 && (
        <section>
          <SectionHead
            title="A taste of home"
            sub="Coastal snacks and pickles, hard to find anywhere else in the city"
            href="/category/snacks-sweets"
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {favourites.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
