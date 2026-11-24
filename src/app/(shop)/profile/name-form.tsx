"use client";

import { useActionState } from "react";
import { updateName, type ProfileState } from "@/actions/profile";

export function NameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateName, {});
  return (
    <form action={action} className="space-y-3">
      <label htmlFor="name" className="block text-sm font-medium text-stone-600">
        Your name
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="name"
          name="name"
          defaultValue={name}
          minLength={2}
          maxLength={60}
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
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm font-medium text-green-700">Saved ✓</p>}
    </form>
  );
}
