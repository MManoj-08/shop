"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/products", label: "Products & stock" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Owner sections" className="order-last -mx-1 flex min-w-0 basis-full gap-1 overflow-x-auto px-1 sm:order-none sm:flex-1 sm:basis-0">
      {LINKS.map((l) => {
        const active = l.exact ? path === l.href : path === l.href || path.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
              active ? "bg-green-900 text-white" : "text-green-950 hover:bg-green-100"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
