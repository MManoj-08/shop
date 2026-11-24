"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/actions/auth";

const initial: AuthState = {};
const input = "w-full rounded-xl border border-green-950/15 bg-white px-4 py-3 outline-none transition focus:border-green-900 focus:ring-2 focus:ring-green-900/15";
const btn = "w-full rounded-full bg-green-900 px-4 py-3.5 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60";

function SignInForm({ next, mode }: { next: string; mode: "customer" | "owner" }) {
  const [state, action, pending] = useActionState(signIn, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="mode" value={mode} />
      <div>
        <label htmlFor="si-phone" className="mb-1 block text-sm font-medium">Mobile number</label>
        <input
          id="si-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder="10-digit mobile number"
          defaultValue={state.phone}
          className={input}
          required
        />
      </div>
      <div>
        <label htmlFor="si-password" className="mb-1 block text-sm font-medium">Password</label>
        <input
          id="si-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          className={input}
          required
        />
        {mode === "customer" && (
          <p className="mt-1.5 text-right text-sm">
            <Link href="/forgot-password" className="font-medium text-green-800 underline underline-offset-2">
              Forgot password?
            </Link>
          </p>
        )}
      </div>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button className={btn} disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}

function SignUpForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signUp, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="su-name" className="mb-1 block text-sm font-medium">Your name</label>
        <input id="su-name" name="name" autoComplete="name" defaultValue={state.name} className={input} required />
      </div>
      <div>
        <label htmlFor="su-email" className="mb-1 block text-sm font-medium">Email</label>
        <input
          id="su-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@gmail.com"
          defaultValue={state.email}
          className={input}
          required
        />
        <p className="mt-1 text-xs text-stone-500">Used only to send you a link if you forget your password.</p>
      </div>
      <div>
        <label htmlFor="su-phone" className="mb-1 block text-sm font-medium">Mobile number</label>
        <input
          id="su-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder="10-digit mobile number"
          defaultValue={state.phone}
          className={input}
          required
        />
      </div>
      <div>
        <label htmlFor="su-password" className="mb-1 block text-sm font-medium">Create a password</label>
        <input
          id="su-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder="At least 8 characters"
          className={input}
          required
        />
      </div>
      <div>
        <label htmlFor="su-confirm" className="mb-1 block text-sm font-medium">Confirm password</label>
        <input
          id="su-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          className={input}
          required
        />
      </div>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button className={btn} disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

export function LoginForm({
  next,
  mode = "customer",
  initialTab = "login",
}: {
  next: string;
  mode?: "customer" | "owner";
  initialTab?: "login" | "signup";
}) {
  const [tab, setTab] = useState<"login" | "signup">(mode === "owner" ? "login" : initialTab);

  if (mode === "owner") return <SignInForm next={next} mode="owner" />;

  const tabClass = (active: boolean) =>
    `flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
      active ? "bg-white text-green-950 shadow-sm" : "text-stone-500 hover:text-green-950"
    }`;

  return (
    <div>
      <div role="tablist" className="mb-5 flex rounded-full bg-green-950/5 p-1">
        <button type="button" role="tab" aria-selected={tab === "login"} className={tabClass(tab === "login")} onClick={() => setTab("login")}>
          Log in
        </button>
        <button type="button" role="tab" aria-selected={tab === "signup"} className={tabClass(tab === "signup")} onClick={() => setTab("signup")}>
          Sign up
        </button>
      </div>
      {tab === "login" ? <SignInForm next={next} mode="customer" /> : <SignUpForm next={next} />}
      <div className="mt-6 border-t border-green-950/10 pt-4 text-center">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 rounded-full border border-green-950/20 px-5 py-2.5 text-sm font-semibold text-green-950 transition hover:border-green-900 hover:bg-green-50"
        >
          🔑 Shop owner login
        </Link>
      </div>
    </div>
  );
}
