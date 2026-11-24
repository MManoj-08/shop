import type { Metadata } from "next";
import Link from "next/link";
import { DeliveryChecker } from "@/components/delivery-check";

export const metadata: Metadata = { title: "Delivery & help | Kudla Santhe" };

const faqs = [
  { q: "Which areas do you deliver to?", a: "We deliver to selected areas around our shop in Bangalore. Use the button above to check your location in one tap." },
  { q: "How does payment work?", a: "Pay by UPI. After you place your order you will see a QR code with the exact amount. Pay it with any UPI app, then enter the 12-digit UTR (reference number) from your payment. We check our account and then accept your order. Orders that are not paid within 30 minutes are cancelled automatically." },
  { q: "What if a fruit or vegetable is not fresh?", a: "Tell us and we will replace it or refund you. Fresh produce is what we are known for." },
  { q: "Is there a minimum order?", a: "Yes, a small minimum order applies and delivery is free on bigger orders. You will see the exact amounts at checkout." },
  { q: "Are the coastal snacks authentic?", a: "Yes. We stock traditional Mangalore and Udupi favourites like kodubale, chakli, banana chips and pickles from trusted makers." },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm text-stone-500">
          <Link href="/" className="hover:text-green-700">
            Home
          </Link>{" "}
          › Delivery &amp; help
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-green-950">Delivery &amp; help</h1>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="font-display text-xl font-bold text-green-950">Do we deliver to you?</h2>
        <p className="mb-4 mt-1 text-stone-600">Tap the button while you are at your home and we will tell you.</p>
        <DeliveryChecker />
      </section>

      <section id="faq" className="scroll-mt-28">
        <h2 className="mb-3 font-display text-xl font-bold text-green-950">Questions, answered</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="rounded-xl border border-stone-200 bg-white px-5 py-4">
              <summary className="flex items-center justify-between gap-4 font-semibold text-stone-900">
                {f.q}
                <span className="faq-plus text-2xl font-light text-green-700 transition">+</span>
              </summary>
              <p className="mt-3 text-stone-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
