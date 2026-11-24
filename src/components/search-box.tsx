"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

// Live search for the header. Works from any page: on the home page it updates the list as you
// type; from other pages it takes you to the home page results.
export function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  // Searching always happens on the "All products" page
  const onHome = pathname === "/shop";
  const initial = onHome ? (sp.get("q") ?? "") : "";

  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const first = useRef(true);

  // keep in sync when the URL changes elsewhere (e.g. a category link clears the search)
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setValue(initial);
  }, [initial]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const term = value.trim();
    if (!onHome && !term) return;
    const t = setTimeout(() => {
      const href = term ? `/shop?q=${encodeURIComponent(term)}` : "/shop";
      start(() => {
        if (onHome) router.replace(href, { scroll: false });
        else router.push(href);
      });
    }, 280);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div role="search" className="relative w-full">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        type="search"
        autoComplete="off"
        aria-label="Search products"
        placeholder="Search for kodubale, tomato, mango…"
        className="w-full rounded-full border border-green-950/10 bg-white py-3 pl-11 pr-20 text-sm shadow-inner transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/25"
      />
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2 text-xs">
        {pending && <span className="text-stone-400">…</span>}
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              inputRef.current?.focus();
            }}
            className="rounded-full bg-stone-200 px-2 py-0.5 font-medium text-stone-600 hover:bg-stone-300"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
