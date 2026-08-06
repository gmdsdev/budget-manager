import type { transactionOccurrences } from "@budget-manager/db/schema/transactionOccurrence";
import {
  TransactionKind,
  TransactionStatus,
  type ImportTransactionRowDto,
} from "@budget-manager/schemas";

type TransactionInsertValue = typeof transactionOccurrences.$inferInsert;

/**
 * Statements are resolved per card, so a flat lookup over the whole batch
 * needs the card in the key — two cards can file the same date under two
 * different bills.
 */
export function importBillKey(creditCardId: string, occurrenceDate: string) {
  return `${creditCardId}:${occurrenceDate}`;
}

export function buildImportInsertValues({
  userId,
  rows,
  billIdByCardAndDate,
  now,
}: {
  userId: string;
  rows: ImportTransactionRowDto[];
  billIdByCardAndDate: Map<string, string>;
  now: Date;
}): TransactionInsertValue[] {
  return rows.map((row) => {
    const base = {
      userId,
      status: row.status,
      name: row.name,
      amountCents: row.amountCents,
      occurrenceDate: row.occurrenceDate,
      categoryId: row.categoryId,
      notes: row.notes,
      paidAt: row.status === TransactionStatus.PAID ? now : null,
    };

    if (row.target === "card") {
      return {
        ...base,
        kind: TransactionKind.CREDIT_CARD_PURCHASE,
        walletId: null,
        creditCardId: row.creditCardId,
        creditCardBillId:
          billIdByCardAndDate.get(
            importBillKey(row.creditCardId, row.occurrenceDate),
          ) ?? null,
      };
    }

    return {
      ...base,
      kind: row.kind,
      walletId: row.walletId,
      creditCardId: null,
      creditCardBillId: null,
    };
  });
}
