import type { Db } from "@budget-manager/db";
import { creditCards } from "@budget-manager/db/schema/creditCard";
import { creditCardBills } from "@budget-manager/db/schema/creditCardBill";
import { transactionOccurrences } from "@budget-manager/db/schema/transactionOccurrence";
import { transactionTemplates } from "@budget-manager/db/schema/transactionTemplate";
import { wallets } from "@budget-manager/db/schema/wallet";
import { FILTER_NONE, type CreditCardFormDto } from "@budget-manager/schemas";
import { and, asc, desc, eq, ilike, isNotNull, isNull, sql } from "drizzle-orm";
import { containsPattern } from "../../search";
import type { BillCycle } from "./cycle";

const CREDIT_CARD_PUBLIC_COLUMNS = {
  id: creditCards.id,
  name: creditCards.name,
  limitCents: creditCards.limitCents,
  closeDay: creditCards.closeDay,
  dueDay: creditCards.dueDay,
  defaultBillingWalletId: creditCards.defaultBillingWalletId,
  currencyCode: creditCards.currencyCode,
  isArchived: creditCards.isArchived,
  createdAt: creditCards.createdAt,
  updatedAt: creditCards.updatedAt,
} as const;

const CREDIT_CARD_BILL_COLUMNS = {
  id: creditCardBills.id,
  creditCardId: creditCardBills.creditCardId,
  billingWalletId: creditCardBills.billingWalletId,
  periodStart: creditCardBills.periodStart,
  periodEnd: creditCardBills.periodEnd,
  closeAt: creditCardBills.closeAt,
  dueAt: creditCardBills.dueAt,
  createdAt: creditCardBills.createdAt,
  updatedAt: creditCardBills.updatedAt,
} as const;

export type CreditCardUpdatePatch = Partial<
  Pick<
    typeof creditCards.$inferInsert,
    | "name"
    | "limitCents"
    | "closeDay"
    | "dueDay"
    | "defaultBillingWalletId"
    | "currencyCode"
  >
>;

const UPDATABLE_FIELDS = [
  "name",
  "limitCents",
  "closeDay",
  "dueDay",
  "defaultBillingWalletId",
  "currencyCode",
] as const;

function pickCreditCardUpdate(
  patch: CreditCardUpdatePatch,
): CreditCardUpdatePatch {
  const set: CreditCardUpdatePatch = {};

  for (const field of UPDATABLE_FIELDS) {
    if (patch[field] !== undefined) {
      Object.assign(set, { [field]: patch[field] });
    }
  }

  return set;
}

export type CreditCardFilters = {
  search?: string;
  currencyCode?: string;
  defaultBillingWalletId?: string;
};

function creditCardFilter({
  userId,
  includeArchived,
  search,
  currencyCode,
  defaultBillingWalletId,
}: CreditCardFilters & {
  userId: string;
  includeArchived: boolean;
}) {
  const conditions = [eq(creditCards.userId, userId)];

  if (!includeArchived) {
    conditions.push(eq(creditCards.isArchived, false));
  }

  if (search) {
    conditions.push(ilike(creditCards.name, containsPattern(search)));
  }

  if (currencyCode) {
    conditions.push(eq(creditCards.currencyCode, currencyCode));
  }

  if (defaultBillingWalletId === FILTER_NONE) {
    conditions.push(isNull(creditCards.defaultBillingWalletId));
  } else if (defaultBillingWalletId) {
    conditions.push(
      eq(creditCards.defaultBillingWalletId, defaultBillingWalletId),
    );
  }

  return and(...conditions);
}

export class CreditCardRepository {
  constructor(private readonly db: Db) {}

  async getAll({
    userId,
    includeArchived,
    limit,
    offset,
    ...filters
  }: CreditCardFilters & {
    userId: string;
    includeArchived: boolean;
    limit: number;
    offset: number;
  }) {
    return this.db
      .select({
        ...CREDIT_CARD_PUBLIC_COLUMNS,
        defaultBillingWalletName: wallets.name,
      })
      .from(creditCards)
      .leftJoin(wallets, eq(wallets.id, creditCards.defaultBillingWalletId))
      .where(creditCardFilter({ userId, includeArchived, ...filters }))
      .orderBy(asc(creditCards.name), asc(creditCards.id))
      .limit(limit)
      .offset(offset);
  }

  async count({
    userId,
    includeArchived,
    ...filters
  }: CreditCardFilters & {
    userId: string;
    includeArchived: boolean;
  }) {
    return this.db.$count(
      creditCards,
      creditCardFilter({ userId, includeArchived, ...filters }),
    );
  }

  /** Unpaginated, minimal rows for select inputs. */
  async listOptions({ userId }: { userId: string }) {
    return this.db
      .select({
        id: creditCards.id,
        name: creditCards.name,
        currencyCode: creditCards.currencyCode,
        defaultBillingWalletId: creditCards.defaultBillingWalletId,
      })
      .from(creditCards)
      .where(
        and(eq(creditCards.userId, userId), eq(creditCards.isArchived, false)),
      )
      .orderBy(asc(creditCards.name), asc(creditCards.id));
  }

