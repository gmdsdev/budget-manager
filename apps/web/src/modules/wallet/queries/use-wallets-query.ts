import { PAGE_SIZE, toOffset } from "@/lib/pagination";
import { trpc } from "@/utils/trpc";
import type { WalletType } from "@budget-manager/schemas";
import { useQuery } from "@tanstack/react-query";
import type { WalletRow } from "../types";

export function walletsQueryInput(page = 1) {
  return { limit: PAGE_SIZE, offset: toOffset(page) };
}

export function useWalletsQuery(page = 1) {
  return useQuery({
    ...trpc.wallet.getAll.queryOptions(walletsQueryInput(page)),
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
