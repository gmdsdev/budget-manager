import {
  TransactionKind,
  TransactionStatus,
  type ImportTransactionRowDto,
} from "@budget-manager/schemas";
import { describe, expect, test } from "bun:test";
import { buildImportInsertValues, importBillKey } from "./import-values";

const USER_ID = "user-1";
const NOW = new Date("2026-08-05T12:00:00Z");

const WALLET_ROW: ImportTransactionRowDto = {
  target: "wallet",
  kind: TransactionKind.EXPENSE,
  status: TransactionStatus.PAID,
  name: "Groceries",
  amountCents: 15_075,
  occurrenceDate: "2026-08-03",
  walletId: "wallet-1",
  categoryId: "category-1",
  notes: null,
};

const CARD_ROW: ImportTransactionRowDto = {
  target: "card",
  status: TransactionStatus.PAID,
  name: "Streaming subscription",
  amountCents: 2_990,
  occurrenceDate: "2026-08-05",
  creditCardId: "card-1",
  categoryId: null,
  notes: null,
};

describe("buildImportInsertValues", () => {
  test("maps a wallet row to a wallet-owned insert", () => {
    const [value] = buildImportInsertValues({
      userId: USER_ID,
      rows: [WALLET_ROW],
      billIdByCardAndDate: new Map(),
      now: NOW,
    });

    expect(value).toEqual({
      userId: USER_ID,
      kind: TransactionKind.EXPENSE,
      status: TransactionStatus.PAID,
      name: "Groceries",
      amountCents: 15_075,
      occurrenceDate: "2026-08-03",
      walletId: "wallet-1",
      creditCardId: null,
      creditCardBillId: null,
      categoryId: "category-1",
      notes: null,
      paidAt: NOW,
    });
  });

  test("maps a card row to a purchase filed under its date's bill", () => {
    const [value] = buildImportInsertValues({
      userId: USER_ID,
      rows: [CARD_ROW],
      billIdByCardAndDate: new Map([
        [importBillKey("card-1", "2026-08-05"), "bill-1"],
      ]),
      now: NOW,
    });

    expect(value).toEqual({
      userId: USER_ID,
      kind: TransactionKind.CREDIT_CARD_PURCHASE,
      status: TransactionStatus.PAID,
      name: "Streaming subscription",
      amountCents: 2_990,
      occurrenceDate: "2026-08-05",
      walletId: null,
      creditCardId: "card-1",
      creditCardBillId: "bill-1",
      categoryId: null,
      notes: null,
      paidAt: NOW,
    });
  });

  test("the bill lookup is keyed by card as well as date", () => {
    const values = buildImportInsertValues({
      userId: USER_ID,
      rows: [CARD_ROW, { ...CARD_ROW, creditCardId: "card-2" }],
      billIdByCardAndDate: new Map([
        [importBillKey("card-1", "2026-08-05"), "bill-1"],
        [importBillKey("card-2", "2026-08-05"), "bill-2"],
      ]),
      now: NOW,
    });

    expect(values.map((value) => value.creditCardBillId)).toEqual([
      "bill-1",
      "bill-2",
    ]);
  });

  test("a waiting row carries no paidAt", () => {
    const [value] = buildImportInsertValues({
      userId: USER_ID,
      rows: [{ ...WALLET_ROW, status: TransactionStatus.WAITING_PAYMENT }],
      billIdByCardAndDate: new Map(),
      now: NOW,
    });

    expect(value?.paidAt).toBeNull();
  });
});
