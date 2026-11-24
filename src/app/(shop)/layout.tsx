import Link from "next/link";
import { Suspense } from "react";
import { CartProvider } from "@/components/cart";
import { Header } from "@/components/header";
import { MobileCartBar } from "@/components/mobile-cart-bar";
import { ShopLocation } from "@/components/shop-location";

// Everything customers see: header, page, footer and the phone cart bar.
// The owner dashboard (/admin) has its own separate layout.
export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <CartProvider>
      <Suspense fallback={<div className="h-[68px]" aria-hidden />}>
        <Header />
      </Suspense>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <Suspense
          fallback={
            <div className="grid animate-pulse grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 rounded-3xl bg-white/60" />
              ))}
            </div>
          }
        >
          {children}
        </Suspense>
      </main>

      <footer className="mx-auto mt-16 w-full max-w-7xl px-4 pb-10 sm:px-6">
        <div className="border-t border-green-950/10 pt-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="space-y-6">
              <nav aria-label="Footer" className="flex flex-wrap gap-x-10 gap-y-3 text-[15px] font-medium text-green-950">
                <Link href="/about" className="hover:text-green-700">About us</Link>
                <Link href="/help" className="hover:text-green-700">Contact</Link>
                <Link href="/help#faq" className="hover:text-green-700">FAQ</Link>
                <Link href="/privacy" className="hover:text-green-700">Privacy</Link>
              </nav>
              {process.env.SHOP_PHONE && (
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={`tel:+${process.env.SHOP_PHONE}`}
                    className="rounded-full border border-green-950/20 px-6 py-3 text-sm font-semibold text-green-950 transition hover:border-green-950"
                  >
                    Call us
                  </a>
                  <a
                    href={`https://wa.me/${process.env.SHOP_PHONE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-green-950/20 px-6 py-3 text-sm font-semibold text-green-950 transition hover:border-green-950"
                  >
                    WhatsApp
                  </a>
                </div>
              )}
            </div>
            <ShopLocation />
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-green-950/10 pt-5 text-xs text-green-950/60">
            <p>
              <span className="font-semibold text-green-950">Kudla Santhe, Sanjanagar</span> · Fresh produce &amp; coastal
              snacks, delivered in Bangalore
              {process.env.FSSAI_NO && <> · FSSAI Lic. No: {process.env.FSSAI_NO}</>}
            </p>
            <p>
              Photos: Unsplash, Wikimedia Commons ·{" "}
              <Link href="/credits" className="underline underline-offset-2">
                Photo credits
              </Link>
            </p>
          </div>
        </div>
      </footer>
      <MobileCartBar />
    </CartProvider>
  );
}
