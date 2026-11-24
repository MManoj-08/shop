"use client";

import Link from "next/link";
import { useCart } from "./cart";
import { rupees } from "@/lib/format";

export function CartLink() {
  const { count, subtotalPaise, ready } = useCart();
  return (
    <Link
      href="/cart"
      aria-label={`Cart${ready && count ? `, ${count} items, ${rupees(subtotalPaise)}` : ""}`}
      title={ready && count ? `${count} items · ${rupees(subtotalPaise)}` : "Your cart is empty"}
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-green-950/15 bg-white/60 text-green-950 transition hover:bg-white"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="20" r="1.3" fill="currentColor" />
        <circle cx="17" cy="20" r="1.3" fill="currentColor" />
      </svg>
      {ready && count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-950 px-1 text-[11px] font-bold text-white shadow">
          {count}
        </span>
      )}
    </Link>
  );
}
