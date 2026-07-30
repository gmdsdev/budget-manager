import { trpc } from "@/utils/trpc";
import type { TransactionKind } from "@budget-manager/schemas";
import { useQuery } from "@tanstack/react-query";

export type TransferLeg = {
  id: string;
  kind: TransactionKind;
  walletId: string | null;
};

export function useTransferQuery(transferGroupId: string) {
  return useQuery({
    ...trpc.transaction.getTransfer.queryOptions({ transferGroupId }),
    select: (rows): TransferLeg[] =>
      rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        walletId: row.walletId,
      })),
  });
}
