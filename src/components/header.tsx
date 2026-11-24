import Link from "next/link";
import { getCustomer } from "@/lib/session";
import { getNav } from "@/lib/nav";
import { logout } from "@/actions/auth";
import { CartLink } from "./cart-link";
import { HeaderSearch } from "./header-search";
import { MainNav } from "./main-nav";

function UserIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`h-5 w-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-900">
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
          <path d="M20 3C10 3 4 8 4 15c0 1.2.2 2.3.6 3.3C6.5 14.6 10 11.7 15 10c-4 2.4-6.7 5.5-8.1 9.6.9.3 2 .4 3.1.4 7 0 10-6.5 10-17z" />
        </svg>
      </span>
      <span className="hidden font-display text-xl font-semibold tracking-tight text-green-950 min-[460px]:inline">
        Mangalore Stores
      </span>
    </Link>
  );
}

export async function Header() {
  const [user, groups] = await Promise.all([getCustomer(), getNav()]);
  const firstName = user?.name?.split(" ")[0];

  return (
    <header className="sticky top-0 z-40">
      <div aria-hidden className="glass-bar absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="relative flex items-center gap-3 sm:gap-4">
          <Logo />
          <MainNav
            groups={groups}
            account={
              user ? (
                <>
                  <Link href="/profile" className="block rounded-2xl px-4 py-3 font-semibold text-green-950 hover:bg-green-50">
                    My profile
                  </Link>
                  <Link href="/orders" className="block rounded-2xl px-4 py-3 font-semibold text-green-950 hover:bg-green-50">
                    My orders
                  </Link>
                  <form action={logout}>
                    <button className="block w-full rounded-2xl px-4 py-3 text-left font-semibold text-red-700 hover:bg-red-50">
                      Log out
                    </button>
                  </form>
                </>
              ) : null
            }
          />

          <div className="flex items-center gap-2">
            <HeaderSearch />
            <CartLink />
            {user ? (
              <>
                  <Link
                    href="/profile"
                    aria-label="My profile"
                    className="flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-green-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 sm:px-5"
                  >
                    <UserIcon className="sm:hidden" />
                    <span className="hidden sm:inline">{firstName ? `Hi, ${firstName}` : "My profile"}</span>
                  </Link>

                <form action={logout} className="hidden sm:block">
                  <button
                    aria-label="Log out"
                    title="Log out"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-green-950/15 bg-white/60 text-green-950 transition hover:bg-white"
                  >
                    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
                    </svg>
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                aria-label="Log in"
                className="flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-green-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 sm:px-5"
              >
                <UserIcon className="sm:hidden" />
                <span className="hidden sm:inline">Log in</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
