"use client";

import { useActionState } from "react";
import { updateEmail, type ProfileState } from "@/actions/profile";

export function EmailForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateEmail, {});
  return (
    <form action={action} className="mt-4 space-y-3">
      <label htmlFor="email" className="block text-sm font-medium text-stone-600">
        Email (for password reset)
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={email}
          placeholder="name@gmail.com"
          maxLength={100}
          required
          className="min-w-0 flex-1 rounded-xl border border-green-950/15 bg-white px-4 py-3 outline-none transition focus:border-green-900 focus:ring-2 focus:ring-green-900/15"
        />
        <button
          disabled={pending}
          className="rounded-full bg-green-900 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {!email && <p className="text-sm text-amber-700">Add your email so you can reset your password if you forget it.</p>}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm font-medium text-green-700">Saved ✓</p>}
    </form>
  );
}
