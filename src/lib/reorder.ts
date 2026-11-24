import { qtyLabel, type UnitName } from "@/lib/format";
import type { ReorderLine } from "@/components/reorder-button";

type Item = {
  variantId: string;
  qty: number;
  variant: {
    unit: string;
    quantity: number;
    pricePaise: number;
    product: { slug: string; nameEn: string; active: boolean; inStock: boolean };
  };
};

// Turns the items of an old order into cart lines at today's prices.
// Items that are no longer sold, or are out of stock, are counted and left out.
export function reorderLines(items: Item[]): { lines: ReorderLine[]; unavailable: number } {
  const lines: ReorderLine[] = [];
  let unavailable = 0;
  for (const i of items) {
    const p = i.variant.product;
    if (!p.active || !p.inStock) {
      unavailable++;
      continue;
    }
    lines.push({
      variantId: i.variantId,
      name: p.nameEn,
      label: qtyLabel(i.variant.unit as UnitName, i.variant.quantity),
      pricePaise: i.variant.pricePaise,
      slug: p.slug,
      qty: i.qty,
    });
  }
  return { lines, unavailable };
}
