"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type Slide = {
  image: string;
  tag: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  position?: string; // object-position for the photo
};

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;
  const go = useCallback((to: number) => setI(((to % n) + n) % n), [n]);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [paused, n]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured offers"
      className="relative h-[360px] overflow-hidden rounded-3xl bg-green-950 shadow-xl shadow-green-950/15 sm:h-[420px] lg:h-[460px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, idx) => {
        const on = idx === i;
        return (
          <div
            key={s.title}
            aria-hidden={!on}
            className={`absolute inset-0 transition-opacity duration-700 ${on ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <Image
              src={s.image}
              alt=""
              fill
              priority={idx === 0}
              sizes="(min-width:1280px) 1216px, 100vw"
              className="object-cover"
              style={{ objectPosition: s.position ?? "center" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/5" />
            <div className="relative flex h-full max-w-2xl flex-col justify-center px-6 sm:pl-20 sm:pr-12">
              {on && (
                <div className="slide-up">
                  <span className="glass-dark inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-200">
                    {s.tag}
                  </span>
                  <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
                    {s.title}
                  </h2>
                  <p className="mt-3 max-w-lg text-base text-white/90 sm:text-lg">{s.text}</p>
                  <Link
                    href={s.href}
                    className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-amber-400 px-7 py-3 font-bold text-green-950 shadow-lg shadow-black/25 transition hover:-translate-y-0.5 hover:bg-amber-300"
                  >
                    {s.cta} <span aria-hidden>→</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <button
        onClick={() => go(i - 1)}
        aria-label="Previous slide"
        className="glass-dark absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white transition hover:bg-white/30 sm:flex"
      >
        ‹
      </button>
      <button
        onClick={() => go(i + 1)}
        aria-label="Next slide"
        className="glass-dark absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white transition hover:bg-white/30 sm:flex"
      >
        ›
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((s, idx) => (
          <button
            key={s.title}
            onClick={() => go(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-amber-400" : "w-2 bg-white/60 hover:bg-white"}`}
          />
        ))}
      </div>
    </section>
  );
}
