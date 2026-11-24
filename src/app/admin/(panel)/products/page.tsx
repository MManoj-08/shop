import { db } from "@/lib/db";
import { createProduct, updatePrice, updateSize } from "@/actions/admin";
import { StockSelect } from "@/components/stock-select";
import { qtyLabel, type UnitName } from "@/lib/format";
import { requireOwnerPage } from "@/lib/session";

const input = "rounded-lg border border-stone-300 bg-white px-2 py-1.5";

const STEP = 30;

export default async function AdminProducts(props: PageProps<"/admin/products">) {
  await requireOwnerPage();
  const sp = await props.searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const limit = Math.min(Math.max(Number(typeof sp.limit === "string" ? sp.limit : "") || STEP, STEP), 600);

  const nosize = sp.nosize === "1";
  const where = {
    ...(nosize ? { variants: { some: { unit: "PACK" as const, quantity: 1 } } } : {}),
    ...(q
    ? {
        OR: [
          { nameEn: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
          { category: { nameEn: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : {}),
  };

  const [products, matching, categories] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: [{ category: { sortOrder: "asc" } }, { nameEn: "asc" }],
      include: { category: true, variants: { orderBy: { pricePaise: "asc" } } },
      take: limit,
    }),
    db.product.count({ where }),
    db.category.findMany({ where: { children: { none: {} } }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-medium text-green-950">Products & today&apos;s stock</h1>

      <form action="/admin/products" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products or categories…"
          className={`${input} flex-1`}
        />
        <button className="rounded-lg bg-stone-800 px-4 py-1.5 font-semibold text-white">Search</button>
        {(q || nosize) && (
          <a href="/admin/products" className="rounded-lg border px-4 py-1.5 font-semibold">
            Clear
          </a>
        )}
      </form>
      <p className="text-sm">
        <a
          href={nosize ? "/admin/products" : "/admin/products?nosize=1"}
          className={`rounded-full border px-4 py-1.5 font-semibold ${nosize ? "border-green-900 bg-green-900 text-white" : "border-green-950/20 text-green-950"}`}
        >
          Needs a size (shows “1 pack”)
        </a>
      </p>
      <p className="text-sm text-stone-500">
        {matching} {matching === 1 ? "product" : "products"}
        {q ? ` match “${q}”` : " in total"}
      </p>

      <form action={createProduct} className="grid gap-2 rounded-xl border bg-white p-4 sm:grid-cols-3">
        <h2 className="font-semibold sm:col-span-3">Add a product</h2>
        <input name="nameEn" placeholder="Name (English)" className={input} required />
        <input name="nameKn" placeholder="Name (Kannada)" className={input} />
        <select name="categoryId" className={input} required>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameEn}
            </option>
          ))}
        </select>
        <select name="unit" className={input}>
          {["KG", "GRAM", "PIECE", "PACK", "DOZEN", "LITRE", "BUNCH"].map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
        <input name="quantity" type="number" step="any" placeholder="Quantity (e.g. 0.5 or 250)" className={input} required />
        <input name="price" type="number" step="any" placeholder="Price ₹" className={input} required />
        <input
          name="imageUrl"
          type="url"
          placeholder="Photo link (optional), e.g. https://…"
          className={`${input} sm:col-span-3`}
        />
        <button className="rounded-full bg-green-900 px-3 py-2.5 font-semibold text-white sm:col-span-3">
          Add product
        </button>
      </form>

      <ul className="space-y-2">
        {products.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3">
            <div className="min-w-40 flex-1">
              <p className="font-semibold">{p.nameEn}</p>
              <p className="text-xs text-stone-500">{p.category.nameEn}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.variants.map((v) => (
                <div key={v.id} className="flex flex-wrap items-center gap-2">
                <form action={updateSize} className="flex items-center gap-1 text-sm">
                  <input type="hidden" name="id" value={v.id} />
                  <input
                    name="quantity"
                    type="number"
                    step="any"
                    defaultValue={v.quantity}
                    className={`${input} w-20`}
                    aria-label={`Size of ${p.nameEn}`}
                  />
                  <select name="unit" defaultValue={v.unit} className={input} aria-label="Unit">
                    {["KG", "GRAM", "PIECE", "PACK", "DOZEN", "LITRE", "BUNCH"].map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                  <button className="rounded border px-2 py-1">Save size</button>
                </form>
                <form action={updatePrice} className="flex items-center gap-1 text-sm">
                  <input type="hidden" name="id" value={v.id} />
                  <span className="text-stone-500">{qtyLabel(v.unit as UnitName, v.quantity)} ₹</span>
                  <input
                    name="price"
                    type="number"
                    step="any"
                    defaultValue={v.pricePaise / 100}
                    className={`${input} w-20`}
                    aria-label={`Price for ${p.nameEn} ${qtyLabel(v.unit as UnitName, v.quantity)}`}
                  />
                  <button className="rounded border px-2 py-1">Save</button>
                </form>
                </div>
              ))}
            </div>
            <StockSelect id={p.id} inStock={p.inStock} />
          </li>
        ))}
      </ul>

      {matching > products.length && (
        <div className="text-center">
          <a
            href={`/admin/products?${q ? `q=${encodeURIComponent(q)}&` : ""}limit=${limit + STEP}`}
            className="inline-block rounded-lg border-2 border-green-700 px-6 py-2 font-semibold text-green-800"
          >
            Show more ({products.length} of {matching})
          </a>
        </div>
      )}
    </div>
  );
}
