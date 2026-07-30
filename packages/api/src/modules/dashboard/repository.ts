import type { Db } from "@budget-manager/db";
import { categories } from "@budget-manager/db/schema/category";
import { creditCards } from "@budget-manager/db/schema/creditCard";
import { creditCardBills } from "@budget-manager/db/schema/creditCardBill";
import { transactionOccurrences } from "@budget-manager/db/schema/transactionOccurrence";
import { wallets } from "@budget-manager/db/schema/wallet";
import {
  type CategoryColor,
  MONTH_EXPENSE_KINDS,
  TransactionStatus,
} from "@budget-manager/schemas";
import { and, asc, eq, gte, inArray, isNotNull, lte, or, sql } from "drizzle-orm";

/**
 * An occurrence belongs to a wallet or to a card, never both, so the owning
 * account's currency is whichever join matched.
 */
const ownerCurrency = sql<string>`coalesce(${wallets.currencyCode}, ${creditCards.currencyCode})`;

/**
 * Keeps rows whose owner is not archived. For a wallet-owned row the card side
 * is NULL, and `TRUE OR NULL` is TRUE; for an archived owner it is
 * `FALSE OR NULL` = NULL, which excludes the row. Both directions hold.
 */
const ownerNotArchived = or(
  eq(wallets.isArchived, false),
  eq(creditCards.isArchived, false),
);

/** The `YYYY-MM` bucket a row falls in — a grouping key, not a rule. */
const occurrenceMonth = sql<string>`to_char(${transactionOccurrences.occurrenceDate}, 'YYYY-MM')`;

/**
 * Every query here is a plain GROUP BY with no CASE/FILTER: which kinds and
 * statuses count is decided in `summary.ts`, which is unit tested. See the
 * balances note in CLAUDE.md.
 */
export class DashboardRepository {
  constructor(private readonly db: Db) {}

  async listActiveWallets({ userId }: { userId: string }) {
    return this.db
      .select({
        id: wallets.id,
        name: wallets.name,
        currencyCode: wallets.currencyCode,
        openingBalanceCents: wallets.openingBalanceCents,
      })
      .from(wallets)
      .where(and(eq(wallets.userId, userId), eq(wallets.isArchived, false)));
  }

  async listActiveCards({ userId }: { userId: string }) {
    return this.db
      .select({
        id: creditCards.id,
        name: creditCards.name,
        currencyCode: creditCards.currencyCode,
        limitCents: creditCards.limitCents,
      })
      .from(creditCards)
      .where(
        and(eq(creditCards.userId, userId), eq(creditCards.isArchived, false)),
      );
  }

  async getCardMovementTotals({ userId }: { userId: string }) {
    return this.db
      .select({
        creditCardId: transactionOccurrences.creditCardId,
        kind: transactionOccurrences.kind,
        status: transactionOccurrences.status,
        totalCents:
          sql<number>`sum(${transactionOccurrences.amountCents})`.mapWith(
            Number,
          ),
      })
      .from(transactionOccurrences)
      .where(
        and(
          eq(transactionOccurrences.userId, userId),
          isNotNull(transactionOccurrences.creditCardId),
        ),
      )
      .groupBy(
        transactionOccurrences.creditCardId,
        transactionOccurrences.kind,
        transactionOccurrences.status,
      );
  }

  /** Statements across every active card, with the card they belong to. */
  async listBills({ userId }: { userId: string }) {
    return this.db
      .select({
        id: creditCardBills.id,
        creditCardId: creditCardBills.creditCardId,
        creditCardName: creditCards.name,
        currencyCode: creditCards.currencyCode,
        periodStart: creditCardBills.periodStart,
        periodEnd: creditCardBills.periodEnd,
        closeAt: creditCardBills.closeAt,
        dueAt: creditCardBills.dueAt,
      })
      .from(creditCardBills)
      .innerJoin(
        creditCards,
        eq(creditCards.id, creditCardBills.creditCardId),
      )
      .where(
        and(
          eq(creditCardBills.userId, userId),
          eq(creditCards.isArchived, false),
        ),
      )
      .orderBy(asc(creditCardBills.dueAt), asc(creditCardBills.id));
  }

