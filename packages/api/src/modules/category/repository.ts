import type { Db } from "@budget-manager/db";
import { categories } from "@budget-manager/db/schema/category";
import { transactionOccurrences } from "@budget-manager/db/schema/transactionOccurrence";
import { transactionTemplates } from "@budget-manager/db/schema/transactionTemplate";
import type { CategoryFormDto, CategoryType } from "@budget-manager/schemas";
import { and, asc, eq } from "drizzle-orm";

const CATEGORY_PUBLIC_COLUMNS = {
  id: categories.id,
  name: categories.name,
  type: categories.type,
  isArchived: categories.isArchived,
  createdAt: categories.createdAt,
  updatedAt: categories.updatedAt,
} as const;

type DomainRow<T> = Omit<T, "type"> & { type: CategoryType };

/** Drizzle hands back the raw pg enum; narrow it once, here. */
function toDomainRow<T extends { type: string }>(row: T): DomainRow<T> {
  return { ...row, type: row.type as CategoryType };
}

export type CategoryUpdatePatch = Partial<
  Pick<typeof categories.$inferInsert, "name" | "type">
>;

function pickCategoryUpdate(patch: CategoryUpdatePatch): CategoryUpdatePatch {
  const set: CategoryUpdatePatch = {};

  if (patch.name !== undefined) {
    set.name = patch.name;
  }

  if (patch.type !== undefined) {
    set.type = patch.type;
  }

  return set;
}

function categoryFilter({
  userId,
  type,
  includeArchived,
}: {
  userId: string;
  type?: CategoryType;
  includeArchived: boolean;
}) {
  const conditions = [eq(categories.userId, userId)];

  if (!includeArchived) {
    conditions.push(eq(categories.isArchived, false));
  }

  if (type) {
    conditions.push(eq(categories.type, type));
  }

  return and(...conditions);
}

export class CategoryRepository {
  constructor(private readonly db: Db) {}

  async getAll({
    userId,
    type,
    includeArchived,
    limit,
    offset,
  }: {
    userId: string;
    type?: CategoryType;
    includeArchived: boolean;
    limit: number;
    offset: number;
  }) {
    const rows = await this.db
      .select(CATEGORY_PUBLIC_COLUMNS)
      .from(categories)
      .where(categoryFilter({ userId, type, includeArchived }))
      .orderBy(asc(categories.name), asc(categories.id))
      .limit(limit)
      .offset(offset);

    return rows.map(toDomainRow);
  }

  async count({
    userId,
    type,
    includeArchived,
  }: {
    userId: string;
    type?: CategoryType;
    includeArchived: boolean;
  }) {
    return this.db.$count(
      categories,
      categoryFilter({ userId, type, includeArchived }),
    );
  }

  /**
   * Unpaginated, minimal rows for select inputs. Page size must never silently
   * hide an option the user needs to pick.
   */
  async listOptions({ userId, type }: { userId: string; type?: CategoryType }) {
    const rows = await this.db
      .select({
        id: categories.id,
        name: categories.name,
        type: categories.type,
      })
      .from(categories)
      .where(categoryFilter({ userId, type, includeArchived: false }))
      .orderBy(asc(categories.name), asc(categories.id));

    return rows.map(toDomainRow);
  }

  async findById({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .select(CATEGORY_PUBLIC_COLUMNS)
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);

    const row = rows[0];

    return row ? toDomainRow(row) : null;
  }

  async create({
    userId,
    category,
  }: {
    userId: string;
    category: CategoryFormDto;
  }) {
    const rows = await this.db
      .insert(categories)
      .values({
        name: category.name,
        type: category.type,
        userId,
      })
      .returning(CATEGORY_PUBLIC_COLUMNS);

    const row = rows[0];

    return row ? toDomainRow(row) : null;
  }

  async update({
    id,
    userId,
    patch,
  }: {
    id: string;
    userId: string;
    patch: CategoryUpdatePatch;
  }) {
    const set = pickCategoryUpdate(patch);

    if (Object.keys(set).length === 0) {
      return this.findById({ id, userId });
    }

    const rows = await this.db
      .update(categories)
      .set({ ...set, updatedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning(CATEGORY_PUBLIC_COLUMNS);

    const row = rows[0];

    return row ? toDomainRow(row) : null;
  }

  async archive({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .update(categories)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning(CATEGORY_PUBLIC_COLUMNS);

    const row = rows[0];

    return row ? toDomainRow(row) : null;
  }

  async unarchive({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .update(categories)
      .set({ isArchived: false, updatedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning(CATEGORY_PUBLIC_COLUMNS);

    const row = rows[0];

    return row ? toDomainRow(row) : null;
  }

  async countReferences({ id }: { id: string }) {
    const [occurrences, templates] = await Promise.all([
      this.db.$count(
        transactionOccurrences,
        eq(transactionOccurrences.categoryId, id),
      ),
      this.db.$count(
        transactionTemplates,
        eq(transactionTemplates.categoryId, id),
      ),
    ]);

    return occurrences + templates;
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning({ id: categories.id });

    return rows[0] ?? null;
  }
}
