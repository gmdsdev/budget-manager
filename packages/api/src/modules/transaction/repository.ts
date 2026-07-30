import type { Db } from "@budget-manager/db";
import { categories } from "@budget-manager/db/schema/category";
import { creditCards } from "@budget-manager/db/schema/creditCard";
import { recurrenceRules } from "@budget-manager/db/schema/recurrenceRule";
import { transactionOccurrences } from "@budget-manager/db/schema/transactionOccurrence";
import { wallets } from "@budget-manager/db/schema/wallet";
import {
  FILTER_NONE,
  TransactionKind,
  TransactionRepeats,
  type CardPaymentFormDto,
  type CardPurchaseFormDto,
  type CategoryType,
  type TransactionFormDto,
  type TransactionStatus,
  type TransferFormDto,
} from "@budget-manager/schemas";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  sql,
} from "drizzle-orm";
import { containsPattern } from "../../search";

const LISTED_KINDS = Object.values(TransactionKind);

const TRANSACTION_PUBLIC_COLUMNS = {
  id: transactionOccurrences.id,
  kind: transactionOccurrences.kind,
  status: transactionOccurrences.status,
  name: transactionOccurrences.name,
  amountCents: transactionOccurrences.amountCents,
  occurrenceDate: transactionOccurrences.occurrenceDate,
  walletId: transactionOccurrences.walletId,
  categoryId: transactionOccurrences.categoryId,
  creditCardId: transactionOccurrences.creditCardId,
  creditCardBillId: transactionOccurrences.creditCardBillId,
  // What generated this row, per the design docs: a template is provenance,
  // not a separate thing the user manages.
  templateId: transactionOccurrences.templateId,
  transferGroupId: transactionOccurrences.transferGroupId,
  notes: transactionOccurrences.notes,
  paidAt: transactionOccurrences.paidAt,
  createdAt: transactionOccurrences.createdAt,
  updatedAt: transactionOccurrences.updatedAt,
} as const;

const TRANSACTION_LIST_COLUMNS = {
  ...TRANSACTION_PUBLIC_COLUMNS,
  walletName: wallets.name,
  creditCardName: creditCards.name,
  // A card purchase has no wallet, so the currency comes from whichever
  // account owns the row.
  walletCurrencyCode:
    sql<string>`coalesce(${wallets.currencyCode}, ${creditCards.currencyCode})`,
  categoryName: categories.name,
  recurrenceType: recurrenceRules.recurrenceType,
  recurrenceInterval: recurrenceRules.interval,
  recurrenceInstallments: recurrenceRules.installments,
} as const;

type TransactionRowShape = {
  status: string;
  kind: string;
};

type DomainRow<T> = Omit<T, "kind" | "status"> & {
  kind: TransactionKind;
  status: TransactionStatus;
};

function toDomainRow<T extends TransactionRowShape>(row: T): DomainRow<T> {
  return {
    ...row,
    kind: row.kind as TransactionKind,
    status: row.status as TransactionStatus,
  };
}

export type TransactionUpdatePatch = Partial<
  Pick<
    typeof transactionOccurrences.$inferInsert,
    | "kind"
    | "status"
    | "name"
    | "amountCents"
    | "occurrenceDate"
    | "walletId"
    | "categoryId"
    | "notes"
    | "paidAt"
  >
>;

const UPDATABLE_FIELDS = [
  "kind",
  "status",
  "name",
  "amountCents",
  "occurrenceDate",
  "walletId",
  "categoryId",
  "notes",
  "paidAt",
] as const;

function pickTransactionUpdate(
  patch: TransactionUpdatePatch,
): TransactionUpdatePatch {
  const set: TransactionUpdatePatch = {};

  for (const field of UPDATABLE_FIELDS) {
    if (patch[field] !== undefined) {
      Object.assign(set, { [field]: patch[field] });
    }
  }

  return set;
}

export type TransactionFilters = {
  search?: string;
  kind?: TransactionKind;
  status?: TransactionStatus;
  walletId?: string;
  creditCardId?: string;
  categoryId?: string;
  repeats?: TransactionRepeats;
  dateFrom?: string;
  dateTo?: string;
};

/**
 * Shared by the list and its count, so a page total can never disagree with the
 * rows on the page. Only columns on `transaction_occurrences` are referenced,
 * which is why counting needs no join.
 */
