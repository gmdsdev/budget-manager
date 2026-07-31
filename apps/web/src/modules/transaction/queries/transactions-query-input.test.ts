import {
  FILTER_NONE,
  TransactionKind,
  TransactionRepeats,
  TransactionStatus,
} from "@budget-manager/schemas";
import { currentMonthRange } from "@budget-manager/ui/lib/date-range";
import { describe, expect, test } from "bun:test";

import { PAGE_SIZE } from "@/lib/pagination";
import {
  cardAccountValue,
  defaultTransactionFilters,
  isTransactionFiltered,
  parseAccountValue,
  TRANSACTION_FILTER_ALL,
  walletAccountValue,
  type TransactionFiltersState,
} from "../types";
import { transactionSummaryQueryInput } from "./use-transaction-summary-query";
import { transactionsQueryInput } from "./use-transactions-query";

const DEFAULT_FILTERS = defaultTransactionFilters();

const CURRENT_MONTH = currentMonthRange();

const FIRST_PAGE = {
  limit: PAGE_SIZE,
  offset: 0,
  dateFrom: CURRENT_MONTH.from,
  dateTo: CURRENT_MONTH.to,
};

const WALLET_ID = "aeb0f2c2-0d4c-4f14-9b2b-2b6e63b4dcb5";

const CARD_ID = "1f0f0b2e-6b3c-4c2a-9d51-6a1b2c3d4e5f";

describe("defaultTransactionFilters", () => {
  test("opens on the month the given day falls in", () => {
    const filters = defaultTransactionFilters(new Date(2026, 1, 14));

    expect(filters.dateFrom).toBe("2026-02-01");
    expect(filters.dateTo).toBe("2026-02-28");
  });

  test("leaves every other column unfiltered", () => {
    expect(defaultTransactionFilters()).toMatchObject({
      search: "",
      accountId: TRANSACTION_FILTER_ALL,
      categoryId: TRANSACTION_FILTER_ALL,
      kind: TRANSACTION_FILTER_ALL,
      repeats: TRANSACTION_FILTER_ALL,
      status: TRANSACTION_FILTER_ALL,
    });
  });
});

