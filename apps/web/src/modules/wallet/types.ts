import {
  FILTER_ALL,
  type WalletCurrency,
  type WalletType,
} from "@budget-manager/schemas";

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
