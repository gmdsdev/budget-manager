import {
  type CategoryColor,
  FILTER_ALL,
  type TransactionKind,
  type TransactionRepeats,
  type TransactionStatus,
} from "@budget-manager/schemas";
import { currentMonthRange } from "./date-range";
import { PAGE_SIZE, toOffset } from "./pagination";

export type TransactionRow = {
  id: string;
  kind: TransactionKind;
  status: TransactionStatus;
  name: string;
  amountCents: number;
  occurrenceDate: string;
  walletId: string | null;
  walletName: string | null;
  walletCurrencyCode: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: CategoryColor | null;
  creditCardId: string | null;
  creditCardName: string | null;
  creditCardBillId: string | null;
  templateId: string | null;
  recurrenceType: string | null;
  recurrenceInterval: number | null;
  recurrenceInstallments: number | null;
  transferGroupId: string | null;
  notes: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * One currency's figures under the list. `balanceCents` covers every wallet as
 * of the range end; the income and expense figures cover exactly the rows the
 * filters matched.
 */
export type TransactionSummaryRow = {
  currencyCode: string;
  balanceCents: number;
  projectedBalanceCents: number;
  incomeCents: number;
  projectedIncomeCents: number;
  expenseCents: number;
  projectedExpenseCents: number;
  netCents: number;
  projectedNetCents: number;
};

export const TRANSACTION_FILTER_ALL = FILTER_ALL;

export const TRANSACTION_CATEGORY_NONE = "none";

const WALLET_ACCOUNT_PREFIX = "wallet:";

const CARD_ACCOUNT_PREFIX = "card:";

/**
 * The Account column shows whichever account owns the row, so its filter has to
 * span both tables. Wallet and card ids are drawn from different tables, so the
 * select value carries which one it is rather than leaving the server to guess.
 */
export function walletAccountValue(walletId: string) {
  return `${WALLET_ACCOUNT_PREFIX}${walletId}`;
}

export function cardAccountValue(creditCardId: string) {
  return `${CARD_ACCOUNT_PREFIX}${creditCardId}`;
}

export function parseAccountValue(value: string): {
  walletId?: string;
  creditCardId?: string;
} {
  if (value.startsWith(WALLET_ACCOUNT_PREFIX)) {
    return { walletId: value.slice(WALLET_ACCOUNT_PREFIX.length) };
  }

  if (value.startsWith(CARD_ACCOUNT_PREFIX)) {
    return { creditCardId: value.slice(CARD_ACCOUNT_PREFIX.length) };
  }

  return {};
}

export type TransactionFiltersState = {
  search: string;
  accountId: string;
  categoryId: string;
  kind: TransactionKind | typeof TRANSACTION_FILTER_ALL;
  repeats: TransactionRepeats | typeof TRANSACTION_FILTER_ALL;
  status: TransactionStatus | typeof TRANSACTION_FILTER_ALL;
  dateFrom: string;
  dateTo: string;
};

/**
 * The list is always scoped to a date range, so the unset state is the current
 * month rather than "no dates" — an all-time ledger is neither what anyone reads
 * nor something pagination can make readable.
 */
export function defaultTransactionFilters(
  today = new Date(),
): TransactionFiltersState {
  const { from, to } = currentMonthRange(today);

  return {
    search: "",
    accountId: TRANSACTION_FILTER_ALL,
    categoryId: TRANSACTION_FILTER_ALL,
    kind: TRANSACTION_FILTER_ALL,
    repeats: TRANSACTION_FILTER_ALL,
    status: TRANSACTION_FILTER_ALL,
    dateFrom: from,
    dateTo: to,
  };
}

export function isTransactionFiltered(filters: TransactionFiltersState) {
  const defaults = defaultTransactionFilters();

  return (
    filters.search !== "" ||
    filters.accountId !== TRANSACTION_FILTER_ALL ||
    filters.categoryId !== TRANSACTION_FILTER_ALL ||
    filters.kind !== TRANSACTION_FILTER_ALL ||
    filters.repeats !== TRANSACTION_FILTER_ALL ||
    filters.status !== TRANSACTION_FILTER_ALL ||
    filters.dateFrom !== defaults.dateFrom ||
    filters.dateTo !== defaults.dateTo
  );
}

export type TransactionFiltersInput = {
  search?: string;
  kind?: TransactionKind;
  status?: TransactionStatus;
  walletId?: string;
  creditCardId?: string;
  categoryId?: string;
  repeats?: TransactionRepeats;
  dateFrom: string;
  dateTo: string;
};

export type TransactionsQueryInput = TransactionFiltersInput & {
  limit: number;
  offset: number;
};

/**
 * Every sentinel is dropped here and nowhere else, so the list and the totals below
 * it can never disagree about what is in scope.
 *
 * The date range is part of every request, so a caller with no filters — a route
 * loader — asks for the same current month the screen opens on, and a range that
 * somehow arrives empty falls back to it instead of listing all time.
 */
export function transactionFiltersInput(
  filters?: TransactionFiltersState,
): TransactionFiltersInput {
  const resolved = filters ?? defaultTransactionFilters();
  const fallback = currentMonthRange();

  const input: TransactionFiltersInput = {
    dateFrom: resolved.dateFrom || fallback.from,
    dateTo: resolved.dateTo || fallback.to,
  };

  if (!filters) {
    return input;
  }

  if (filters.search) {
    input.search = filters.search;
  }

  if (filters.accountId !== TRANSACTION_FILTER_ALL) {
    const { walletId, creditCardId } = parseAccountValue(filters.accountId);

    if (walletId) {
      input.walletId = walletId;
    }

    if (creditCardId) {
      input.creditCardId = creditCardId;
    }
  }

  if (filters.categoryId !== TRANSACTION_FILTER_ALL) {
    input.categoryId = filters.categoryId;
  }

  if (filters.kind !== TRANSACTION_FILTER_ALL) {
    input.kind = filters.kind;
  }

  if (filters.repeats !== TRANSACTION_FILTER_ALL) {
    input.repeats = filters.repeats;
  }

  if (filters.status !== TRANSACTION_FILTER_ALL) {
    input.status = filters.status;
  }

  return input;
}

export function transactionsQueryInput(
  filters?: TransactionFiltersState,
  page = 1,
): TransactionsQueryInput {
  return {
    ...transactionFiltersInput(filters),
    limit: PAGE_SIZE,
    offset: toOffset(page),
  };
}

/**
 * The filters without the page: the totals describe every matching row, so paging
 * the list must not refetch them — and switching pages back and forth keeps hitting
 * the same cache entry.
 */
export function transactionSummaryQueryInput(
  filters?: TransactionFiltersState,
): TransactionFiltersInput {
  return transactionFiltersInput(filters);
}
