import { PAGE_SIZE, toOffset } from "@/lib/pagination";
import { trpc } from "@/utils/trpc";
import type { WalletCurrency, WalletType } from "@budget-manager/schemas";
import { useQuery } from "@tanstack/react-query";
import {
  WALLET_FILTER_ALL,
  type WalletFiltersState,
  type WalletRow,
} from "../types";

type WalletsQueryInput = {
  search?: string;
  type?: WalletType;
  currencyCode?: WalletCurrency;
  limit: number;
  offset: number;
};

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

export function useWalletsQuery(filters?: WalletFiltersState, page = 1) {
  return useQuery({
    ...trpc.wallet.getAll.queryOptions(walletsQueryInput(filters, page)),
    select: (data) => ({
      total: data.total,
      rows: data.rows.map(
        (row): WalletRow => ({
          ...row,
          type: row.type as WalletType,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }),
      ),
    }),
  });
}
