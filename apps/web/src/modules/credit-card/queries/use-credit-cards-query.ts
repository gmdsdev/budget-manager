import { PAGE_SIZE, toOffset } from "@/lib/pagination";
import { trpc } from "@/utils/trpc";
import type { WalletCurrency } from "@budget-manager/schemas";
import { useQuery } from "@tanstack/react-query";
import {
  CREDIT_CARD_FILTER_ALL,
  type CreditCardFiltersState,
  type CreditCardRow,
} from "../types";

type CreditCardsQueryInput = {
  search?: string;
  currencyCode?: WalletCurrency;
  defaultBillingWalletId?: string;
  limit: number;
  offset: number;
};

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

export function useCreditCardsQuery(
  filters?: CreditCardFiltersState,
  page = 1,
) {
  return useQuery({
    ...trpc.creditCard.getAll.queryOptions(creditCardsQueryInput(filters, page)),
    select: (data) => ({
      total: data.total,
      rows: data.rows.map(
        (row): CreditCardRow => ({
          ...row,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }),
      ),
    }),
  });
}
