// Photos. Unsplash ones are hot-linked (free licence); the three in /public/photos come from
// Wikimedia Commons (CC BY-SA) and are credited in the footer. Replace any of them with
// your own shop photos whenever you like.
const u = (id: string, w = 1400) =>
  `https://images.unsplash.com/${id}?w=${w}&q=75&auto=format&fit=crop`;

export const PHOTOS = {
  hero: u("photo-1610348725531-843dff563e2c"),
  market: u("photo-1488459716781-31db52582fe9"),
  fruits: u("photo-1610832958506-aa56368176cf"),
  veg: u("photo-1518843875459-f738682238a6"),
  mango: u("photo-1601493700631-2b16ec4b4716"),
  bananaChips: "/photos/banana-chips.jpg",
  chakli: "/photos/chakli.jpg",
  pickle: "/photos/pickle.jpg",
};

// A real photo for the products we have one for (matched by name). Anything else uses an icon.
export function productPhoto(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes("banana chips")) return PHOTOS.bananaChips;
  if (n.includes("chakli")) return PHOTOS.chakli;
  if (n.includes("mango") && n.includes("pickle")) return PHOTOS.pickle;
  if (n.includes("pickle")) return null;
  if (n.includes("mango")) return PHOTOS.mango;
  return null;
}

export function categoryPhoto(slug: string): string | null {
  if (slug.includes("fruit")) return PHOTOS.fruits;
  if (slug.includes("veg")) return PHOTOS.veg;
  if (slug.includes("fresh")) return PHOTOS.hero;
  if (slug.includes("snack")) return PHOTOS.bananaChips;
  if (slug.includes("pickle")) return PHOTOS.pickle;
  return null;
}
