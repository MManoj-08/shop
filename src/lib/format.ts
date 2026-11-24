export type UnitName = "KG" | "GRAM" | "PIECE" | "PACK" | "DOZEN" | "LITRE" | "BUNCH";

export function rupees(paise: number): string {
  const r = paise / 100;
  return "₹" + (Number.isInteger(r) ? r.toString() : r.toFixed(2));
}

export function qtyLabel(unit: UnitName, quantity: number): string {
  switch (unit) {
    case "KG":
      return quantity < 1 ? `${Math.round(quantity * 1000)} g` : `${quantity} kg`;
    case "GRAM":
      return `${quantity} g`;
    case "LITRE":
      return quantity < 1 ? `${Math.round(quantity * 1000)} ml` : `${quantity} L`;
    case "DOZEN":
      return `${quantity} dozen`;
    case "PIECE":
      return quantity === 1 ? "1 pc" : `${quantity} pcs`;
    case "PACK":
      return quantity === 1 ? "1 pack" : `${quantity} packs`;
    case "BUNCH":
      return quantity === 1 ? "1 bunch" : `${quantity} bunches`;
  }
}

export const STATUS_LABEL: Record<string, string> = {
  PLACED: "Order placed",
  ACCEPTED: "Accepted",
  PACKED: "Packed",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// Soft gradient + badge for each category tile (full class names so Tailwind sees them)
export function categoryTheme(slug: string): { tile: string; badge: string; tag: string } {
  const has = (re: RegExp) => re.test(slug);
  if (has(/fruit/))
    return { tile: "from-rose-100 to-orange-100", badge: "bg-rose-100 text-rose-700", tag: "Fresh fruit" };
  if (has(/veg-pickle|pickle|thokku|appe-midi/))
    return { tile: "from-orange-100 to-red-100", badge: "bg-orange-100 text-orange-800", tag: "Homestyle" };
  if (has(/^veg|vegetable/))
    return { tile: "from-lime-100 to-emerald-100", badge: "bg-emerald-100 text-emerald-800", tag: "Farm fresh" };
  if (has(/masala|spice|chutney|bafat|sambar/))
    return { tile: "from-red-100 to-orange-100", badge: "bg-red-100 text-red-800", tag: "Spice shelf" };
  if (has(/halwa|sweet|kuswar|chocolate/))
    return { tile: "from-pink-100 to-amber-100", badge: "bg-pink-100 text-pink-800", tag: "Sweet treat" };
  if (has(/snack|home-made|ready|speciality/))
    return { tile: "from-amber-100 to-yellow-100", badge: "bg-amber-100 text-amber-800", tag: "Coastal special" };
  if (has(/papad|sandige/))
    return { tile: "from-yellow-100 to-lime-100", badge: "bg-yellow-100 text-yellow-800", tag: "Crispy" };
  if (has(/grocer|rice|oil|ghee|jaggery|honey|beverage|baby-food/))
    return { tile: "from-lime-100 to-yellow-100", badge: "bg-lime-100 text-lime-800", tag: "Pantry" };
  if (has(/pooja|sandhya|calendar|festival/))
    return { tile: "from-fuchsia-100 to-orange-100", badge: "bg-fuchsia-100 text-fuchsia-800", tag: "Pooja" };
  if (has(/household|tawa|vessel/))
    return { tile: "from-sky-100 to-cyan-100", badge: "bg-sky-100 text-sky-800", tag: "For the home" };
  if (has(/wellness|soap|pain|hair|health|kashaya|baby-health|ayurved/))
    return { tile: "from-teal-100 to-emerald-100", badge: "bg-teal-100 text-teal-800", tag: "Ayurvedic" };
  return { tile: "from-stone-100 to-stone-200", badge: "bg-stone-100 text-stone-700", tag: "" };
}

// A fitting icon for each product, based on its name (falls back to its category icon)
const EMOJI_RULES: [RegExp, string][] = [
  [/pickle|thokku|achar/i, "🫙"],
  [/soap/i, "🧼"],
  [/ghee/i, "🧈"],
  [/jaggery|honey|bella/i, "🍯"],
  [/coconut oil|oil/i, "🫒"],
  [/chocolate|cocoa|cocoguru/i, "🍫"],
  [/cake|bun|bread|biscuit|cookie/i, "🍰"],
  [/coffee/i, "☕"],
  [/\btea\b|kashaya|health drink|juice|noni|drink/i, "🧃"],
  [/papad|happala|sandige|appala/i, "🍘"],
  [/masala|powder|sambar|rasam|spice|pudi/i, "🧂"],
  [/cashew|peanut|almond|nut|dry fruit/i, "🥜"],
  [/aarti|kapoor|lamp|diya|incense|agarbatti|pooja|puja|sandhyavandana|gopichandana/i, "🪔"],
  [/mallige|flower|garland/i, "🌸"],
  [/calendar|panchanga/i, "📅"],
  [/tawa|pan\b|cooker|kadai|vessel|idli|steamer|mould|mold|utensil/i, "🍳"],
  [/hair/i, "💆"],
  [/pain|balm|ayurved/i, "🌿"],
  [/baby/i, "🍼"],
  [/tomato/i, "🍅"],
  [/onion/i, "🧅"],
  [/brinjal|gulla|eggplant/i, "🍆"],
  [/gourd/i, "🥒"],
  [/chips/i, "🍟"],
  [/leaves|patrode|palak|spinach/i, "🌿"],
  [/banana/i, "🍌"],
  [/mango/i, "🥭"],
  [/pineapple/i, "🍍"],
  [/papaya/i, "🍈"],
  [/jackfruit/i, "🍈"],
  [/lime|lemon/i, "🍋"],
  [/coconut/i, "🥥"],
  [/chakli|murukku|kodubale/i, "🥨"],
  [/baje|bajji|vada/i, "🍘"],
  [/pickle|thokku/i, "🫙"],
  [/rice|akki/i, "🍚"],
  [/halwa|ladoo|laddu|sweet/i, "🍬"],
  [/chilli|chili/i, "🌶️"],
  [/potato/i, "🥔"],
  [/carrot/i, "🥕"],
  [/apple/i, "🍎"],
];
export function productEmoji(name: string, categorySlug: string): string {
  for (const [re, e] of EMOJI_RULES) if (re.test(name)) return e;
  return categoryEmoji(categorySlug);
}

export function categoryEmoji(slug: string): string {
  const has = (re: RegExp) => re.test(slug);
  if (has(/fruit/)) return "🍎";
  if (has(/leafy|greens|herb/)) return "🌿";
  if (has(/pickle|thokku|appe-midi/)) return "🫙";
  if (has(/^veg|vegetable|fresh/)) return "🥬";
  if (has(/masala|spice|chutney|bafat|sambar/)) return "🌶️";
  if (has(/halwa|sweet|kuswar/)) return "🍬";
  if (has(/chocolate/)) return "🍫";
  if (has(/snack|home-made|ready|speciality/)) return "🥜";
  if (has(/papad|sandige/)) return "🍘";
  if (has(/oil|ghee/)) return "🫒";
  if (has(/jaggery|honey/)) return "🍯";
  if (has(/rice|grain/)) return "🍚";
  if (has(/beverage|drink/)) return "🧃";
  if (has(/grocer|baby-food/)) return "🛒";
  if (has(/pooja|sandhya|festival/)) return "🪔";
  if (has(/calendar/)) return "📅";
  if (has(/household|tawa|vessel/)) return "🍳";
  if (has(/soap/)) return "🧼";
  if (has(/wellness|pain|hair|health|kashaya|baby-health|ayurved/)) return "🌿";
  return "🛒";
}
