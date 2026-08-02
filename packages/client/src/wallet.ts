import {
  FILTER_ALL,
  type WalletCurrency,
  type WalletType,
} from "@budget-manager/schemas";

import { PAGE_SIZE, toOffset } from "./pagination";

export type WalletRow = {
  id: string;
  name: string;
  type: WalletType;
  openingBalanceCents: number;
  balanceCents: number;
  projectedBalanceCents: number;
  currencyCode: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** The minimal row a picker reads. Never sourced from the paged list. */
export type WalletOption = {
  id: string;
  name: string;
  currencyCode: string;
};

export const WALLET_FILTER_ALL = FILTER_ALL;

export type WalletFiltersState = {
  search: string;
  type: WalletType | typeof WALLET_FILTER_ALL;
  currencyCode: WalletCurrency | typeof WALLET_FILTER_ALL;
};

export const EMPTY_WALLET_FILTERS: WalletFiltersState = {
  search: "",
  type: WALLET_FILTER_ALL,
  currencyCode: WALLET_FILTER_ALL,
};

export function isWalletFiltered(filters: WalletFiltersState) {
  return (
    filters.search !== "" ||
    filters.type !== WALLET_FILTER_ALL ||
    filters.currencyCode !== WALLET_FILTER_ALL
  );
}

export type WalletsQueryInput = {
  search?: string;
  type?: WalletType;
  currencyCode?: WalletCurrency;
  limit: number;
  offset: number;
};

/**
 * The sentinel values are dropped here and nowhere else. Called with no arguments
 * by a route loader, so it has to work bare.
 */
export function walletsQueryInput(
  filters?: WalletFiltersState,
  page = 1,
): WalletsQueryInput {
  const input: WalletsQueryInput = {
    limit: PAGE_SIZE,
    offset: toOffset(page),
  };

  if (!filters) {
    return input;
  }

  if (filters.search) {
    input.search = filters.search;
  }

  if (filters.type !== WALLET_FILTER_ALL) {
    input.type = filters.type;
  }

  if (filters.currencyCode !== WALLET_FILTER_ALL) {
    input.currencyCode = filters.currencyCode;
  }

  return input;
}
