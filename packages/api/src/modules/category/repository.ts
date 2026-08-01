import type { Db } from "@budget-manager/db";
import { budgetPeriods, budgets } from "@budget-manager/db/schema/budget";
import { categories } from "@budget-manager/db/schema/category";
import { transactionOccurrences } from "@budget-manager/db/schema/transactionOccurrence";
import { transactionTemplates } from "@budget-manager/db/schema/transactionTemplate";
import type {
  CategoryColor,
  CategoryFormDto,
  CategoryType,
} from "@budget-manager/schemas";
import { and, asc, eq, ilike } from "drizzle-orm";
import { containsPattern } from "../../search";

const CATEGORY_PUBLIC_COLUMNS = {
  id: categories.id,
  name: categories.name,
  type: categories.type,
  color: categories.color,
  isArchived: categories.isArchived,
  createdAt: categories.createdAt,
  updatedAt: categories.updatedAt,
} as const;

type DomainRow<T> = Omit<T, "type" | "color"> & {
  type: CategoryType;
  color: CategoryColor;
};

/** Drizzle hands back the raw pg enums; narrow them once, here. */
function toDomainRow<T extends { type: string; color: string }>(
  row: T,
): DomainRow<T> {
  return {
    ...row,
    type: row.type as CategoryType,
    color: row.color as CategoryColor,
  };
}

export type CategoryUpdatePatch = Partial<
  Pick<typeof categories.$inferInsert, "name" | "type" | "color">
>;

function pickCategoryUpdate(patch: CategoryUpdatePatch): CategoryUpdatePatch {
  const set: CategoryUpdatePatch = {};

  if (patch.name !== undefined) {
    set.name = patch.name;
  }

  if (patch.type !== undefined) {
    set.type = patch.type;
  }

  if (patch.color !== undefined) {
    set.color = patch.color;
  }

  return set;
}

export type CategoryFilters = {
  search?: string;
  type?: CategoryType;
};

function categoryFilter({
  userId,
  search,
  type,
  includeArchived,
}: CategoryFilters & {
  userId: string;
  includeArchived: boolean;
}) {
  const conditions = [eq(categories.userId, userId)];

  if (!includeArchived) {
    conditions.push(eq(categories.isArchived, false));
  }

  if (search) {
    conditions.push(ilike(categories.name, containsPattern(search)));
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
    includeArchived,
    limit,
    offset,
    ...filters
  }: CategoryFilters & {
    userId: string;
    includeArchived: boolean;
    limit: number;
    offset: number;
  }) {
    const rows = await this.db
      .select(CATEGORY_PUBLIC_COLUMNS)
      .from(categories)
      .where(categoryFilter({ userId, includeArchived, ...filters }))
      .orderBy(asc(categories.name), asc(categories.id))
      .limit(limit)
      .offset(offset);

    return rows.map(toDomainRow);
  }

  async count({
    userId,
    includeArchived,
    ...filters
  }: CategoryFilters & {
    userId: string;
    includeArchived: boolean;
  }) {
    return this.db.$count(
      categories,
      categoryFilter({ userId, includeArchived, ...filters }),
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
        color: categories.color,
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
        color: category.color,
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

  /**
   * Everything that would go with the category. `budgets.category_id` and
   * `budget_periods.category_id` are both ON DELETE CASCADE, so leaving them
   * out let a delete take a budget and every month it had already laid down —
   * including months already lived through, which the rest of the feature goes
   * out of its way to preserve.
   */
  async countReferences({ id }: { id: string }) {
    const [occurrences, templates, budgetRules, periods] = await Promise.all([
      this.db.$count(
        transactionOccurrences,
        eq(transactionOccurrences.categoryId, id),
      ),
      this.db.$count(
        transactionTemplates,
        eq(transactionTemplates.categoryId, id),
      ),
      this.db.$count(budgets, eq(budgets.categoryId, id)),
      this.db.$count(budgetPeriods, eq(budgetPeriods.categoryId, id)),
    ]);

    return occurrences + templates + budgetRules + periods;
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning({ id: categories.id });

    return rows[0] ?? null;
  }
}
