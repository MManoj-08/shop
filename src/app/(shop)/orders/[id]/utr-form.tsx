"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { submitUtr, type UtrState } from "@/actions/payment";

const initial: UtrState = {};

export function UtrForm({ orderId, triesLeft }: { orderId: string; triesLeft: number }) {
  const [state, action, pending] = useActionState(submitUtr, initial);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <label htmlFor="utr" className="block text-sm font-semibold">
        After paying, enter the 12-digit UTR / reference number
      </label>
      <input
        id="utr"
        name="utr"
        inputMode="numeric"
        autoComplete="off"
        maxLength={14}
        placeholder="e.g. 412345678901"
        className="w-full rounded-xl border border-green-950/15 bg-white px-4 py-3 outline-none transition focus:border-green-900 focus:ring-2 focus:ring-green-900/15"
        required
      />
      <p className="text-xs text-stone-500">
        You will find it in your payment app, under the payment details (it may be called UPI transaction ID or
        reference no.). {triesLeft < 3 && `You have ${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left.`}
      </p>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-full bg-green-900 px-4 py-3.5 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {pending ? "Sending…" : "I have paid"}
      </button>
    </form>
  );
}

// Reloads the order every few seconds, so the customer sees the shop's confirmation without refreshing
export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