describe("transactionsQueryInput", () => {
  test("sends the current month and pagination for the default state", () => {
    expect(transactionsQueryInput(DEFAULT_FILTERS)).toEqual(FIRST_PAGE);
  });

  test("matches the loader input when nothing is filtered", () => {
    expect(transactionsQueryInput(DEFAULT_FILTERS)).toEqual(
      transactionsQueryInput(),
    );
  });

  test("still sends a range when the state carries none", () => {
    expect(
      transactionsQueryInput({
        ...DEFAULT_FILTERS,
        dateFrom: "",
        dateTo: "",
      }),
    ).toEqual(FIRST_PAGE);
  });

  test("sends the picked range instead of the current month", () => {
    expect(
      transactionsQueryInput({
        ...DEFAULT_FILTERS,
        dateFrom: "2026-01-01",
        dateTo: "2026-03-31",
      }),
    ).toEqual({
      ...FIRST_PAGE,
      dateFrom: "2026-01-01",
      dateTo: "2026-03-31",
    });
  });

  test("drops the sentinel values and keeps real filters", () => {
    const input = transactionsQueryInput({
      ...DEFAULT_FILTERS,
      kind: TransactionKind.EXPENSE,
      status: TransactionStatus.PAID,
    });

    expect(input).toEqual({
      ...FIRST_PAGE,
      kind: TransactionKind.EXPENSE,
      status: TransactionStatus.PAID,
    });
  });

  test("sends a wallet choice as walletId and a card choice as creditCardId", () => {
    expect(
      transactionsQueryInput({
        ...DEFAULT_FILTERS,
        accountId: walletAccountValue(WALLET_ID),
      }),
    ).toEqual({ ...FIRST_PAGE, walletId: WALLET_ID });

    expect(
      transactionsQueryInput({
        ...DEFAULT_FILTERS,
        accountId: cardAccountValue(CARD_ID),
      }),
    ).toEqual({ ...FIRST_PAGE, creditCardId: CARD_ID });
  });

  test("passes the uncategorized sentinel through untouched", () => {
    expect(
      transactionsQueryInput({
        ...DEFAULT_FILTERS,
        categoryId: FILTER_NONE,
      }),
    ).toEqual({ ...FIRST_PAGE, categoryId: FILTER_NONE });
  });

  test("sends the search term and the repeats choice", () => {
    expect(
      transactionsQueryInput({
        ...DEFAULT_FILTERS,
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
    expect(transactionsQueryInput(DEFAULT_FILTERS, 1).offset).toBe(0);
    expect(transactionsQueryInput(DEFAULT_FILTERS, 2).offset).toBe(PAGE_SIZE);
    expect(transactionsQueryInput(DEFAULT_FILTERS, 3).offset).toBe(
      PAGE_SIZE * 2,
    );
  });

  test("keeps filters and pagination together on later pages", () => {
    const input = transactionsQueryInput(
      { ...DEFAULT_FILTERS, kind: TransactionKind.INCOME },
      2,
    );

    expect(input).toEqual({
      ...FIRST_PAGE,
      offset: PAGE_SIZE,
      kind: TransactionKind.INCOME,
    });
  });
});

describe("transactionSummaryQueryInput", () => {
  test("carries the filters without any pagination", () => {
    expect(transactionSummaryQueryInput(DEFAULT_FILTERS)).toEqual({
      dateFrom: CURRENT_MONTH.from,
      dateTo: CURRENT_MONTH.to,
    });
  });

  test("matches the loader input when nothing is filtered", () => {
    expect(transactionSummaryQueryInput(DEFAULT_FILTERS)).toEqual(
      transactionSummaryQueryInput(),
    );
  });

  test("is the list input minus limit and offset, so paging never refetches it", () => {
    const filters: TransactionFiltersState = {
      ...DEFAULT_FILTERS,
      search: "coffee",
      kind: TransactionKind.EXPENSE,
      accountId: walletAccountValue(WALLET_ID),
    };

    const { limit: _limit, offset: _offset, ...listInput } =
      transactionsQueryInput(filters, 3);

    expect(transactionSummaryQueryInput(filters)).toEqual(listInput);
  });
});

describe("isTransactionFiltered", () => {
  test("is false for the default state", () => {
    expect(isTransactionFiltered(DEFAULT_FILTERS)).toBe(false);
  });

  test("is false again after a filter is reset to its sentinel", () => {
    expect(
      isTransactionFiltered({
        ...DEFAULT_FILTERS,
        accountId: TRANSACTION_FILTER_ALL,
      }),
    ).toBe(false);
  });

  test("is true once a filter is set", () => {
    expect(
      isTransactionFiltered({
        ...DEFAULT_FILTERS,
        accountId: walletAccountValue(WALLET_ID),
      }),
    ).toBe(true);
  });

  test("is true for a search term", () => {
    expect(isTransactionFiltered({ ...DEFAULT_FILTERS, search: "coffee" })).toBe(
      true,
    );
  });

  test("is true for a range other than the current month", () => {
    expect(
      isTransactionFiltered({
        ...DEFAULT_FILTERS,
        dateFrom: "2026-01-01",
        dateTo: "2026-03-31",
      }),
    ).toBe(true);
  });

  test("is true for every filter the bar exposes", () => {
    const set: TransactionFiltersState[] = [
      { ...DEFAULT_FILTERS, search: "coffee" },
      { ...DEFAULT_FILTERS, accountId: cardAccountValue(CARD_ID) },
      { ...DEFAULT_FILTERS, categoryId: FILTER_NONE },
      { ...DEFAULT_FILTERS, kind: TransactionKind.EXPENSE },
      { ...DEFAULT_FILTERS, repeats: TransactionRepeats.RECURRING },
      { ...DEFAULT_FILTERS, status: TransactionStatus.PAID },
      { ...DEFAULT_FILTERS, dateFrom: "2020-07-01", dateTo: "2020-07-31" },
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
