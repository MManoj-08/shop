import Link from "next/link";
import { db } from "@/lib/db";
import { getNav } from "@/lib/nav";
import { PAGE_SIZE, PRICES, SORTS } from "@/lib/catalog";
import { ProductCard } from "./product-card";

// The product list used by /shop and by every /category/... page:
// sidebar of categories, sort buttons, product grid and "Show more".
export async function ProductBrowser({
  basePath,
  categoryIds,
  activeSlug,
  q,
  sort,
  limit,
  stock = false,
  price: priceFilter = "",
}: {
  basePath: string; // e.g. "/shop" or "/category/vegetables"
  categoryIds?: string[]; // limit the list to these categories
  activeSlug?: string; // highlight this category in the sidebar
  q: string;
  sort: string;
  limit: number;
  stock?: boolean;
  price?: string;
}) {
  const [nav, matched] = await Promise.all([
    getNav(),
    db.product.findMany({
      where: {
        active: true,
        ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
        ...(q
          ? {
              OR: [
                { nameEn: { contains: q, mode: "insensitive" } },
                { nameKn: { contains: q } },
                // alternate names, e.g. "Laddu" for "Ladoo"
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { category: true, variants: { orderBy: { pricePaise: "asc" } } },
      orderBy: [{ inStock: "desc" }, { nameEn: "asc" }],
    }),
  ]);

  // sort in code (price sort needs the cheapest size of each product)
  const price = (p: (typeof matched)[number]) => p.variants[0]?.pricePaise ?? 0;
  const band = PRICES.find(([k]) => k === priceFilter);
  const sorted = matched.filter(
    (p) =>
      (!stock || p.inStock) && (!band || (price(p) >= band[2] && price(p) < band[3])),
  );
  if (sort === "price-asc") sorted.sort((a, b) => price(a) - price(b));
  else if (sort === "price-desc") sorted.sort((a, b) => price(b) - price(a));
  else if (sort === "name") sorted.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  const shown = sorted.slice(0, limit);
  const allCount = nav.reduce((n, g) => n + g.count, 0);

  const here = (o: { sort?: string; limit?: number; stock?: boolean; price?: string }) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (o.sort && o.sort !== "default") p.set("sort", o.sort);
    if (o.stock) p.set("stock", "1");
    if (o.price) p.set("price", o.price);
    if (o.limit && o.limit > PAGE_SIZE) p.set("limit", String(o.limit));
    const s = p.toString();
    return `${basePath}${s ? `?${s}` : ""}`;
  };
  const sideHref = (path: string) => (q ? `${path}?q=${encodeURIComponent(q)}` : path);

  const chip = (on: boolean) =>
    `rounded-full border px-3.5 py-1.5 font-medium transition ${on ? "border-green-900 bg-green-900 text-white" : "border-green-950/15 bg-white text-stone-700 hover:border-green-900"}`;

  const side = (active: boolean) =>
    `flex items-center justify-between rounded-lg px-2 py-2 font-semibold transition ${active ? "bg-green-900 text-white" : "text-stone-800 hover:bg-green-50"}`;
  const sideCount = (active: boolean) => `text-xs ${active ? "text-green-100" : "text-stone-400"}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
      {/* Sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-green-950/10 bg-white p-4">
          <p className="px-2 pb-2 text-xs font-bold uppercase tracking-widest text-stone-500">Categories</p>
          <ul className="space-y-0.5 text-sm">
            <li>
              <Link href={sideHref("/shop")} className={side(basePath === "/shop")}>
                All products <span className={sideCount(basePath === "/shop")}>{allCount}</span>
              </Link>
            </li>
            {nav.map((g) => (
              <li key={g.slug}>
                <Link href={sideHref(`/category/${g.slug}`)} className={side(activeSlug === g.slug)}>
                  {g.nameEn} <span className={sideCount(activeSlug === g.slug)}>{g.count}</span>
                </Link>
                {g.children.length > 0 && (
                  <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-stone-200 pl-2">
                    {g.children.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={sideHref(`/category/${c.slug}`)}
                          className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition ${activeSlug === c.slug ? "bg-green-100 font-semibold text-green-900" : "text-stone-600 hover:bg-green-50"}`}
                        >
                          {c.nameEn} <span className="text-xs text-stone-400">{c.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-stone-600">
            {q && <span className="font-semibold text-stone-900">Results for “{q}” · </span>}
            {sorted.length} {sorted.length === 1 ? "item" : "items"}
            {q && (
              <>
                {" · "}
                <Link href={basePath} className="font-semibold text-green-700 hover:underline">
                  Clear search
                </Link>
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-stone-500">Sort by</span>
            {SORTS.map(([k, label]) => (
              <Link
                key={k}
                href={here({ sort: k, stock, price: priceFilter })}
                scroll={false}
                className={`rounded-full border px-3.5 py-1.5 font-medium transition ${sort === k ? "border-green-900 bg-green-900 text-white" : "border-green-950/15 bg-white text-stone-700 hover:border-green-900"}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-stone-500">Filter</span>
          <Link
            href={here({ sort, stock: !stock, price: priceFilter })}
            scroll={false}
            className={chip(stock)}
          >
            In stock only
          </Link>
          {PRICES.map(([k, label]) => (
            <Link
              key={k}
              href={here({ sort, stock, price: priceFilter === k ? "" : k })}
              scroll={false}
              className={chip(priceFilter === k)}
            >
              {label}
            </Link>
          ))}
          {(stock || priceFilter) && (
            <Link href={here({ sort })} scroll={false} className="font-semibold text-green-800 hover:underline">
              Clear filters
            </Link>
          )}
        </div>

        {shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-green-950/20 bg-white p-12 text-center text-stone-500">
            <p className="text-4xl">🔎</p>
            <p className="mt-2 font-medium">No items found.</p>
            <p className="text-sm">Try another word, or look in another category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {sorted.length > shown.length && (
          <div className="mt-8 text-center">
            <p className="mb-3 text-sm text-stone-500">
              Showing {shown.length} of {sorted.length}
            </p>
            <Link
              href={here({ sort, limit: limit + PAGE_SIZE, stock, price: priceFilter })}
              scroll={false}
              className="inline-block rounded-full border border-green-950/30 px-8 py-3 font-semibold text-green-950 transition hover:bg-green-900 hover:text-white"
            >
              Show more
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
