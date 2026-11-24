import "server-only";
import { db } from "./db";

export type NavChild = { slug: string; nameEn: string; nameKn: string | null; count: number };
export type NavGroup = NavChild & { children: NavChild[] };

// Builds the dropdown menu from the category tree. Empty categories are hidden,
// so the menu only ever shows things a customer can actually buy.
export async function getNav(): Promise<NavGroup[]> {
  const cats = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { active: true } } } } },
  });
  const toChild = (c: (typeof cats)[number]): NavChild => ({
    slug: c.slug,
    nameEn: c.nameEn,
    nameKn: c.nameKn,
    count: c._count.products,
  });

  return cats
    .filter((c) => !c.parentId)
    .map((g) => {
      const children = cats.filter((c) => c.parentId === g.id).map(toChild).filter((c) => c.count > 0);
      // a group's count includes products placed directly on it, plus everything in its sub-categories
      const count = g._count.products + children.reduce((n, c) => n + c.count, 0);
      return { ...toChild(g), count, children };
    })
    .filter((g) => g.count > 0);
}
