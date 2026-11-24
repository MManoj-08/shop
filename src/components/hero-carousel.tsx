"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Slide = { src: string; alt: string; label: string; note: string; bg: string; pos?: string };

export function HeroCarousel({ slides, intervalMs = 4000 }: { slides: Slide[]; intervalMs?: number }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), intervalMs);
    return () => clearInterval(t);
  }, [paused, slides.length, intervalMs]);

  const current = slides[i];

  return (
    <div
      className="relative mx-auto w-full max-w-[520px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-square overflow-hidden rounded-[2rem]" style={{ background: current.bg }}>
        {slides.map((s, n) => (
          <Image
            key={s.src}
            src={s.src}
            alt={s.alt}
            fill
            priority={n === 0}
            sizes="(min-width:1024px) 520px, 90vw"
            className={`object-cover transition-opacity duration-1000 ${n === i ? "opacity-100" : "opacity-0"}`}
            style={{ objectPosition: s.pos ?? "50% 50%" }}
            aria-hidden={n !== i}
          />
        ))}

        <div className="absolute bottom-4 right-4 flex gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur">
          {slides.map((s, n) => (
            <button
              key={s.src}
              onClick={() => setI(n)}
              aria-label={`Show ${s.label}`}
              className={`h-2 rounded-full transition-all ${n === i ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white"}`}
            />
          ))}
        </div>
      </div>

      <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_20px_50px_-15px_rgba(20,36,27,0.35)] sm:-left-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-xl">🛵</span>
        <div key={current.label} className="slide-up">
          <p className="text-sm font-semibold text-green-950">{current.label}</p>
          <p className="text-xs text-stone-500">{current.note}</p>
        </div>
      </div>
    </div>
  );
}
