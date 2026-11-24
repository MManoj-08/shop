"use client";

import { useRouter } from "next/navigation";
import { useCart } from "./cart";

export type ReorderLine = {
  variantId: string;
  name: string;
  label: string;
  pricePaise: number;
  slug: string;
  qty: number;
};

// Puts the items of an earlier order back in the cart (at today's prices) and opens the cart
export function ReorderButton({ lines, unavailable }: { lines: ReorderLine[]; unavailable: number }) {
  const { add, setQty } = useCart();
  const router = useRouter();

  if (lines.length === 0) {
    return <p className="text-sm text-stone-500">These items are not available right now.</p>;
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => {
          for (const { qty, ...line } of lines) {
            add(line);
            setQty(line.variantId, qty);
          }
          router.push("/cart");
        }}
        className="rounded-full bg-green-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
      >
        Order again
      </button>
      {unavailable > 0 && (
        <span className="text-sm text-stone-500">
          {unavailable} {unavailable === 1 ? "item is" : "items are"} not available now and will be left out.
        </span>
      )}
    </div>
  );
}
