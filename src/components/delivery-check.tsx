"use client";

import { useState, useTransition } from "react";
import { checkDelivery, type DeliveryCheck } from "@/actions/delivery";

export function DeliveryChecker() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "no" | "info"; text: string } | null>(null);

  function run() {
    if (!navigator.geolocation) {
      setMsg({ tone: "info", text: "Your browser cannot share location." });
      return;
    }
    setMsg({ tone: "info", text: "Finding your location…" });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        start(async () => {
          const r: DeliveryCheck = await checkDelivery(pos.coords.latitude, pos.coords.longitude);
          if (!r.ok) setMsg({ tone: "info", text: r.error });
          else if (r.within)
            setMsg({ tone: "ok", text: "Great news! We deliver to your location 🎉" });
          else
            setMsg({
              tone: "no",
              text: "Sorry, we do not deliver to your location yet, but we are growing soon.",
            });
        }),
      () => setMsg({ tone: "info", text: "Please allow location access and try again." }),
      { timeout: 15000 },
    );
  }

  const tone =
    msg?.tone === "ok"
      ? "bg-green-100 text-green-900"
      : msg?.tone === "no"
        ? "bg-amber-100 text-amber-900"
        : "bg-white text-stone-700 border border-green-950/10";

  return (
    <div className="space-y-2">
      <button
        onClick={run}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-green-950/20 bg-white px-5 py-3 text-sm font-semibold text-green-950 transition hover:border-green-950 disabled:opacity-70"
      >
        📍 {pending ? "Checking…" : "Check if we deliver to you"}
      </button>
      {msg && <p className={`max-w-sm rounded-2xl px-4 py-2.5 text-sm font-medium ${tone}`}>{msg.text}</p>}
    </div>
  );
}
