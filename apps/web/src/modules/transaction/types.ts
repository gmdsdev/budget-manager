import type {
  TransactionKind,
  TransactionStatus,
} from "@budget-manager/schemas";

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

export const TRANSACTION_FILTER_ALL = "all";

export const TRANSACTION_CATEGORY_NONE = "none";

export type TransactionFiltersState = {
  kind: TransactionKind | typeof TRANSACTION_FILTER_ALL;
  status: TransactionStatus | typeof TRANSACTION_FILTER_ALL;
  walletId: string;
  categoryId: string;
  dateFrom: string;
  dateTo: string;
};

export const EMPTY_TRANSACTION_FILTERS: TransactionFiltersState = {
  kind: TRANSACTION_FILTER_ALL,
  status: TRANSACTION_FILTER_ALL,
  walletId: TRANSACTION_FILTER_ALL,
  categoryId: TRANSACTION_FILTER_ALL,
  dateFrom: "",
  dateTo: "",
};

export function isTransactionFiltered(filters: TransactionFiltersState) {
  return (
    filters.kind !== TRANSACTION_FILTER_ALL ||
    filters.status !== TRANSACTION_FILTER_ALL ||
    filters.walletId !== TRANSACTION_FILTER_ALL ||
    filters.categoryId !== TRANSACTION_FILTER_ALL ||
    filters.dateFrom !== "" ||
    filters.dateTo !== ""
  );
}
