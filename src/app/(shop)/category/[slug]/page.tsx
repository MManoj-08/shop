import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { categoryInfo, parseListParams } from "@/lib/catalog";
import { categoryEmoji, categoryTheme } from "@/lib/format";
import { categoryPhoto } from "@/lib/photos";
import { ProductBrowser } from "@/components/product-browser";

export async function generateMetadata(props: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const c = await db.category.findUnique({ where: { slug } });
  return { title: c ? `${c.nameEn} | Kudla Santhe` : "Category | Kudla Santhe" };
}

export default async function CategoryPage(props: PageProps<"/category/[slug]">) {
  const { slug } = await props.params;
  const { q, sort, limit, stock, price } = parseListParams(await props.searchParams);

  const category = await db.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: { where: { active: true } } } } },
      },
    },
  });
  if (!category) notFound();

  const categoryIds = [category.id, ...category.children.map((c) => c.id)];
  const photo = categoryPhoto(slug);
  const theme = categoryTheme(slug);
  const subs = category.children.filter((c) => c._count.products > 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <section
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${photo ? "bg-green-950" : theme.tile}`}
      >
        {photo && (
          <>
            <Image src={photo} alt="" fill priority sizes="1216px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
          </>
        )}
        <div className={`relative px-6 py-10 sm:px-10 sm:py-14 ${photo ? "text-white" : "text-green-950"}`}>
          <p className={`text-sm ${photo ? "text-white/80" : "text-stone-600"}`}>
            <Link href="/" className="hover:underline">
              Home
            </Link>
            {category.parent && (
              <>
                {" › "}
                <Link href={`/category/${category.parent.slug}`} className="hover:underline">
                  {category.parent.nameEn}
                </Link>
              </>
            )}
            {" › "}
            {category.nameEn}
          </p>
          <div className="mt-2 flex items-center gap-3">
            {!photo && <span className="text-5xl">{categoryEmoji(slug)}</span>}
            <div>
              <h1 className="font-display text-3xl font-medium sm:text-4xl">{category.nameEn}</h1>
              {category.nameKn && (
                <p className={photo ? "text-white/80" : "text-stone-600"}>{category.nameKn}</p>
              )}
            </div>
          </div>
          <p className={`mt-3 max-w-xl ${photo ? "text-white/90" : "text-stone-700"}`}>
            {categoryInfo(slug)}
          </p>
        </div>
      </section>

      {/* Sub-category chips */}
      {subs.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          {subs.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-stone-800 transition hover:border-green-600 hover:text-green-800"
            >
              {categoryEmoji(c.slug)} {c.nameEn}{" "}
              <span className="font-normal text-stone-400">{c._count.products}</span>
            </Link>
          ))}
        </div>
      )}

      <ProductBrowser
        basePath={`/category/${slug}`}
        categoryIds={categoryIds}
        activeSlug={slug}
        q={q}
        sort={sort}
        limit={limit}
        stock={stock}
        price={price}
      />
    </div>
  );
}
