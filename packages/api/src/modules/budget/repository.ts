import type { Db } from "@budget-manager/db";
import { budgetPeriods, budgets } from "@budget-manager/db/schema/budget";
import { categories } from "@budget-manager/db/schema/category";
import { creditCards } from "@budget-manager/db/schema/creditCard";
import { transactionOccurrences } from "@budget-manager/db/schema/transactionOccurrence";
import { wallets } from "@budget-manager/db/schema/wallet";
import {
  MONTH_EXPENSE_KINDS,
  type BudgetFormDto,
} from "@budget-manager/schemas";
import { and, asc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { containsPattern } from "../../search";

/**
 * An occurrence belongs to a wallet or to a card, never both, so the currency
 * that a purchase spends is whichever join matched. An `innerJoin(wallets)`
 * here would silently drop every card purchase from a budget.
 */
const ownerCurrency = sql<string>`coalesce(${wallets.currencyCode}, ${creditCards.currencyCode})`;

const ownerNotArchived = or(
  eq(wallets.isArchived, false),
  eq(creditCards.isArchived, false),
);

const occurrenceMonth = sql<string>`to_char(${transactionOccurrences.occurrenceDate}, 'YYYY-MM')`;

const BUDGET_PUBLIC_COLUMNS = {
  id: budgets.id,
  categoryId: budgets.categoryId,
  currencyCode: budgets.currencyCode,
  amountCents: budgets.amountCents,
  recurrenceType: budgets.recurrenceType,
  interval: budgets.interval,
  installments: budgets.installments,
  startsOn: budgets.startsOn,
  endsOn: budgets.endsOn,
  isActive: budgets.isActive,
  createdAt: budgets.createdAt,
  updatedAt: budgets.updatedAt,
} as const;

export type BudgetFilters = {
  search?: string;
  categoryId?: string;
  currencyCode?: string;
  isActive?: boolean;
};

function budgetFilter({
  userId,
  search,
  categoryId,
  currencyCode,
  isActive,
}: BudgetFilters & { userId: string }) {
  const conditions = [eq(budgets.userId, userId)];

  if (search) {
    conditions.push(ilike(categories.name, containsPattern(search)));
  }

  if (categoryId) {
    conditions.push(eq(budgets.categoryId, categoryId));
  }

  if (currencyCode) {
    conditions.push(eq(budgets.currencyCode, currencyCode));
  }

  if (isActive !== undefined) {
    conditions.push(eq(budgets.isActive, isActive));
  }

  return and(...conditions);
}

export class BudgetRepository {
  constructor(private readonly db: Db) {}

  /**
   * A budget always reads with the category it limits — the category *is* how a
   * user names it — so the join is part of the shape rather than an extra call.
   * The same join backs the name filter, which is why `count` repeats it.
   */
  async getAll({
    userId,
    limit,
    offset,
    ...filters
  }: BudgetFilters & { userId: string; limit: number; offset: number }) {
    return this.db
      .select({
        ...BUDGET_PUBLIC_COLUMNS,
        categoryName: categories.name,
        categoryColor: categories.color,
        periodCount: sql<number>`(
          select count(*) from ${budgetPeriods}
          where ${budgetPeriods.budgetId} = ${budgets.id}
        )`.mapWith(Number),
      })
      .from(budgets)
      .innerJoin(categories, eq(categories.id, budgets.categoryId))
      .where(budgetFilter({ userId, ...filters }))
      .orderBy(asc(categories.name), asc(budgets.id))
      .limit(limit)
      .offset(offset);
  }

  async count({ userId, ...filters }: BudgetFilters & { userId: string }) {
    const rows = await this.db
      .select({ total: sql<number>`count(*)`.mapWith(Number) })
      .from(budgets)
      .innerJoin(categories, eq(categories.id, budgets.categoryId))
      .where(budgetFilter({ userId, ...filters }));

    return rows[0]?.total ?? 0;
  }

  async findById({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .select({
        ...BUDGET_PUBLIC_COLUMNS,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(budgets)
      .innerJoin(categories, eq(categories.id, budgets.categoryId))
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .limit(1);

    return rows[0] ?? null;
  }

  async findByCategory({
    userId,
    categoryId,
    currencyCode,
  }: {
    userId: string;
    categoryId: string;
    currencyCode: string;
  }) {
    const rows = await this.db
      .select({ id: budgets.id })
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.categoryId, categoryId),
          eq(budgets.currencyCode, currencyCode),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async create({
    userId,
    budget,
    endsOn,
  }: {
    userId: string;
    budget: BudgetFormDto;
    endsOn: string;
  }) {
    const rows = await this.db
      .insert(budgets)
      .values({
        userId,
        categoryId: budget.categoryId,
        currencyCode: budget.currencyCode,
        amountCents: budget.amountCents,
        recurrenceType: budget.recurrenceType,
        interval: budget.interval,
        installments: budget.installments,
        startsOn: budget.startsOn,
        endsOn,
      })
      .returning({ id: budgets.id });

    const row = rows[0];

    if (!row) {
      throw new Error("Budget insert returned no row");
    }

    return row.id;
  }

  async update({
    id,
    userId,
    budget,
    endsOn,
  }: {
    id: string;
    userId: string;
    budget: BudgetFormDto;
    endsOn: string;
  }) {
    const rows = await this.db
      .update(budgets)
      .set({
        categoryId: budget.categoryId,
        currencyCode: budget.currencyCode,
        amountCents: budget.amountCents,
        recurrenceType: budget.recurrenceType,
        interval: budget.interval,
        installments: budget.installments,
        startsOn: budget.startsOn,
        endsOn,
        updatedAt: new Date(),
      })
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .returning({ id: budgets.id });

    return rows[0] ?? null;
  }

  async setActive({
    id,
    userId,
    isActive,
  }: {
    id: string;
    userId: string;
    isActive: boolean;
  }) {
    const rows = await this.db
      .update(budgets)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .returning({ id: budgets.id });

    return rows[0] ?? null;
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .delete(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .returning({ id: budgets.id });

    return rows[0] ?? null;
  }

  /** Months already materialized for a series, so regeneration can skip them. */
  async listPeriodMonths({
    budgetId,
    userId,
  }: {
    budgetId: string;
    userId: string;
  }) {
    return this.db
      .select({
        id: budgetPeriods.id,
        periodMonth: budgetPeriods.periodMonth,
        isOverride: budgetPeriods.isOverride,
      })
      .from(budgetPeriods)
      .where(
        and(
          eq(budgetPeriods.budgetId, budgetId),
          eq(budgetPeriods.userId, userId),
        ),
      );
  }

  /** Every materialized month of a series, with its category, newest first. */
  async listPeriods({
    budgetId,
    userId,
  }: {
    budgetId: string;
    userId: string;
  }) {
    return this.db
      .select({
        id: budgetPeriods.id,
        budgetId: budgetPeriods.budgetId,
        categoryId: budgetPeriods.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        currencyCode: budgetPeriods.currencyCode,
        periodMonth: budgetPeriods.periodMonth,
        amountCents: budgetPeriods.amountCents,
        isOverride: budgetPeriods.isOverride,
      })
      .from(budgetPeriods)
      .innerJoin(categories, eq(categories.id, budgetPeriods.categoryId))
      .where(
        and(
          eq(budgetPeriods.budgetId, budgetId),
          eq(budgetPeriods.userId, userId),
        ),
      )
      .orderBy(asc(budgetPeriods.periodMonth));
  }

  /** Every budgeted month across the account, for one month key. */
  async listPeriodsForMonth({
    userId,
    month,
  }: {
    userId: string;
    month: string;
  }) {
    return this.db
      .select({
        id: budgetPeriods.id,
        budgetId: budgetPeriods.budgetId,
        categoryId: budgetPeriods.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        currencyCode: budgetPeriods.currencyCode,
        periodMonth: budgetPeriods.periodMonth,
        amountCents: budgetPeriods.amountCents,
        isOverride: budgetPeriods.isOverride,
      })
      .from(budgetPeriods)
      .innerJoin(categories, eq(categories.id, budgetPeriods.categoryId))
      .where(
        and(
          eq(budgetPeriods.userId, userId),
          eq(budgetPeriods.periodMonth, month),
        ),
      )
      .orderBy(asc(categories.name), asc(budgetPeriods.id));
  }

  async findPeriodById({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .select({
        id: budgetPeriods.id,
        budgetId: budgetPeriods.budgetId,
        categoryId: budgetPeriods.categoryId,
        currencyCode: budgetPeriods.currencyCode,
        periodMonth: budgetPeriods.periodMonth,
        amountCents: budgetPeriods.amountCents,
        isOverride: budgetPeriods.isOverride,
      })
      .from(budgetPeriods)
      .where(and(eq(budgetPeriods.id, id), eq(budgetPeriods.userId, userId)))
      .limit(1);

    return rows[0] ?? null;
  }

  async setPeriodAmount({
    id,
    userId,
    amountCents,
    isOverride,
  }: {
    id: string;
    userId: string;
    amountCents: number;
    isOverride: boolean;
  }) {
    const rows = await this.db
      .update(budgetPeriods)
      .set({ amountCents, isOverride, updatedAt: new Date() })
      .where(and(eq(budgetPeriods.id, id), eq(budgetPeriods.userId, userId)))
      .returning({ id: budgetPeriods.id });

    return rows[0] ?? null;
  }

  async insertPeriods({
    values,
  }: {
    values: (typeof budgetPeriods.$inferInsert)[];
  }) {
    if (values.length === 0) {
      return [];
    }

    // A month may already carry a limit from a series that has since been
    // deleted, so the unique index is resolved rather than raised: the newer
    // series adopts the row unless the user set that month by hand.
    return this.db
      .insert(budgetPeriods)
      .values(values)
      .onConflictDoUpdate({
        target: [
          budgetPeriods.userId,
          budgetPeriods.categoryId,
          budgetPeriods.currencyCode,
          budgetPeriods.periodMonth,
        ],
        set: {
          budgetId: sql`excluded.budget_id`,
          amountCents: sql`excluded.amount_cents`,
          updatedAt: new Date(),
        },
        setWhere: eq(budgetPeriods.isOverride, false),
      })
      .returning({ id: budgetPeriods.id });
  }

  /**
   * Clears the months a series laid down that have not started yet, so an edit
   * can re-lay the schedule. The current month counts as still ahead — a budget
   * you are living through is the one an edit most often means to change.
   * Months the user set by hand are a deliberate choice and always survive.
   */
  async deleteFutureInherited({
    budgetId,
    userId,
    from,
  }: {
    budgetId: string;
    userId: string;
    from: string;
  }) {
    const rows = await this.db
      .delete(budgetPeriods)
      .where(
        and(
          eq(budgetPeriods.budgetId, budgetId),
          eq(budgetPeriods.userId, userId),
          eq(budgetPeriods.isOverride, false),
          gte(budgetPeriods.periodMonth, from),
        ),
      )
      .returning({ id: budgetPeriods.id });

    return rows.length;
  }

  async findCategoryById({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .select({
        id: categories.id,
        type: categories.type,
        isArchived: categories.isArchived,
      })
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);

    return rows[0] ?? null;
  }

  /**
   * Spending per category and currency in one month, split by status so the
   * settled and committed figures come from a single pass. Deliberately a plain
   * GROUP BY with no CASE: which statuses count is decided in `progress.ts`,
   * which is unit tested.
   */
  async getCategorySpend({
    userId,
    from,
    to,
  }: {
    userId: string;
    from: string;
    to: string;
  }) {
    return this.db
      .select({
        currencyCode: ownerCurrency,
        categoryId: transactionOccurrences.categoryId,
        status: transactionOccurrences.status,
        totalCents:
          sql<number>`sum(${transactionOccurrences.amountCents})`.mapWith(
            Number,
          ),
      })
      .from(transactionOccurrences)
      .leftJoin(wallets, eq(wallets.id, transactionOccurrences.walletId))
      .leftJoin(
        creditCards,
        eq(creditCards.id, transactionOccurrences.creditCardId),
      )
      .where(
        and(
          eq(transactionOccurrences.userId, userId),
          ownerNotArchived,
          inArray(transactionOccurrences.kind, MONTH_EXPENSE_KINDS),
          gte(transactionOccurrences.occurrenceDate, from),
          lte(transactionOccurrences.occurrenceDate, to),
        ),
      )
      .groupBy(
        ownerCurrency,
        transactionOccurrences.categoryId,
        transactionOccurrences.status,
      );
  }

  /**
   * Spending per category, currency **and month** across a window, so a series'
   * month list can show what each of its periods actually cost.
   */
  async getCategorySpendByMonth({
    userId,
    from,
    to,
  }: {
    userId: string;
    from: string;
    to: string;
  }) {
    return this.db
      .select({
        month: occurrenceMonth,
        currencyCode: ownerCurrency,
        categoryId: transactionOccurrences.categoryId,
        status: transactionOccurrences.status,
        totalCents:
          sql<number>`sum(${transactionOccurrences.amountCents})`.mapWith(
            Number,
          ),
      })
      .from(transactionOccurrences)
      .leftJoin(wallets, eq(wallets.id, transactionOccurrences.walletId))
      .leftJoin(
        creditCards,
        eq(creditCards.id, transactionOccurrences.creditCardId),
      )
      .where(
        and(
          eq(transactionOccurrences.userId, userId),
          ownerNotArchived,
          inArray(transactionOccurrences.kind, MONTH_EXPENSE_KINDS),
          gte(transactionOccurrences.occurrenceDate, from),
          lte(transactionOccurrences.occurrenceDate, to),
        ),
      )
      .groupBy(
        occurrenceMonth,
        ownerCurrency,
        transactionOccurrences.categoryId,
        transactionOccurrences.status,
      );
  }
}
