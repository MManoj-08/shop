import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy | Kudla Santhe" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-stone-500">
          <Link href="/" className="hover:text-green-700">
            Home
          </Link>{" "}
          › Privacy
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-green-950">Privacy</h1>
        <p className="mt-1 text-sm text-amber-700">
          Draft in plain language. Please have it reviewed before you launch.
        </p>
      </div>

      <section className="space-y-4 rounded-3xl border border-white bg-white/70 p-6 leading-relaxed text-stone-700">
        <p>
          <b className="text-green-950">What we collect.</b> Your mobile number and name to log you in, your
          delivery address and location to check we deliver to you, and what you order.
        </p>
        <p>
          <b className="text-green-950">Location.</b> If you tap &ldquo;Use my current location&rdquo;, your
          browser asks for permission first. We save the exact spot with your delivery address so the rider can
          find your door, and we do not show it on the website. To fill in your address for you, the spot is sent
          to OpenStreetMap&apos;s free address lookup, which does not receive your name or number.
        </p>
        <p>
          <b className="text-green-950">Map.</b> The small map in the footer of our pages is provided by OpenStreetMap,
          so your browser contacts OpenStreetMap to draw it. It does not get your name, number or anything you ordered.
        </p>
        <p>
          <b className="text-green-950">Why.</b> Only to take your order, deliver it, and contact you about it.
        </p>
        <p>
          <b className="text-green-950">What we do not do.</b> We do not sell your details.
        </p>
        <p>
          <b className="text-green-950">Questions or deleting your data.</b> Contact us through the{" "}
          <Link href="/help" className="font-semibold text-green-700 underline">
            Help page
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