function transactionFilter({
  userId,
  search,
  kind,
  status,
  walletId,
  creditCardId,
  categoryId,
  repeats,
  dateFrom,
  dateTo,
}: TransactionFilters & { userId: string }) {
  const conditions = [
    eq(transactionOccurrences.userId, userId),
    kind
      ? eq(transactionOccurrences.kind, kind)
      : inArray(transactionOccurrences.kind, LISTED_KINDS),
  ];

  if (search) {
    conditions.push(
      ilike(transactionOccurrences.name, containsPattern(search)),
    );
  }

  if (status) {
    conditions.push(eq(transactionOccurrences.status, status));
  }

  if (walletId) {
    conditions.push(eq(transactionOccurrences.walletId, walletId));
  }

  if (creditCardId) {
    conditions.push(eq(transactionOccurrences.creditCardId, creditCardId));
  }

  if (categoryId === FILTER_NONE) {
    conditions.push(isNull(transactionOccurrences.categoryId));
  } else if (categoryId) {
    conditions.push(eq(transactionOccurrences.categoryId, categoryId));
  }

  if (repeats === TransactionRepeats.ONE_OFF) {
    conditions.push(isNull(transactionOccurrences.templateId));
  } else if (repeats === TransactionRepeats.RECURRING) {
    conditions.push(isNotNull(transactionOccurrences.templateId));
  }

  if (dateFrom) {
    conditions.push(gte(transactionOccurrences.occurrenceDate, dateFrom));
  }

  if (dateTo) {
    conditions.push(lte(transactionOccurrences.occurrenceDate, dateTo));
  }

  return and(...conditions);
}

export class TransactionRepository {
  constructor(private readonly db: Db) {}

  async getAll({
    userId,
    limit,
    offset,
    ...filters
  }: TransactionFilters & {
    userId: string;
    limit: number;
    offset: number;
  }) {
    const rows = await this.db
      .select(TRANSACTION_LIST_COLUMNS)
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
      .leftJoin(
        recurrenceRules,
        eq(recurrenceRules.templateId, transactionOccurrences.templateId),
      )
      .where(transactionFilter({ userId, ...filters }))
      .orderBy(
        desc(transactionOccurrences.occurrenceDate),
        asc(transactionOccurrences.id),
      )
      .limit(limit)
      .offset(offset);

    return rows.map(toDomainRow);
  }

  async count({
    userId,
    ...filters
  }: TransactionFilters & { userId: string }) {
    return this.db.$count(
      transactionOccurrences,
      transactionFilter({ userId, ...filters }),
    );
  }

