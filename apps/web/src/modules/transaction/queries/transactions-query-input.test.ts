import { TransactionKind, TransactionStatus } from "@budget-manager/schemas";
import { describe, expect, test } from "bun:test";

import { PAGE_SIZE } from "@/lib/pagination";
import { EMPTY_TRANSACTION_FILTERS, isTransactionFiltered } from "../types";
import { transactionsQueryInput } from "./use-transactions-query";

const FIRST_PAGE = { limit: PAGE_SIZE, offset: 0 };

describe("transactionsQueryInput", () => {
  test("sends only pagination for the default state", () => {
    expect(transactionsQueryInput(EMPTY_TRANSACTION_FILTERS)).toEqual(
      FIRST_PAGE,
    );
  });

  test("matches the loader input when nothing is filtered", () => {
    expect(transactionsQueryInput(EMPTY_TRANSACTION_FILTERS)).toEqual(
      transactionsQueryInput(),
    );
  });

  test("drops the sentinel values and keeps real filters", () => {
    const input = transactionsQueryInput({
      ...EMPTY_TRANSACTION_FILTERS,
      kind: TransactionKind.EXPENSE,
      status: TransactionStatus.PAID,
      dateFrom: "2026-07-01",
    });

    expect(input).toEqual({
      ...FIRST_PAGE,
      kind: TransactionKind.EXPENSE,
      status: TransactionStatus.PAID,
      dateFrom: "2026-07-01",
    });
  });

  test("translates the page number into an offset", () => {
    expect(transactionsQueryInput(EMPTY_TRANSACTION_FILTERS, 1).offset).toBe(0);
    expect(transactionsQueryInput(EMPTY_TRANSACTION_FILTERS, 2).offset).toBe(
      PAGE_SIZE,
    );
    expect(transactionsQueryInput(EMPTY_TRANSACTION_FILTERS, 3).offset).toBe(
      PAGE_SIZE * 2,
    );
  });

  test("keeps filters and pagination together on later pages", () => {
    const input = transactionsQueryInput(
      { ...EMPTY_TRANSACTION_FILTERS, kind: TransactionKind.INCOME },
      2,
    );

    expect(input).toEqual({
      limit: PAGE_SIZE,
      offset: PAGE_SIZE,
      kind: TransactionKind.INCOME,
    });
  });
});

describe("isTransactionFiltered", () => {
  test("is false for the default state", () => {
    expect(isTransactionFiltered(EMPTY_TRANSACTION_FILTERS)).toBe(false);
  });

  test("is false again after a filter is reset to its sentinel", () => {
    expect(
      isTransactionFiltered({ ...EMPTY_TRANSACTION_FILTERS, dateTo: "" }),
    ).toBe(false);
  });

  test("is true once a filter is set", () => {
    expect(
      isTransactionFiltered({
        ...EMPTY_TRANSACTION_FILTERS,
        walletId: "aeb0f2c2-0d4c-4f14-9b2b-2b6e63b4dcb5",
      }),
    ).toBe(true);
  });
});
