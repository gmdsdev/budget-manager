import { useApiMutation } from "@/hooks/use-api-mutation";
import { trpc } from "@/utils/trpc";
import type { DeleteWalletDto, WalletFormDto } from "@budget-manager/schemas";

const WALLET_INVALIDATIONS = [
  trpc.wallet.getAll.queryFilter(),
  // The select inputs read from `options`, not the paged list.
  trpc.wallet.options.queryFilter(),
  // An opening balance and an archive flag both move the transaction totals.
  trpc.transaction.summary.queryFilter(),
  trpc.dashboard.getSummary.queryFilter(),
];

export function useCreateWalletMutation() {
  return useApiMutation<unknown, WalletFormDto>({
    mutationFn: trpc.wallet.create.mutationOptions().mutationFn,
    successMessage: "Wallet created successfully",
    invalidateQueries: WALLET_INVALIDATIONS,
  });
}

export function useUpdateWalletMutation() {
  return useApiMutation<unknown, WalletFormDto & { id: string }>({
    mutationFn: trpc.wallet.update.mutationOptions().mutationFn,
    successMessage: "Wallet updated successfully",
    invalidateQueries: WALLET_INVALIDATIONS,
  });
}

export function useArchiveWalletMutation() {
  return useApiMutation<unknown, DeleteWalletDto>({
    mutationFn: trpc.wallet.archive.mutationOptions().mutationFn,
    successMessage: "Wallet archived",
    invalidateQueries: WALLET_INVALIDATIONS,
  });
}

export function useUnarchiveWalletMutation() {
  return useApiMutation<unknown, DeleteWalletDto>({
    mutationFn: trpc.wallet.unarchive.mutationOptions().mutationFn,
    successMessage: "Wallet restored",
    invalidateQueries: WALLET_INVALIDATIONS,
  });
}

export function useDeleteWalletMutation() {
  return useApiMutation<unknown, DeleteWalletDto>({
    mutationFn: trpc.wallet.delete.mutationOptions().mutationFn,
    successMessage: "Wallet deleted successfully",
    invalidateQueries: WALLET_INVALIDATIONS,
  });
}
