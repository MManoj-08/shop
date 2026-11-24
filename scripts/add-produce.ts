// Adds the vegetables, leafy greens and fruits listed in data/produce.json to the shop.
// Only adds what is missing, so it is safe to run again. Existing items (and any price
// changes made in the owner screen) are left alone.
//
//   npx tsx scripts/add-produce.ts
import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient, type Unit } from "@prisma/client";

type Item = { slug: string; en: string; kn: string; cat: string; v: [Unit, number, number][] };
type Data = {
  categories: Record<string, { en: string; kn: string; order: number }>;
  items: Item[];
};

const db = new PrismaClient();
const root = join(__dirname, "..");
const data: Data = JSON.parse(readFileSync(join(root, "data/produce.json"), "utf8"));

async function main() {
  const group = await db.category.findUnique({ where: { slug: "fresh-produce" } });
  if (!group) throw new Error('The "fresh-produce" group is missing. Run the seed first.');

  const catIds: Record<string, string> = {};
  for (const [slug, c] of Object.entries(data.categories)) {
    const row = await db.category.upsert({
      where: { slug },
      update: { parentId: group.id },
      create: { slug, nameEn: c.en, nameKn: c.kn, sortOrder: c.order, parentId: group.id },
    });
    catIds[slug] = row.id;
  }

  let added = 0;
  let skipped = 0;
  for (const it of data.items) {
    if (await db.product.findUnique({ where: { slug: it.slug } })) {
      skipped++;
      continue;
    }
    const photo = `/photos/produce/${it.slug}.jpg`;
    await db.product.create({
      data: {
        slug: it.slug,
        nameEn: it.en,
        nameKn: it.kn,
        categoryId: catIds[it.cat],
        imageUrl: existsSync(join(root, "public", photo)) ? photo : null,
        variants: {
          create: it.v.map(([unit, quantity, price]) => ({ unit, quantity, pricePaise: Math.round(price * 100) })),
        },
      },
    });
    added++;
  }
  console.log(`Added ${added} new items (${skipped} were already there).`);
}

main().finally(() => db.$disconnect());
