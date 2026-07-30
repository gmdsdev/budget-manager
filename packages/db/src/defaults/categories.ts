import type { CategoryType } from "@budget-manager/schemas";
import { missingDefaultCategories } from "@budget-manager/schemas";
import { eq } from "drizzle-orm";

import type { Db } from "../index";
import { categories } from "../schema/category";

export async function ensureDefaultCategories({
  db,
  userId,
}: {
  db: Db;
  userId: string;
}) {
  const existing = await db
    .select({ name: categories.name, type: categories.type })
    .from(categories)
    .where(eq(categories.userId, userId));

  const missing = missingDefaultCategories(
    existing.map((row) => ({ name: row.name, type: row.type as CategoryType })),
  );

  if (missing.length === 0) {
    return [];
  }

  return db
    .insert(categories)
    .values(
      missing.map((category) => ({
        userId,
        name: category.name,
        type: category.type,
        color: category.color,
      })),
    )
    .returning({ id: categories.id });
}
