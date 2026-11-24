"use client";

import { useActionState } from "react";
import { resetPassword, type ResetState } from "@/actions/password";

const initial: ResetState = {};
const input = "w-full rounded-xl border border-green-950/15 bg-white px-4 py-3 outline-none transition focus:border-green-900 focus:ring-2 focus:ring-green-900/15";
const btn = "w-full rounded-full bg-green-900 px-4 py-3.5 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="rp-password" className="mb-1 block text-sm font-medium">
          New password
        </label>
        <input
          id="rp-password"
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
        <label htmlFor="rp-confirm" className="mb-1 block text-sm font-medium">
          Type it again
        </label>
        <input id="rp-confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} className={input} required />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button className={btn} disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
