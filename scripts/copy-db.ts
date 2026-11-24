// Copies every row from one database to another, keeping the same ids.
// Used to move the shop from the local database to Neon. It only reads from the source,
// and it stops if the target already has data, so it cannot overwrite anything.
//
//   FROM_DATABASE_URL=... TO_DATABASE_URL=... npx tsx scripts/copy-db.ts
// (both default to DATABASE_URL and NEON_DATABASE_URL from .env)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const fromUrl = process.env.FROM_DATABASE_URL ?? process.env.DATABASE_URL;
const toUrl = process.env.TO_DATABASE_URL ?? process.env.NEON_DATABASE_URL;
if (!fromUrl || !toUrl) throw new Error("Set DATABASE_URL and NEON_DATABASE_URL in .env");
if (fromUrl === toUrl) throw new Error("Source and target are the same database");

const from = new PrismaClient({ datasourceUrl: fromUrl });
const to = new PrismaClient({ datasourceUrl: toUrl });

// Parents before children, so every foreign key already exists when a row is inserted.
const MODELS = [
  "user",
  "category",
  "product",
  "productVariant",
  "deliverySlot",
  "deliveryZone",
  "address",
  "order",
  "orderItem",
  "payment",
] as const;
type Model = (typeof MODELS)[number];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = (db: PrismaClient, m: Model) => (db as any)[m];

async function main() {
  for (const m of MODELS) {
    if ((await table(to, m).count()) > 0) {
      throw new Error(`Target already has rows in "${m}". Stopping so nothing is overwritten.`);
    }
  }

  for (const m of MODELS) {
    let rows: Record<string, unknown>[] = await table(from, m).findMany();
    if (m === "category") {
      // Categories point at a parent category: insert top-level ones first, then each level below.
      const byId = new Map(rows.map((r) => [r.id, r]));
      const depth = (r: Record<string, unknown>): number =>
        r.parentId && byId.has(r.parentId) ? 1 + depth(byId.get(r.parentId)!) : 0;
      rows = rows.sort((a, b) => depth(a) - depth(b));
      for (const r of rows) await table(to, m).create({ data: r });
    } else {
      for (let i = 0; i < rows.length; i += 500) {
        await table(to, m).createMany({ data: rows.slice(i, i + 500) });
      }
    }
    console.log(`${m}: copied ${rows.length}`);
  }

  // Order numbers count up automatically; continue from the highest copied number.
  await to.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Order"', 'number'), COALESCE((SELECT MAX(number) FROM "Order"), 0) + 1, false)`,
  );
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => Promise.all([from.$disconnect(), to.$disconnect()]));
