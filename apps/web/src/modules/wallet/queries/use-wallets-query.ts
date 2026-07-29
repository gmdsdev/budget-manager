import { trpc } from "@/utils/trpc";
import type { WalletType } from "@budget-manager/schemas";
import { useQuery } from "@tanstack/react-query";
import type { WalletRow } from "../types";

export function useWalletsQuery() {
  return useQuery({
    ...trpc.wallet.getAll.queryOptions(),
    select: (rows): WalletRow[] =>
      rows.map((row) => ({
        ...row,
        type: row.type as WalletType,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })),
  });
}