  async getBillMovementTotals({ userId }: { userId: string }) {
    return this.db
      .select({
        creditCardBillId: transactionOccurrences.creditCardBillId,
        kind: transactionOccurrences.kind,
        status: transactionOccurrences.status,
        totalCents:
          sql<number>`sum(${transactionOccurrences.amountCents})`.mapWith(
            Number,
          ),
      })
      .from(transactionOccurrences)
      .where(
        and(
          eq(transactionOccurrences.userId, userId),
          isNotNull(transactionOccurrences.creditCardBillId),
        ),
      )
      .groupBy(
        transactionOccurrences.creditCardBillId,
        transactionOccurrences.kind,
        transactionOccurrences.status,
      );
  }

  /**
   * One row per (month, currency, kind, status) across the whole trend window.
   * The month in view is a slice of this, so its figures and the trend chart
   * come from the same grouping.
   */
  async getTrendMovements({
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
        kind: transactionOccurrences.kind,
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
          gte(transactionOccurrences.occurrenceDate, from),
          lte(transactionOccurrences.occurrenceDate, to),
        ),
      )
      .groupBy(
        occurrenceMonth,
        ownerCurrency,
        transactionOccurrences.kind,
        transactionOccurrences.status,
      );
  }

  async getMonthCategoryMovements({
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
        categoryName: categories.name,
        categoryColor: categories.color,
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
      .leftJoin(
        categories,
        eq(categories.id, transactionOccurrences.categoryId),
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
        categories.name,
        categories.color,
        transactionOccurrences.status,
      );
  }

  async getMovementTotals({ userId }: { userId: string }) {
    return this.db
      .select({
        walletId: transactionOccurrences.walletId,
        kind: transactionOccurrences.kind,
        status: transactionOccurrences.status,
        totalCents:
          sql<number>`sum(${transactionOccurrences.amountCents})`.mapWith(
            Number,
          ),
      })
      .from(transactionOccurrences)
      .where(
        and(
          eq(transactionOccurrences.userId, userId),
          isNotNull(transactionOccurrences.walletId),
        ),
      )
      .groupBy(
        transactionOccurrences.walletId,
        transactionOccurrences.kind,
        transactionOccurrences.status,
      );
  }

  /**
   * Everything still awaiting payment, oldest first — overdue rows included.
   * Filtering to `date >= today` would hide exactly the rows a user most needs
   * to see.
   */
  async getPending({ userId, limit }: { userId: string; limit: number }) {
    const rows = await this.db
      .select({
        id: transactionOccurrences.id,
        name: transactionOccurrences.name,
        kind: transactionOccurrences.kind,
        amountCents: transactionOccurrences.amountCents,
        occurrenceDate: transactionOccurrences.occurrenceDate,
        walletName: wallets.name,
        creditCardName: creditCards.name,
        walletCurrencyCode: ownerCurrency,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(transactionOccurrences)
      .leftJoin(wallets, eq(wallets.id, transactionOccurrences.walletId))
      .leftJoin(
        creditCards,
        eq(creditCards.id, transactionOccurrences.creditCardId),
      )
      .leftJoin(
        categories,
        eq(categories.id, transactionOccurrences.categoryId),
      )
      .where(
        and(
          eq(transactionOccurrences.userId, userId),
          ownerNotArchived,
          eq(transactionOccurrences.status, TransactionStatus.WAITING_PAYMENT),
        ),
      )
      .orderBy(
        asc(transactionOccurrences.occurrenceDate),
        asc(transactionOccurrences.id),
      )
      .limit(limit);

    return rows.map((row) => ({
      ...row,
      categoryColor: row.categoryColor as CategoryColor | null,
    }));
  }
}
