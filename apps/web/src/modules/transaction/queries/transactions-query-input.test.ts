import {
  FILTER_NONE,
  TransactionKind,
  TransactionRepeats,
  TransactionStatus,
} from "@budget-manager/schemas";
import { describe, expect, test } from "bun:test";

import { PAGE_SIZE } from "@/lib/pagination";
import {
  cardAccountValue,
  EMPTY_TRANSACTION_FILTERS,
  isTransactionFiltered,
  parseAccountValue,
  TRANSACTION_FILTER_ALL,
  walletAccountValue,
  type TransactionFiltersState,
} from "../types";
import { transactionsQueryInput } from "./use-transactions-query";

const FIRST_PAGE = { limit: PAGE_SIZE, offset: 0 };

const WALLET_ID = "aeb0f2c2-0d4c-4f14-9b2b-2b6e63b4dcb5";

const CARD_ID = "1f0f0b2e-6b3c-4c2a-9d51-6a1b2c3d4e5f";

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

  test("sends a wallet choice as walletId and a card choice as creditCardId", () => {
    expect(
      transactionsQueryInput({
        ...EMPTY_TRANSACTION_FILTERS,
        accountId: walletAccountValue(WALLET_ID),
      }),
    ).toEqual({ ...FIRST_PAGE, walletId: WALLET_ID });

    expect(
      transactionsQueryInput({
        ...EMPTY_TRANSACTION_FILTERS,
        accountId: cardAccountValue(CARD_ID),
      }),
    ).toEqual({ ...FIRST_PAGE, creditCardId: CARD_ID });
  });

  test("passes the uncategorized sentinel through untouched", () => {
    expect(
      transactionsQueryInput({
        ...EMPTY_TRANSACTION_FILTERS,
        categoryId: FILTER_NONE,
      }),
    ).toEqual({ ...FIRST_PAGE, categoryId: FILTER_NONE });
  });

  test("sends the search term and the repeats choice", () => {
    expect(
      transactionsQueryInput({
        ...EMPTY_TRANSACTION_FILTERS,
        search: "coffee",
        repeats: TransactionRepeats.RECURRING,
      }),
    ).toEqual({
      ...FIRST_PAGE,
      search: "coffee",
      repeats: TransactionRepeats.RECURRING,
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
        accountId: walletAccountValue(WALLET_ID),
      }),
    ).toBe(true);
  });

  test("is true for a search term", () => {
    expect(
      isTransactionFiltered({ ...EMPTY_TRANSACTION_FILTERS, search: "coffee" }),
    ).toBe(true);
  });

  test("is true for every filter the bar exposes", () => {
    const set: TransactionFiltersState[] = [
      { ...EMPTY_TRANSACTION_FILTERS, search: "coffee" },
      { ...EMPTY_TRANSACTION_FILTERS, accountId: cardAccountValue(CARD_ID) },
      { ...EMPTY_TRANSACTION_FILTERS, categoryId: FILTER_NONE },
      { ...EMPTY_TRANSACTION_FILTERS, kind: TransactionKind.EXPENSE },
      { ...EMPTY_TRANSACTION_FILTERS, repeats: TransactionRepeats.RECURRING },
      { ...EMPTY_TRANSACTION_FILTERS, status: TransactionStatus.PAID },
      { ...EMPTY_TRANSACTION_FILTERS, dateFrom: "2026-07-01" },
      { ...EMPTY_TRANSACTION_FILTERS, dateTo: "2026-07-31" },
    ];

    expect(set.every(isTransactionFiltered)).toBe(true);
  });
});

describe("parseAccountValue", () => {
  test("routes a wallet choice to walletId", () => {
    expect(parseAccountValue(walletAccountValue(WALLET_ID))).toEqual({
      walletId: WALLET_ID,
    });
  });

  test("routes a card choice to creditCardId", () => {
    expect(parseAccountValue(cardAccountValue(CARD_ID))).toEqual({
      creditCardId: CARD_ID,
    });
  });

  test("resolves an unprefixed value to neither", () => {
    expect(parseAccountValue(TRANSACTION_FILTER_ALL)).toEqual({});
  });
});
