import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const product = await db.product.findUnique({
    where: { slug },
    include: { category: true, variants: { orderBy: { pricePaise: "asc" } } },
  });
  if (!product || !product.active) notFound();

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <ProductCard product={product} />
      {product.description && <p className="text-stone-600">{product.description}</p>}
      <p className="text-sm text-stone-500">Category: {product.category.nameEn}</p>
    </div>
  );
}
