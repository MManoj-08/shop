"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type CartLine = {
  variantId: string;
  qty: number;
  name: string;
  label: string;
  pricePaise: number;
  slug: string;
};

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotalPaise: number;
  add: (line: Omit<CartLine, "qty">) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
  ready: boolean;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setLines(JSON.parse(saved));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, "qty">) => {
    setLines((prev) => {
      const found = prev.find((l) => l.variantId === line.variantId);
      if (found) {
        return prev.map((l) =>
          l.variantId === line.variantId ? { ...l, qty: Math.min(l.qty + 1, 50) } : l,
        );
      }
      return [...prev, { ...line, qty: 1 }];
    });
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.variantId !== variantId)
        : prev.map((l) => (l.variantId === variantId ? { ...l, qty: Math.min(qty, 50) } : l)),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotalPaise: lines.reduce((n, l) => n + l.qty * l.pricePaise, 0),
      add,
      setQty,
      clear,
      ready,
    }),
    [lines, add, setQty, clear, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// true once the page has finished hydrating in the browser (false while rendering on the server)
const noop = () => () => {};
function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

const EMPTY: Pick<CartCtx, "lines" | "count" | "subtotalPaise" | "ready"> = {
  lines: [],
  count: 0,
  subtotalPaise: 0,
  ready: false,
};

export function useCart() {
  const c = useContext(Ctx);
  const hydrated = useHydrated();
  if (!c) throw new Error("useCart must be used inside CartProvider");
  // Until hydration is done, show the same empty cart the server rendered. Otherwise parts of
  // the page that load later would draw the saved cart and not match the server's HTML.
  return hydrated ? c : { ...c, ...EMPTY };
}
