"use client";

import Link from "next/link";
import { useCart } from "@/components/cart";
import { rupees } from "@/lib/format";

export default function CartPage() {
  const { lines, subtotalPaise, setQty, ready } = useCart();

  if (!ready) return <p className="text-stone-500">Loading cart…</p>;
  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="font-display text-3xl font-medium text-green-950">Your cart is empty</h1>
        <Link href="/shop" className="inline-block rounded-full bg-green-900 px-7 py-3 font-semibold text-white transition hover:bg-green-700">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="font-display text-3xl font-medium text-green-950">Your cart</h1>
      <ul className="divide-y divide-green-950/10 overflow-hidden rounded-2xl border border-green-950/10 bg-white">
        {lines.map((l) => (
          <li key={l.variantId} className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <p className="font-medium">{l.name}</p>
              <p className="text-sm text-stone-500">
                {l.label} · {rupees(l.pricePaise)}
              </p>
            </div>
            <div className="flex items-center rounded-full border border-green-950/15">
              <button
                onClick={() => setQty(l.variantId, l.qty - 1)}
                aria-label="Decrease quantity"
                className="px-3.5 py-1.5"
              >
                −
              </button>
              <span className="w-6 text-center">{l.qty}</span>
              <button
                onClick={() => setQty(l.variantId, l.qty + 1)}
                aria-label="Increase quantity"
                className="px-3.5 py-1.5"
              >
                +
              </button>
            </div>
            <p className="w-16 text-right font-semibold">{rupees(l.pricePaise * l.qty)}</p>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between rounded-2xl border border-green-950/10 bg-white p-5">
        <span className="font-medium">Subtotal</span>
        <span className="font-display text-2xl font-medium text-green-950">{rupees(subtotalPaise)}</span>
      </div>
      <p className="text-sm text-stone-500">Delivery fee is calculated at checkout.</p>
      <Link
        href="/checkout"
        className="block rounded-full bg-green-900 px-4 py-4 text-center text-lg font-semibold text-white transition hover:bg-green-700"
      >
        Proceed to checkout
      </Link>
    </div>
  );
}
