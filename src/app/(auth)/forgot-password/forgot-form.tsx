"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestReset, type ForgotState } from "@/actions/password";

const initial: ForgotState = {};
const input = "w-full rounded-xl border border-green-950/15 bg-white px-4 py-3 outline-none transition focus:border-green-900 focus:ring-2 focus:ring-green-900/15";
const btn = "w-full rounded-full bg-green-900 px-4 py-3.5 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60";

export function ForgotForm({ shopPhone }: { shopPhone?: string }) {
  const [state, action, pending] = useActionState(requestReset, initial);

  if (state.done) {
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-xl bg-green-100 p-4 text-sm text-green-900">
          <b>Check your email.</b> If this mobile number is registered with an email address, we have sent a link to
          it. The link works for 30 minutes. Look in your spam folder too.
        </p>
        {state.devLink && (
          <p className="break-all rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Development mode, no email is set up yet. Your reset link:{" "}
            <a href={state.devLink} className="font-semibold underline">
              {state.devLink}
            </a>
          </p>
        )}
        <p className="text-sm text-stone-600">
          No email arrived, or you never gave us one?{" "}
          {shopPhone ? (
            <>
              Call the shop on{" "}
              <a href={`tel:+${shopPhone}`} className="font-semibold text-green-800 underline">
                +{shopPhone}
              </a>{" "}
              and we will reset it for you.
            </>
          ) : (
            "Please call the shop and we will reset it for you."
          )}
        </p>
        <Link href="/login" className="block text-center text-sm font-semibold text-green-800 underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="fp-phone" className="mb-1 block text-sm font-medium">
          Mobile number
        </label>
        <input
          id="fp-phone"
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
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button className={btn} disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <Link href="/login" className="block text-center text-sm font-medium text-stone-600 underline">
        Back to log in
      </Link>
    </form>
  );
}
