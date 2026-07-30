import {
  type CategoryColor,
  FILTER_ALL,
  type TransactionKind,
  type TransactionRepeats,
  type TransactionStatus,
} from "@budget-manager/schemas";
import { currentMonthRange } from "@budget-manager/ui/lib/date-range";

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
