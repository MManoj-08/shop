import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PHOTOS } from "@/lib/photos";

export const metadata: Metadata = { title: "About us | Kudla Santhe" };

const values = [
  { icon: "🌿", t: "Fresh, always", d: "Hand-picked produce that never sits around from yesterday." },
  { icon: "🥜", t: "Authentic coastal taste", d: "Snacks and pickles sourced from trusted makers on the coast." },
  { icon: "🤝", t: "Made right", d: "Not happy with something? We replace it or refund you." },
];

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-stone-500">
          <Link href="/" className="hover:text-green-700">
            Home
          </Link>{" "}
          › About us
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-green-950">About Kudla Santhe</h1>
      </div>

      <section className="grid overflow-hidden rounded-3xl bg-green-900 text-white md:grid-cols-2">
        <div className="relative h-64 md:h-auto md:min-h-[360px]">
          <Image src={PHOTOS.market} alt="Our fruit and vegetable stall" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" priority />
        </div>
        <div className="px-6 py-10 sm:px-10">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Our story</p>
          <h2 className="mt-2 font-display text-3xl font-bold leading-tight">We know exactly what fresh means.</h2>
          <p className="mt-4 leading-relaxed text-green-100/90">
            We started as a small neighbourhood shop in Bangalore, bringing fruits, vegetables and the
            snacks of coastal Karnataka to families who missed the taste of home. Now the same care goes
            into every order that leaves our shop for your door.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-full bg-amber-400 px-6 py-2.5 font-bold text-green-950 transition hover:bg-amber-300"
          >
            Start shopping →
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {values.map((v) => (
          <div key={v.t} className="rounded-2xl border border-stone-200 bg-white p-6">
            <p className="text-3xl">{v.icon}</p>
            <h3 className="mt-2 font-display text-lg font-bold text-green-950">{v.t}</h3>
            <p className="mt-1 text-stone-600">{v.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