  async findById({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .select(TRANSACTION_PUBLIC_COLUMNS)
      .from(transactionOccurrences)
      .where(
        and(
          eq(transactionOccurrences.id, id),
          eq(transactionOccurrences.userId, userId),
          inArray(transactionOccurrences.kind, LISTED_KINDS),
        ),
      )
      .limit(1);

    const row = rows[0];

    return row ? toDomainRow(row) : null;
  }

  async findTransferLegs({
    transferGroupId,
    userId,
  }: {
    transferGroupId: string;
    userId: string;
  }) {
    const rows = await this.db
      .select(TRANSACTION_PUBLIC_COLUMNS)
      .from(transactionOccurrences)
      .where(
        and(
          eq(transactionOccurrences.transferGroupId, transferGroupId),
          eq(transactionOccurrences.userId, userId),
        ),
      );

    return rows.map(toDomainRow);
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

    const row = rows[0];

    return row ? { ...row, type: row.type as CategoryType } : null;
  }

  async create({
    userId,
    transaction,
    paidAt,
  }: {
    userId: string;
    transaction: TransactionFormDto;
    paidAt: Date | null;
  }) {
    const rows = await this.db
      .insert(transactionOccurrences)
      .values({
        kind: transaction.kind,
        status: transaction.status,
        name: transaction.name,
        amountCents: transaction.amountCents,
        occurrenceDate: transaction.occurrenceDate,
        walletId: transaction.walletId,
        categoryId: transaction.categoryId,
        notes: transaction.notes,
        paidAt,
        userId,
      })
      .returning(TRANSACTION_PUBLIC_COLUMNS);

    const row = rows[0];

    return row ? toDomainRow(row) : null;
  }

  async findCreditCardById({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .select({ id: creditCards.id, currencyCode: creditCards.currencyCode })
      .from(creditCards)
      .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
      .limit(1);

    return rows[0] ?? null;
  }

  async createCardPurchase({
    userId,
    purchase,
    creditCardBillId,
    paidAt,
  }: {
    userId: string;
    purchase: CardPurchaseFormDto;
    creditCardBillId: string | null;
    paidAt: Date | null;
  }) {
    const rows = await this.db
      .insert(transactionOccurrences)
      .values({
        kind: TransactionKind.CREDIT_CARD_PURCHASE,
        status: purchase.status,
        name: purchase.name,
        amountCents: purchase.amountCents,
        occurrenceDate: purchase.occurrenceDate,
        // No wallet: the debt sits on the card until a bill payment settles it.
        walletId: null,
        creditCardId: purchase.creditCardId,
        creditCardBillId,
        categoryId: purchase.categoryId,
        notes: purchase.notes,
        paidAt,
        userId,
      })
      .returning(TRANSACTION_PUBLIC_COLUMNS);

    const row = rows[0];

    return row ? toDomainRow(row) : null;
  }

  async createCardPayment({
    userId,
    payment,
    paidAt,
  }: {
    userId: string;
    payment: CardPaymentFormDto;
    paidAt: Date | null;
  }) {
    const rows = await this.db
      .insert(transactionOccurrences)
      .values({
        kind: TransactionKind.CREDIT_CARD_PAYMENT,
        status: payment.status,
        name: payment.name,
        amountCents: payment.amountCents,
        occurrenceDate: payment.occurrenceDate,
        walletId: payment.walletId,
        creditCardId: payment.creditCardId,
        creditCardBillId: payment.creditCardBillId,
        categoryId: null,
        notes: payment.notes,
        paidAt,
        userId,
      })
      .returning(TRANSACTION_PUBLIC_COLUMNS);

    const row = rows[0];

    return row ? toDomainRow(row) : null;
  }

  async updateCardPurchase({
    id,
    userId,
    purchase,
    creditCardBillId,
    paidAt,
  }: {
    id: string;
    userId: string;
    purchase: CardPurchaseFormDto;
    creditCardBillId: string | null;
    paidAt: Date | null;
  }) {
    const rows = await this.db
      .update(transactionOccurrences)
      .set({
        status: purchase.status,
        name: purchase.name,
        amountCents: purchase.amountCents,
        occurrenceDate: purchase.occurrenceDate,
        creditCardId: purchase.creditCardId,
        creditCardBillId,
        categoryId: purchase.categoryId,
        notes: purchase.notes,
        paidAt,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(transactionOccurrences.id, id),
          eq(transactionOccurrences.userId, userId),
          eq(
            transactionOccurrences.kind,
            TransactionKind.CREDIT_CARD_PURCHASE,
          ),
        ),
      )
      .returning(TRANSACTION_PUBLIC_COLUMNS);

    const row = rows[0];

    return row ? toDomainRow(row) : null;
  }

  async updateCardPayment({
    id,
    userId,
    payment,
    paidAt,
  }: {
    id: string;
    userId: string;
    payment: CardPaymentFormDto;
    paidAt: Date | null;
  }) {
    const rows = await this.db
      .update(transactionOccurrences)
      .set({
        status: payment.status,
        name: payment.name,
        amountCents: payment.amountCents,
        occurrenceDate: payment.occurrenceDate,
        creditCardId: payment.creditCardId,
        creditCardBillId: payment.creditCardBillId,
        walletId: payment.walletId,
        notes: payment.notes,
        paidAt,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(transactionOccurrences.id, id),
          eq(transactionOccurrences.userId, userId),
          eq(transactionOccurrences.kind, TransactionKind.CREDIT_CARD_PAYMENT),
        ),
      )
      .returning(TRANSACTION_PUBLIC_COLUMNS);

    const row = rows[0];

    return row ? toDomainRow(row) : null;
  }

  async createTransfer({
    userId,
    transferGroupId,
    transfer,
    paidAt,
  }: {
    userId: string;
    transferGroupId: string;
    transfer: TransferFormDto;
    paidAt: Date | null;
  }) {
    const shared = {
      status: transfer.status,
      name: transfer.name,
      amountCents: transfer.amountCents,
      occurrenceDate: transfer.occurrenceDate,
      categoryId: null,
      notes: transfer.notes,
      transferGroupId,
      paidAt,
      userId,
    };

    const rows = await this.db
      .insert(transactionOccurrences)
      .values([
        {
          ...shared,
          kind: TransactionKind.TRANSFER_OUT,
          walletId: transfer.fromWalletId,
        },
        {
          ...shared,
          kind: TransactionKind.TRANSFER_IN,
          walletId: transfer.toWalletId,
        },
      ])
      .returning(TRANSACTION_PUBLIC_COLUMNS);

    return rows.map(toDomainRow);
  }

  async updateTransfer({
    transferGroupId,
    userId,
    transfer,
    paidAt,
  }: {
    transferGroupId: string;
    userId: string;
    transfer: TransferFormDto;
    paidAt: Date | null;
  }) {
    const shared = {
      status: transfer.status,
      name: transfer.name,
      amountCents: transfer.amountCents,
      occurrenceDate: transfer.occurrenceDate,
      notes: transfer.notes,
      paidAt,
      updatedAt: new Date(),
    };

    return await this.db.transaction(async (tx) => {
      const legs = [
        { kind: TransactionKind.TRANSFER_OUT, walletId: transfer.fromWalletId },
        { kind: TransactionKind.TRANSFER_IN, walletId: transfer.toWalletId },
      ];

      const updated = [];

      for (const leg of legs) {
        const rows = await tx
          .update(transactionOccurrences)
          .set({ ...shared, walletId: leg.walletId })
          .where(
            and(
              eq(transactionOccurrences.transferGroupId, transferGroupId),
              eq(transactionOccurrences.userId, userId),
              eq(transactionOccurrences.kind, leg.kind),
            ),
          )
          .returning(TRANSACTION_PUBLIC_COLUMNS);

        updated.push(...rows.map(toDomainRow));
      }

      return updated;
    });
  }

  async update({
    id,
    userId,
    patch,
  }: {
    id: string;
    userId: string;
    patch: TransactionUpdatePatch;
  }) {
    const set = pickTransactionUpdate(patch);

    if (Object.keys(set).length === 0) {
      return this.findById({ id, userId });
    }

    const rows = await this.db
      .update(transactionOccurrences)
      .set({ ...set, updatedAt: new Date() })
      .where(
        and(
          eq(transactionOccurrences.id, id),
          eq(transactionOccurrences.userId, userId),
          inArray(transactionOccurrences.kind, LISTED_KINDS),
        ),
      )
      .returning(TRANSACTION_PUBLIC_COLUMNS);

    const row = rows[0];

    return row ? toDomainRow(row) : null;
  }

  async updateTransferGroupStatus({
    transferGroupId,
    userId,
    status,
    paidAt,
  }: {
    transferGroupId: string;
    userId: string;
    status: TransactionStatus;
    paidAt: Date | null;
  }) {
    const rows = await this.db
      .update(transactionOccurrences)
      .set({ status, paidAt, updatedAt: new Date() })
      .where(
        and(
          eq(transactionOccurrences.transferGroupId, transferGroupId),
          eq(transactionOccurrences.userId, userId),
        ),
      )
      .returning(TRANSACTION_PUBLIC_COLUMNS);

    return rows.map(toDomainRow);
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .delete(transactionOccurrences)
      .where(
        and(
          eq(transactionOccurrences.id, id),
          eq(transactionOccurrences.userId, userId),
          inArray(transactionOccurrences.kind, LISTED_KINDS),
        ),
      )
      .returning({ id: transactionOccurrences.id });

    return rows[0] ?? null;
  }

  async deleteTransfer({
    transferGroupId,
    userId,
  }: {
    transferGroupId: string;
    userId: string;
  }) {
    const rows = await this.db
      .delete(transactionOccurrences)
      .where(
        and(
          eq(transactionOccurrences.transferGroupId, transferGroupId),
          eq(transactionOccurrences.userId, userId),
        ),
      )
      .returning({ id: transactionOccurrences.id });

    return rows;
  }
}
