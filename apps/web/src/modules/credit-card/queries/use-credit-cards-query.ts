import { PAGE_SIZE, toOffset } from "@/lib/pagination";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import type { CreditCardRow } from "../types";

export function creditCardsQueryInput(page = 1) {
  return { limit: PAGE_SIZE, offset: toOffset(page) };
}

export function useCreditCardsQuery(page = 1) {
  return useQuery({
    ...trpc.creditCard.getAll.queryOptions(creditCardsQueryInput(page)),
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
