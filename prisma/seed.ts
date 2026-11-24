import "dotenv/config";
import { PrismaClient, type Unit } from "@prisma/client";

const db = new PrismaClient();

type V = [Unit, number, number]; // unit, quantity, price in rupees
type P = { en: string; kn?: string; v: V[] };

const catalogue: Record<string, { en: string; kn: string; items: P[] }> = {
  vegetables: {
    en: "Vegetables",
    kn: "ತರಕಾರಿಗಳು",
    items: [
      { en: "Tomato", kn: "ಟೊಮೆಟೊ", v: [["KG", 0.5, 25], ["KG", 1, 48]] },
      { en: "Onion", kn: "ಈರುಳ್ಳಿ", v: [["KG", 1, 40]] },
      { en: "Brinjal (Udupi Gulla)", kn: "ಗುಳ್ಳ ಬದನೆ", v: [["KG", 0.5, 60], ["KG", 1, 115]] },
      { en: "Ash Gourd", kn: "ಬೂದು ಕುಂಬಳ", v: [["KG", 1, 35]] },
      { en: "Colocasia Leaves (Patrode)", kn: "ಕೆಸುವಿನ ಎಲೆ", v: [["PACK", 1, 40]] },
      { en: "Raw Banana", kn: "ಬಾಳೆಕಾಯಿ", v: [["KG", 1, 45]] },
    ],
  },
  fruits: {
    en: "Fruits",
    kn: "ಹಣ್ಣುಗಳು",
    items: [
      { en: "Banana (Elakki)", kn: "ಏಲಕ್ಕಿ ಬಾಳೆ", v: [["DOZEN", 1, 70]] },
      { en: "Mango (Alphonso)", kn: "ಮಾವಿನಹಣ್ಣು", v: [["KG", 1, 220]] },
      { en: "Pineapple", kn: "ಅನಾನಸ್", v: [["PIECE", 1, 60]] },
      { en: "Papaya", kn: "ಪರಂಗಿ ಹಣ್ಣು", v: [["KG", 1, 45]] },
    ],
  },
  "coastal-snacks": {
    en: "Coastal Snacks",
    kn: "ಕರಾವಳಿ ತಿಂಡಿಗಳು",
    items: [
      { en: "Banana Chips", kn: "ಬಾಳೆಕಾಯಿ ಚಿಪ್ಸ್", v: [["GRAM", 250, 120], ["GRAM", 500, 230]] },
      { en: "Kodubale", kn: "ಕೋಡುಬಳೆ", v: [["GRAM", 200, 90], ["GRAM", 400, 170]] },
      { en: "Mini Masala Chakli", kn: "ಚಕ್ಕುಲಿ", v: [["GRAM", 200, 80]] },
      { en: "Goli Baje Mix", kn: "ಗೋಳಿಬಜೆ ಮಿಕ್ಸ್", v: [["PACK", 1, 70]] },
      { en: "Jackfruit Chips", kn: "ಹಲಸಿನ ಚಿಪ್ಸ್", v: [["GRAM", 250, 140]] },
    ],
  },
  pickles: {
    en: "Pickles & Thokku",
    kn: "ಉಪ್ಪಿನಕಾಯಿ",
    items: [
      { en: "Mango Pickle (Midi)", kn: "ಮಾವಿನ ಮಿಡಿ ಉಪ್ಪಿನಕಾಯಿ", v: [["GRAM", 250, 130]] },
      { en: "Lime Pickle", kn: "ನಿಂಬೆ ಉಪ್ಪಿನಕಾಯಿ", v: [["GRAM", 250, 110]] },
    ],
  },
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Dropdown menu groups: group slug -> its details, and which categories sit inside
const groups: Record<string, { en: string; kn: string; order: number }> = {
  "fresh-produce": { en: "Fresh Produce", kn: "ತಾಜಾ ಉತ್ಪನ್ನಗಳು", order: 0 },
  "snacks-sweets": { en: "Snacks & Sweets", kn: "ತಿಂಡಿ ಮತ್ತು ಸಿಹಿ", order: 1 },
};
const parentOf: Record<string, string> = {
  vegetables: "fresh-produce",
  fruits: "fresh-produce",
  "coastal-snacks": "snacks-sweets",
};

async function main() {
  const groupIds: Record<string, string> = {};
  for (const [slug, g] of Object.entries(groups)) {
    const row = await db.category.upsert({
      where: { slug },
      update: { nameEn: g.en, nameKn: g.kn, sortOrder: g.order },
      create: { slug, nameEn: g.en, nameKn: g.kn, sortOrder: g.order },
    });
    groupIds[slug] = row.id;
  }

  let order = 10;
  for (const [catSlug, c] of Object.entries(catalogue)) {
    const parentId = parentOf[catSlug] ? groupIds[parentOf[catSlug]] : null;
    const cat = await db.category.upsert({
      where: { slug: catSlug },
      update: { nameEn: c.en, nameKn: c.kn, sortOrder: order, parentId },
      create: { slug: catSlug, nameEn: c.en, nameKn: c.kn, sortOrder: order, parentId },
    });
    order++;
    for (const p of c.items) {
      const exists = await db.product.findUnique({ where: { slug: slug(p.en) } });
      if (exists) continue;
      await db.product.create({
        data: {
          slug: slug(p.en),
          nameEn: p.en,
          nameKn: p.kn,
          categoryId: cat.id,
          variants: {
            create: p.v.map(([unit, quantity, price]) => ({
              unit,
              quantity,
              pricePaise: price * 100,
            })),
          },
        },
      });
    }
  }

  if ((await db.deliverySlot.count()) === 0) {
    await db.deliverySlot.createMany({
      data: [
        { label: "7 AM - 10 AM", startHour: 7, endHour: 10 },
        { label: "10 AM - 1 PM", startHour: 10, endHour: 13 },
        { label: "4 PM - 7 PM", startHour: 16, endHour: 19 },
      ],
    });
  }

  if ((await db.deliveryZone.count()) === 0) {
    await db.deliveryZone.create({
      data: {
        name: "Shop - 5 km",
        shopLat: Number(process.env.SHOP_LAT),
        shopLng: Number(process.env.SHOP_LNG),
        radiusKm: 5,
        feePaise: 3000,
        freeAbovePaise: 50000,
        minOrderPaise: 15000,
      },
    });
  }
  console.log("Seeded.");
}

main().finally(() => db.$disconnect());
