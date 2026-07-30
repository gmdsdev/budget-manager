import type { Db } from "@budget-manager/db";
import { categories } from "@budget-manager/db/schema/category";
import { creditCards } from "@budget-manager/db/schema/creditCard";
import { recurrenceRules } from "@budget-manager/db/schema/recurrenceRule";
import { transactionOccurrences } from "@budget-manager/db/schema/transactionOccurrence";
import { transactionTemplates } from "@budget-manager/db/schema/transactionTemplate";
import { wallets } from "@budget-manager/db/schema/wallet";
import {
  TransactionStatus,
  type RecurringFormDto,
} from "@budget-manager/schemas";
import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";

const RECURRING_COLUMNS = {
  id: transactionTemplates.id,
  kind: transactionTemplates.kind,
  name: transactionTemplates.name,
  amountCents: transactionTemplates.amountCents,
  categoryId: transactionTemplates.categoryId,
  walletId: transactionTemplates.defaultAccountId,
  creditCardId: transactionTemplates.defaultCreditCardId,
  notes: transactionTemplates.notes,
  isActive: transactionTemplates.isActive,
  createdAt: transactionTemplates.createdAt,
  updatedAt: transactionTemplates.updatedAt,
  recurrenceType: recurrenceRules.recurrenceType,
  interval: recurrenceRules.interval,
  installments: recurrenceRules.installments,
  startsOn: recurrenceRules.startsOn,
  endsOn: recurrenceRules.endsOn,
} as const;

export class RecurringRepository {
  constructor(private readonly db: Db) {}

  /**
   * A template and its rule are one concept to the user, so they are always
   * read together. `recurrence_rules` has a unique index on `template_id`, so
   * the join can only ever match one rule.
   */
  async getAll({
    userId,
    limit,
    offset,
  }: {
    userId: string;
    limit: number;
    offset: number;
  }) {
    return this.db
      .select({
        ...RECURRING_COLUMNS,
        categoryName: categories.name,
        walletName: wallets.name,
        creditCardName: creditCards.name,
        currencyCode: sql<string>`coalesce(${wallets.currencyCode}, ${creditCards.currencyCode})`,
        occurrenceCount: sql<number>`(
          select count(*) from ${transactionOccurrences}
          where ${transactionOccurrences.templateId} = ${transactionTemplates.id}
        )`.mapWith(Number),
      })
      .from(transactionTemplates)
      .innerJoin(
        recurrenceRules,
        eq(recurrenceRules.templateId, transactionTemplates.id),
      )
      .leftJoin(
        categories,
        eq(categories.id, transactionTemplates.categoryId),
      )
      .leftJoin(wallets, eq(wallets.id, transactionTemplates.defaultAccountId))
      .leftJoin(
        creditCards,
        eq(creditCards.id, transactionTemplates.defaultCreditCardId),
      )
      .where(eq(transactionTemplates.userId, userId))
      .orderBy(asc(transactionTemplates.name), asc(transactionTemplates.id))
      .limit(limit)
      .offset(offset);
  }

  async count({ userId }: { userId: string }) {
    return this.db.$count(
      transactionTemplates,
      eq(transactionTemplates.userId, userId),
    );
  }

