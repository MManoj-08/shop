"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { rupees } from "@/lib/format";
import { useCart } from "./cart";

// A bar fixed to the bottom of the screen on phones once something is in the cart
export function MobileCartBar() {
  const { count, subtotalPaise } = useCart();
  const path = usePathname();
  if (count === 0 || path.startsWith("/cart") || path.startsWith("/checkout") || path.startsWith("/admin")) {
    return null;
  }
  return (
    <>
      <div aria-hidden className="h-24 md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 md:hidden">
        <Link
          href="/cart"
          className="flex items-center justify-between rounded-full bg-green-900 px-6 py-4 text-white shadow-[0_18px_40px_-10px_rgba(11,36,24,0.6)]"
        >
          <span className="text-sm font-medium">
            {count} {count === 1 ? "item" : "items"} · <span className="font-semibold">{rupees(subtotalPaise)}</span>
          </span>
          <span className="flex items-center gap-2 text-sm font-semibold">
            View cart <span aria-hidden>→</span>
          </span>
        </Link>
      </div>
    </>
  );
}
