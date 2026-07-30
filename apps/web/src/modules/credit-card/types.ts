import { FILTER_ALL, type WalletCurrency } from "@budget-manager/schemas";

export type CreditCardRow = {
  id: string;
  name: string;
  limitCents: number;
  closeDay: number;
  dueDay: number;
  defaultBillingWalletId: string | null;
  defaultBillingWalletName: string | null;
  currencyCode: string;
  isArchived: boolean;
  outstandingCents: number;
  projectedOutstandingCents: number;
  availableCents: number;
  createdAt: Date;
  updatedAt: Date;
};

export const CREDIT_CARD_FILTER_ALL = FILTER_ALL;

export type CreditCardFiltersState = {
  search: string;
  currencyCode: WalletCurrency | typeof CREDIT_CARD_FILTER_ALL;
  defaultBillingWalletId: string;
};

export const EMPTY_CREDIT_CARD_FILTERS: CreditCardFiltersState = {
  search: "",
  currencyCode: CREDIT_CARD_FILTER_ALL,
  defaultBillingWalletId: CREDIT_CARD_FILTER_ALL,
};

export function isCreditCardFiltered(filters: CreditCardFiltersState) {
  return (
    filters.search !== "" ||
    filters.currencyCode !== CREDIT_CARD_FILTER_ALL ||
    filters.defaultBillingWalletId !== CREDIT_CARD_FILTER_ALL
  );
}
