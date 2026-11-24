import type { Metadata } from "next";
import Link from "next/link";
import { parseListParams } from "@/lib/catalog";
import { ProductBrowser } from "@/components/product-browser";

export const metadata: Metadata = { title: "All products | Kudla Santhe" };

export default async function ShopPage(props: PageProps<"/shop">) {
  const { q, sort, limit, stock, price } = parseListParams(await props.searchParams);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-stone-500">
          <Link href="/" className="hover:text-green-700">
            Home
          </Link>{" "}
          › All products
        </p>
        <h1 className="mt-1 font-display text-3xl font-medium text-green-950">All products</h1>
        <p className="mt-1 text-stone-600">Everything we have today, fresh from our shop.</p>
      </div>
      <ProductBrowser basePath="/shop" q={q} sort={sort} limit={limit} stock={stock} price={price} />
    </div>
  );
}
