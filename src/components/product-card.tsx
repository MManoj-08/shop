import Image from "next/image";
import Link from "next/link";
import { categoryTheme, productEmoji, qtyLabel, rupees, type UnitName } from "@/lib/format";
import { productPhoto } from "@/lib/photos";
import { ProductBuy } from "./product-buy";

type Props = {
  product: {
    slug: string;
    nameEn: string;
    nameKn: string | null;
    imageUrl: string | null;
    inStock: boolean;
    category: { slug: string };
    variants: { id: string; unit: string; quantity: number; pricePaise: number }[];
  };
};

export function ProductCard({ product: p }: Props) {
  const theme = categoryTheme(p.category.slug);
  const photo = productPhoto(p.nameEn);
  const variants = p.variants.map((v) => ({
    id: v.id,
    pricePaise: v.pricePaise,
    priceText: rupees(v.pricePaise),
    label: qtyLabel(v.unit as UnitName, v.quantity),
  }));

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-green-950/[0.08] bg-white transition duration-300 hover:border-green-950/20 hover:shadow-[0_18px_40px_-18px_rgba(20,36,27,0.3)]">
      <Link href={`/product/${p.slug}`} className="block">
        <div
          className={`relative flex aspect-square items-center justify-center overflow-hidden bg-[#f4f1ea]`}
        >
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.imageUrl}
              alt={p.nameEn}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-contain p-4 mix-blend-multiply transition duration-500 group-hover:scale-105"
            />
          ) : photo ? (
            <Image
              src={photo}
              alt={p.nameEn}
              fill
              sizes="(min-width:1280px) 20vw, (min-width:768px) 30vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="text-6xl drop-shadow-sm transition duration-300 group-hover:scale-110">
              {productEmoji(p.nameEn, p.category.slug)}
            </span>
          )}
          {theme.tag && (
            <span
              className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-green-900"
            >
              {theme.tag}
            </span>
          )}
          {!p.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/65">
              <span className="rounded-full bg-stone-800 px-3 py-1 text-xs font-semibold text-white">
                Sold out today
              </span>
            </div>
          )}
        </div>
        <div className="px-4 pt-3.5">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-[15px] font-medium leading-snug text-green-950">
            {p.nameEn}
          </h3>
          <p className="h-5 text-xs text-stone-500">{p.nameKn ?? ""}</p>
        </div>
      </Link>
      <div className="mt-auto px-4 pb-4 pt-2">
        <ProductBuy name={p.nameEn} slug={p.slug} variants={variants} inStock={p.inStock} />
      </div>
    </div>
  );
}