  /**
   * Purchase and payment totals per card. Plain GROUP BY: which kinds and
   * statuses count is decided in the unit-tested `balance.ts`.
   */
  async getMovementTotals({ userId }: { userId: string }) {
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

  /**
   * Idempotent: the unique (card, periodStart, periodEnd) index means a
   * concurrent insert for the same cycle resolves to the same row instead of
   * creating a duplicate statement.
   */
  async ensureBill({
    userId,
    creditCardId,
    cycle,
    billingWalletId,
  }: {
    userId: string;
    creditCardId: string;
    cycle: BillCycle;
    billingWalletId: string | null;
  }) {
    const rows = await this.db
      .insert(creditCardBills)
      .values({
        userId,
        creditCardId,
        billingWalletId,
        periodStart: cycle.periodStart,
        periodEnd: cycle.periodEnd,
        closeAt: cycle.closeAt,
        dueAt: cycle.dueAt,
      })
      .onConflictDoUpdate({
        target: [
          creditCardBills.creditCardId,
          creditCardBills.periodStart,
          creditCardBills.periodEnd,
        ],
        set: { updatedAt: new Date() },
      })
      .returning(CREDIT_CARD_BILL_COLUMNS);

    return rows[0] ?? null;
  }

  async listBills({
    userId,
    creditCardId,
    limit,
    offset,
  }: {
    userId: string;
    creditCardId: string;
    limit: number;
    offset: number;
  }) {
    return this.db
      .select(CREDIT_CARD_BILL_COLUMNS)
      .from(creditCardBills)
      .where(
        and(
          eq(creditCardBills.userId, userId),
          eq(creditCardBills.creditCardId, creditCardId),
        ),
      )
      .orderBy(desc(creditCardBills.periodStart))
      .limit(limit)
      .offset(offset);
  }

  async countBills({
    userId,
    creditCardId,
  }: {
    userId: string;
    creditCardId: string;
  }) {
    return this.db.$count(
      creditCardBills,
      and(
        eq(creditCardBills.userId, userId),
        eq(creditCardBills.creditCardId, creditCardId),
      ),
    );
  }

  async findBillById({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .select(CREDIT_CARD_BILL_COLUMNS)
      .from(creditCardBills)
      .where(
        and(eq(creditCardBills.id, id), eq(creditCardBills.userId, userId)),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  /** Purchase and payment totals per bill. Plain GROUP BY; rules live in TS. */
  async getBillMovementTotals({
    userId,
    creditCardId,
  }: {
    userId: string;
    creditCardId: string;
  }) {
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
          eq(transactionOccurrences.creditCardId, creditCardId),
          isNotNull(transactionOccurrences.creditCardBillId),
        ),
      )
      .groupBy(
        transactionOccurrences.creditCardBillId,
        transactionOccurrences.kind,
        transactionOccurrences.status,
      );
  }

  async findById({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .select(CREDIT_CARD_PUBLIC_COLUMNS)
      .from(creditCards)
      .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
      .limit(1);

    return rows[0] ?? null;
  }

  async findWalletById({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .select({ id: wallets.id, currencyCode: wallets.currencyCode })
      .from(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
      .limit(1);

    return rows[0] ?? null;
  }

  async create({
    userId,
    card,
  }: {
    userId: string;
    card: CreditCardFormDto;
  }) {
    const rows = await this.db
      .insert(creditCards)
      .values({
        name: card.name,
        limitCents: card.limitCents,
        closeDay: card.closeDay,
        dueDay: card.dueDay,
        defaultBillingWalletId: card.defaultBillingWalletId,
        currencyCode: card.currencyCode,
        userId,
      })
      .returning(CREDIT_CARD_PUBLIC_COLUMNS);

    return rows[0] ?? null;
  }

  async update({
    id,
    userId,
    patch,
  }: {
    id: string;
    userId: string;
    patch: CreditCardUpdatePatch;
  }) {
    const set = pickCreditCardUpdate(patch);

    if (Object.keys(set).length === 0) {
      return this.findById({ id, userId });
    }

    const rows = await this.db
      .update(creditCards)
      .set({ ...set, updatedAt: new Date() })
      .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
      .returning(CREDIT_CARD_PUBLIC_COLUMNS);

    return rows[0] ?? null;
  }

  async archive({ id, userId }: { id: string; userId: string }) {
    const now = new Date();

    const rows = await this.db
      .update(creditCards)
      .set({ isArchived: true, archivedAt: now, updatedAt: now })
      .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
      .returning(CREDIT_CARD_PUBLIC_COLUMNS);

    return rows[0] ?? null;
  }

  async unarchive({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .update(creditCards)
      .set({ isArchived: false, archivedAt: null, updatedAt: new Date() })
      .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
      .returning(CREDIT_CARD_PUBLIC_COLUMNS);

    return rows[0] ?? null;
  }

  async countReferences({ id }: { id: string }) {
    const [occurrences, bills, templates] = await Promise.all([
      this.db.$count(
        transactionOccurrences,
        eq(transactionOccurrences.creditCardId, id),
      ),
      this.db.$count(creditCardBills, eq(creditCardBills.creditCardId, id)),
      this.db.$count(
        transactionTemplates,
        eq(transactionTemplates.defaultCreditCardId, id),
      ),
    ]);

    return occurrences + bills + templates;
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .delete(creditCards)
      .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
      .returning({ id: creditCards.id });

    return rows[0] ?? null;
  }
}