  async findById({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .select(RECURRING_COLUMNS)
      .from(transactionTemplates)
      .innerJoin(
        recurrenceRules,
        eq(recurrenceRules.templateId, transactionTemplates.id),
      )
      .where(
        and(
          eq(transactionTemplates.id, id),
          eq(transactionTemplates.userId, userId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async create({
    userId,
    recurring,
    endsOn,
  }: {
    userId: string;
    recurring: RecurringFormDto;
    endsOn: string;
  }) {
    return this.db.transaction(async (tx) => {
      const templates = await tx
        .insert(transactionTemplates)
        .values({
          userId,
          kind: recurring.kind,
          name: recurring.name,
          amountCents: recurring.amountCents,
          categoryId: recurring.categoryId,
          defaultAccountId: recurring.walletId,
          defaultCreditCardId: recurring.creditCardId,
          notes: recurring.notes,
        })
        .returning({ id: transactionTemplates.id });

      const template = templates[0];

      if (!template) {
        throw new Error("Template insert returned no row");
      }

      await tx.insert(recurrenceRules).values({
        userId,
        templateId: template.id,
        recurrenceType: recurring.recurrenceType,
        interval: recurring.interval,
        installments: recurring.installments,
        startsOn: recurring.startsOn,
        endsOn,
      });

      return template.id;
    });
  }

  async update({
    id,
    userId,
    recurring,
    endsOn,
  }: {
    id: string;
    userId: string;
    recurring: RecurringFormDto;
    endsOn: string;
  }) {
    return this.db.transaction(async (tx) => {
      const templates = await tx
        .update(transactionTemplates)
        .set({
          kind: recurring.kind,
          name: recurring.name,
          amountCents: recurring.amountCents,
          categoryId: recurring.categoryId,
          defaultAccountId: recurring.walletId,
          defaultCreditCardId: recurring.creditCardId,
          notes: recurring.notes,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(transactionTemplates.id, id),
            eq(transactionTemplates.userId, userId),
          ),
        )
        .returning({ id: transactionTemplates.id });

      if (!templates[0]) {
        return null;
      }

      await tx
        .update(recurrenceRules)
        .set({
          recurrenceType: recurring.recurrenceType,
          interval: recurring.interval,
          installments: recurring.installments,
          startsOn: recurring.startsOn,
          endsOn,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(recurrenceRules.templateId, id),
            eq(recurrenceRules.userId, userId),
          ),
        );

      return templates[0].id;
    });
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
      .update(transactionTemplates)
      .set({ isActive, updatedAt: new Date() })
      .where(
        and(
          eq(transactionTemplates.id, id),
          eq(transactionTemplates.userId, userId),
        ),
      )
      .returning({ id: transactionTemplates.id });

    return rows[0] ?? null;
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .delete(transactionTemplates)
      .where(
        and(
          eq(transactionTemplates.id, id),
          eq(transactionTemplates.userId, userId),
        ),
      )
      .returning({ id: transactionTemplates.id });

    return rows[0] ?? null;
  }

  /** Dates already materialized, so regeneration can skip them. */
  async listOccurrenceDates({
    templateId,
    userId,
  }: {
    templateId: string;
    userId: string;
  }) {
    const rows = await this.db
      .select({
        id: transactionOccurrences.id,
        occurrenceDate: transactionOccurrences.occurrenceDate,
        status: transactionOccurrences.status,
      })
      .from(transactionOccurrences)
      .where(
        and(
          eq(transactionOccurrences.templateId, templateId),
          eq(transactionOccurrences.userId, userId),
        ),
      );

    return rows;
  }

  /**
   * Clears not-yet-happened rows that are still waiting, so an edit can re-lay
   * the schedule. Settled rows and rows dated before today are history and must
   * survive. Today counts as pending: an unpaid row dated today has not happened
   * yet, so deleting a series should take it with it.
   */
  async deleteFuturePending({
    templateId,
    userId,
    from,
  }: {
    templateId: string;
    userId: string;
    from: string;
  }) {
    const rows = await this.db
      .delete(transactionOccurrences)
      .where(
        and(
          eq(transactionOccurrences.templateId, templateId),
          eq(transactionOccurrences.userId, userId),
          eq(transactionOccurrences.status, TransactionStatus.WAITING_PAYMENT),
          gte(transactionOccurrences.occurrenceDate, from),
        ),
      )
      .returning({ id: transactionOccurrences.id });

    return rows.length;
  }

  async insertOccurrences({
    values,
  }: {
    values: (typeof transactionOccurrences.$inferInsert)[];
  }) {
    if (values.length === 0) {
      return [];
    }

    return this.db
      .insert(transactionOccurrences)
      .values(values)
      .returning({ id: transactionOccurrences.id });
  }

  async findWalletById({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .select({ id: wallets.id, currencyCode: wallets.currencyCode })
      .from(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
      .limit(1);

    return rows[0] ?? null;
  }

  async findCategoryById({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .select({ id: categories.id, type: categories.type })
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);

    return rows[0] ?? null;
  }

  async countByIds({ ids, userId }: { ids: string[]; userId: string }) {
    if (ids.length === 0) return 0;

    return this.db.$count(
      transactionTemplates,
      and(
        inArray(transactionTemplates.id, ids),
        eq(transactionTemplates.userId, userId),
      ),
    );
  }
}
