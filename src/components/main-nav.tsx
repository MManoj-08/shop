"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { categoryEmoji } from "@/lib/format";
import type { NavGroup } from "@/lib/nav";

const GROUP_EMOJI: Record<string, string> = {
  "fresh-produce": "🥬",
  "snacks-sweets": "🥜",
};
const emojiFor = (slug: string) => GROUP_EMOJI[slug] ?? categoryEmoji(slug);

// Groups shown directly in the header bar (the rest are under "More")
const PRIMARY = ["fresh-produce", "snacks-sweets", "pickles", "groceries"];

const itemBase =
  "flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 text-[15px] font-medium text-green-950 transition";
const itemIdle = "hover:bg-white/80";
const itemActive = "bg-white font-semibold shadow-sm shadow-green-900/10";

// Header menu. Desktop: links in the middle, groups open a frosted dropdown on hover.
// Phones: a "Menu" button opens a panel. Every item opens its own page.
export function MainNav({ groups, account }: { groups: NavGroup[]; account?: ReactNode }) {
  const pathname = usePathname();
  const activeCat = pathname.startsWith("/category/") ? pathname.split("/")[2] : undefined;

  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLDivElement>(null);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(null), 140);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMobile(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) {
        setOpen(null);
        setMobile(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const close = () => {
    setOpen(null);
    setMobile(false);
  };
  const cls = (on: boolean) => `${itemBase} ${on ? itemActive : itemIdle}`;

  // The header only has room for a few groups; the rest go in the "More" menu
  const primary = groups.filter((g) => PRIMARY.includes(g.slug));
  const more = groups.filter((g) => !PRIMARY.includes(g.slug));
  const moreActive = more.some(
    (g) => activeCat === g.slug || g.children.some((c) => c.slug === activeCat),
  );

  return (
    <div ref={root} className="flex flex-1 items-center justify-end min-[1400px]:justify-center">
      {/* ---------- Desktop ---------- */}
      <nav aria-label="Main" className="hidden items-center gap-1 min-[1400px]:flex">
        <Link href="/shop" onClick={close} className={cls(pathname === "/shop")}>
          All products
        </Link>

        {primary.map((g) => {
          const isActive = activeCat === g.slug || g.children.some((c) => c.slug === activeCat);

          if (g.children.length === 0) {
            return (
              <Link key={g.slug} href={`/category/${g.slug}`} onClick={close} className={cls(isActive)}>
                {g.nameEn}
              </Link>
            );
          }

          const isOpen = open === g.slug;
          return (
            <div
              key={g.slug}
              className="relative"
              onMouseEnter={() => {
                cancelClose();
                setOpen(g.slug);
              }}
              onMouseLeave={scheduleClose}
            >
              <div className={`${itemBase} ${isActive || isOpen ? itemActive : itemIdle} !p-0`}>
                <Link href={`/category/${g.slug}`} onClick={close} className="rounded-l-full py-2 pl-4 pr-1">
                  {g.nameEn}
                </Link>
                <button
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  aria-label={`Open ${g.nameEn} menu`}
                  onClick={() => setOpen(isOpen ? null : g.slug)}
                  className="rounded-r-full py-2 pl-0.5 pr-3"
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {isOpen && (
                <div className="menu-in absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3">
                  <div
                    className={`glass-strong rounded-[1.75rem] p-3 ${g.children.length > 5 ? "w-[38rem]" : "w-[26rem]"}`}
                  >
                    <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-widest text-green-700">
                      {g.nameEn}
                    </p>
                    <ul className={g.children.length > 5 ? "grid grid-cols-2 gap-1" : "space-y-1"}>
                      {g.children.map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={`/category/${c.slug}`}
                            onClick={close}
                            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-green-50 ${activeCat === c.slug ? "bg-green-50" : ""}`}
                          >
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-2xl">
                              {emojiFor(c.slug)}
                            </span>
                            <span className="flex-1">
                              <span className="block font-semibold leading-tight text-green-950">{c.nameEn}</span>
                              {c.nameKn && <span className="text-xs text-stone-500">{c.nameKn}</span>}
                            </span>
                            <span className="rounded-full bg-green-600/10 px-2 py-0.5 text-xs font-semibold text-green-800">
                              {c.count}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/category/${g.slug}`}
                      onClick={close}
                      className="mt-2 flex items-center justify-between rounded-full bg-green-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-900"
                    >
                      View all {g.nameEn.toLowerCase()}
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {more.length > 0 && (
          <div
            className="relative"
            onMouseEnter={() => {
              cancelClose();
              setOpen("__more");
            }}
            onMouseLeave={scheduleClose}
          >
            <button
              aria-haspopup="true"
              aria-expanded={open === "__more"}
              onClick={() => setOpen(open === "__more" ? null : "__more")}
              className={cls(moreActive || open === "__more")}
            >
              More
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                className={`h-4 w-4 transition-transform ${open === "__more" ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {open === "__more" && (
              <div className="menu-in absolute right-0 top-full z-50 pt-3">
                <div className="glass-strong w-[min(48rem,92vw)] rounded-[1.75rem] p-5">
                  <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                    {more.map((g) => (
                      <div key={g.slug}>
                        <Link
                          href={`/category/${g.slug}`}
                          onClick={close}
                          className="flex items-center gap-2 font-display text-[15px] font-bold text-green-950 hover:text-green-700"
                        >
                          <span className="text-xl">{emojiFor(g.slug)}</span>
                          {g.nameEn}
                          <span className="ml-auto rounded-full bg-green-600/10 px-2 py-0.5 text-xs font-semibold text-green-800">
                            {g.count}
                          </span>
                        </Link>
                        {g.children.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5 border-l border-green-950/10 pl-3">
                            {g.children.slice(0, 6).map((c) => (
                              <li key={c.slug}>
                                <Link
                                  href={`/category/${c.slug}`}
                                  onClick={close}
                                  className="block rounded-lg px-2 py-1 text-sm text-stone-700 transition hover:bg-green-50 hover:text-green-800"
                                >
                                  {c.nameEn}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-green-950/10 pt-4 text-sm font-semibold">
                    <Link href="/shop" onClick={close} className="rounded-full bg-green-950 px-5 py-2 text-white hover:bg-green-900">
                      All products →
                    </Link>
                    <Link href="/about" onClick={close} className="rounded-full border border-green-950/15 px-5 py-2 text-green-950 hover:bg-white">
                      About
                    </Link>
                    <Link href="/help" onClick={close} className="rounded-full border border-green-950/15 px-5 py-2 text-green-950 hover:bg-white">
                      Help
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ---------- Phones ---------- */}
      <div className="min-[1400px]:hidden">
        <button
          onClick={() => setMobile((v) => !v)}
          aria-expanded={mobile}
          aria-label="Open menu"
          className="flex h-11 items-center gap-2 rounded-full border border-green-950/15 bg-white/60 px-3.5 text-sm font-semibold text-green-950"
        >
          <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            {mobile ? (
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            ) : (
              <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
            )}
          </svg>
          <span className="hidden min-[400px]:inline">Menu</span>
        </button>

        {mobile && (
          <div className="menu-in absolute inset-x-0 top-full z-50 pt-3">
            <div className="glass-strong max-h-[70vh] overflow-y-auto rounded-[1.75rem] p-3">
              {[
                ["Home", "/"],
                ["All products", "/shop"],
              ].map(([label, href]) => (
                <Link key={href} href={href} onClick={close} className="block rounded-2xl px-4 py-3 font-semibold text-green-950 hover:bg-green-50">
                  {label}
                </Link>
              ))}
              {groups.map((g) =>
                g.children.length === 0 ? (
                  <Link
                    key={g.slug}
                    href={`/category/${g.slug}`}
                    onClick={close}
                    className="block rounded-2xl px-4 py-3 font-semibold text-green-950 hover:bg-green-50"
                  >
                    {g.nameEn}
                  </Link>
                ) : (
                  <details key={g.slug} className="rounded-2xl open:bg-green-50/70">
                    <summary className="flex items-center justify-between px-4 py-3 font-semibold text-green-950">
                      {g.nameEn}
                      <span aria-hidden className="faq-plus text-xl font-light text-green-700 transition">+</span>
                    </summary>
                    <ul className="pb-2 pl-4 pr-2">
                      {g.children.map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={`/category/${c.slug}`}
                            onClick={close}
                            className="flex items-center justify-between rounded-xl px-3 py-2 text-green-950 hover:bg-white"
                          >
                            <span>
                              {emojiFor(c.slug)} {c.nameEn}
                            </span>
                            <span className="text-xs text-stone-500">{c.count}</span>
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link href={`/category/${g.slug}`} onClick={close} className="block rounded-xl px-3 py-2 text-sm font-bold text-green-800">
                          View all →
                        </Link>
                      </li>
                    </ul>
                  </details>
                ),
              )}
              {[
                ["About", "/about"],
                ["Help", "/help"],
              ].map(([label, href]) => (
                <Link key={href} href={href} onClick={close} className="block rounded-2xl px-4 py-3 font-semibold text-green-950 hover:bg-green-50">
                  {label}
                </Link>
              ))}
              {account && (
                <div
                  onClick={(e) => {
                    // close the menu after a link is tapped, but let the Log out button submit first
                    if ((e.target as HTMLElement).closest("a")) close();
                  }}
                  className="mt-2 space-y-1 border-t border-green-950/10 pt-2"
                >
                  {account}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
