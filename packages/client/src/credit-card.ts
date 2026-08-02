import type { MessageKey } from "@budget-manager/i18n";
import { FILTER_ALL, type WalletCurrency } from "@budget-manager/schemas";

import { PAGE_SIZE, toOffset } from "./pagination";

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

/** The minimal row a picker reads. Never sourced from the paged list. */
export type CreditCardOption = {
  id: string;
  name: string;
  currencyCode: string;
};

export type CreditCardsQueryInput = {
  search?: string;
  currencyCode?: WalletCurrency;
  defaultBillingWalletId?: string;
  limit: number;
  offset: number;
};

/**
 * The sentinel values are dropped here and nowhere else. Called with no arguments
 * by a route loader, so it has to work bare.
 */
export function creditCardsQueryInput(
  filters?: CreditCardFiltersState,
  page = 1,
): CreditCardsQueryInput {
  const input: CreditCardsQueryInput = {
    limit: PAGE_SIZE,
    offset: toOffset(page),
  };

  if (!filters) {
    return input;
  }

  if (filters.search) {
    input.search = filters.search;
  }

  if (filters.currencyCode !== CREDIT_CARD_FILTER_ALL) {
    input.currencyCode = filters.currencyCode;
  }

  if (filters.defaultBillingWalletId !== CREDIT_CARD_FILTER_ALL) {
    input.defaultBillingWalletId = filters.defaultBillingWalletId;
  }

  return input;
}

/**
 * A statement's status is derived, never stored: `paid` once it is covered in full,
 * otherwise `awaiting_payment` after it closes, else `open`.
 */
export type BillStatus = "open" | "awaiting_payment" | "paid";

/** The catalog key each status reads as, resolved by the component that shows it. */
export const BILL_STATUS_KEYS = {
  open: "creditCard.bills.status.open",
  awaiting_payment: "creditCard.bills.status.awaiting_payment",
  paid: "creditCard.bills.status.paid",
} as const satisfies Record<BillStatus, MessageKey>;
