"use client";

import { useEffect, useRef, useState } from "react";
import { SearchBox } from "./search-box";

// Search icon in the header. Opens a frosted search panel under the header.
export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  return (
    <div ref={root}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Search products"
        aria-expanded={open}
        className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${open ? "border-green-600 bg-green-600 text-white" : "border-green-950/15 bg-white/60 text-green-950 hover:bg-white"}`}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="menu-in absolute inset-x-0 top-full z-50 pt-3">
          <div className="glass-strong mx-auto max-w-2xl rounded-[1.75rem] p-3">
            <SearchBox autoFocus />
            <p className="px-2 pb-1 pt-2 text-xs text-stone-500">
              Try “banana chips”, “tomato” or “mango”. Results appear as you type.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
