// Shared settings for the product list pages (/shop and /category/...)

export const SORTS = [
  ["default", "Popular"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["name", "Name A–Z"],
] as const;

export const PRICES = [
  ["u100", "Under ₹100", 0, 10000],
  ["100-300", "₹100 – ₹300", 10000, 30000],
  ["o300", "Over ₹300", 30000, Infinity],
] as const;

export const PAGE_SIZE = 20;

type SP = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

// Reads ?q=, ?sort= and ?limit= from the address bar
export function parseListParams(sp: SP) {
  const q = (str(sp.q) ?? "").trim();
  const sortParam = str(sp.sort);
  const sort = SORTS.some(([k]) => k === sortParam) ? (sortParam as string) : "default";
  const limit = Math.min(Math.max(Number(str(sp.limit)) || PAGE_SIZE, PAGE_SIZE), 400);
  const stock = str(sp.stock) === "1";
  const priceParam = str(sp.price);
  const price = PRICES.some(([k]) => k === priceParam) ? (priceParam as string) : "";
  return { q, sort, limit, stock, price };
}

// Short intro text shown at the top of each category page
const INFO: Record<string, string> = {
  "fresh-produce": "Hand-picked fruits and vegetables, fresh every morning.",
  vegetables: "Everyday vegetables and coastal favourites like Udupi gulla brinjal, tondekai, raw jackfruit and Mangalore cucumber.",
  fruits: "Seasonal fruits, ripe and ready to eat.",
  "leafy-greens": "Fresh coriander, curry leaves, palak, methi, sabsige and more, sold by the bunch.",
  "snacks-sweets": "Crunchy, spicy and sweet snacks from the Mangalore and Udupi coast.",
  "coastal-snacks": "Banana chips, kodubale, chakli and more, made the coastal way.",
  pickles: "Tangy homestyle pickles and thokku that taste like a coastal kitchen.",
  "masalas-spices": "Masala powders, chutney powders, pastes and spices from the Karnataka coast.",
  groceries: "Rice, oils, jaggery, honey, beverages and everyday pantry items.",
  "papad-sandige": "Crisp papad and sandige to fry up with any meal.",
  "pooja-festival": "Pooja items, sandhyavandana sets and festival essentials.",
  household: "Cookware and handy items for the kitchen.",
  wellness: "Herbal soaps, oils and ayurvedic health products.",
  sweets: "Traditional sweets, made the coastal way.",
  halwa: "Rich, melt-in-the-mouth halwa in many flavours.",
};
export const categoryInfo = (slug: string) =>
  INFO[slug] ?? "Browse everything in this category.";
