"use client";

import { useRef } from "react";
import { setStock } from "@/actions/admin";

// Dropdown for the admin product list: pick In stock / Out of stock and it saves straight away
export function StockSelect({ id, inStock }: { id: string; inStock: boolean }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={setStock}>
      <input type="hidden" name="id" value={id} />
      <select
        name="inStock"
        defaultValue={inStock ? "1" : "0"}
        onChange={() => form.current?.requestSubmit()}
        aria-label="Stock status"
        className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold outline-none ${
          inStock
            ? "border-green-200 bg-green-50 text-green-900"
            : "border-red-200 bg-red-50 text-red-800"
        }`}
      >
        <option value="1">In stock</option>
        <option value="0">Out of stock</option>
      </select>
    </form>
  );
}
