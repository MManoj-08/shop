import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwner } from "@/lib/session";
import { ownerLogout } from "@/actions/auth";
import { AdminNav } from "@/components/admin-nav";

export const metadata: Metadata = {
  title: "Owner dashboard | Kudla Santhe",
  robots: { index: false, follow: false },
};

// The owner's own screen: separate from the shop, with its own header
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const owner = await getOwner();
  if (!owner) redirect("/admin/login");

  return (
    <>
      <header className="border-b border-green-950/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-900">
              <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                <path d="M20 3C10 3 4 8 4 15c0 1.2.2 2.3.6 3.3C6.5 14.6 10 11.7 15 10c-4 2.4-6.7 5.5-8.1 9.6.9.3 2 .4 3.1.4 7 0 10-6.5 10-17z" />
              </svg>
            </span>
            <span className="font-display text-lg font-semibold text-green-950">Kudla Santhe</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">Owner</span>
          </div>

          <AdminNav />

          <div className="flex items-center gap-3 text-sm">
            <Link href="/" target="_blank" className="font-medium text-stone-500 hover:text-green-900">
              View shop ↗
            </Link>
            <form action={ownerLogout}>
              <button className="rounded-full border border-red-300 px-4 py-2 font-semibold text-red-700 transition hover:bg-red-50">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </>
  );
}
