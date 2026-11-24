"use client";

import { useState } from "react";
import { useCart } from "./cart";

type Variant = { id: string; label: string; pricePaise: number; priceText: string };

export function ProductBuy({
  name,
  slug,
  variants,
  inStock,
}: {
  name: string;
  slug: string;
  variants: Variant[];
  inStock: boolean;
}) {
  const { add, lines, setQty } = useCart();
  const [selected, setSelected] = useState(variants[0].id);
  const v = variants.find((x) => x.id === selected)!;
  const inCart = lines.find((l) => l.variantId === v.id)?.qty ?? 0;

  return (
    <div className="space-y-2.5">
      {variants.length > 1 ? (
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          aria-label={`Choose size for ${name}`}
          className="w-full rounded-full border border-green-950/10 bg-white px-3.5 py-1.5 text-sm text-stone-600 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
        >
          {variants.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-sm text-stone-500">{v.label}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-xl font-semibold text-green-950">{v.priceText}</p>

        {!inStock ? (
          <span className="rounded-full bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-500">
            Sold out
          </span>
        ) : inCart === 0 ? (
          <button
            onClick={() =>
              add({ variantId: v.id, name, label: v.label, pricePaise: v.pricePaise, slug })
            }
            className="rounded-full bg-green-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700 active:scale-95"
          >
            Add
          </button>
        ) : (
          <div className="flex items-center overflow-hidden rounded-full bg-green-900 text-white">
            <button
              onClick={() => setQty(v.id, inCart - 1)}
              aria-label="Decrease quantity"
              className="px-3 py-1.5 text-lg font-bold transition hover:bg-green-700"
            >
              −
            </button>
            <span className="min-w-6 text-center text-sm font-bold">{inCart}</span>
            <button
              onClick={() => setQty(v.id, inCart + 1)}
              aria-label="Increase quantity"
              className="px-3 py-1.5 text-lg font-bold transition hover:bg-green-700"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
