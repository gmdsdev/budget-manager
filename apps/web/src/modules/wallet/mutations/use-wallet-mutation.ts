import { useApiMutation } from "@/hooks/use-api-mutation";
import { trpc } from "@/utils/trpc";
import { t } from "@budget-manager/i18n";
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
    successMessage: t("wallet.toast.created"),
    invalidateQueries: WALLET_INVALIDATIONS,
  });
}

export function useUpdateWalletMutation() {
  return useApiMutation<unknown, WalletFormDto & { id: string }>({
    mutationFn: trpc.wallet.update.mutationOptions().mutationFn,
    successMessage: t("wallet.toast.updated"),
    invalidateQueries: WALLET_INVALIDATIONS,
  });
}

export function useArchiveWalletMutation() {
  return useApiMutation<unknown, DeleteWalletDto>({
    mutationFn: trpc.wallet.archive.mutationOptions().mutationFn,
    successMessage: t("wallet.toast.archived"),
    invalidateQueries: WALLET_INVALIDATIONS,
  });
}

export function useUnarchiveWalletMutation() {
  return useApiMutation<unknown, DeleteWalletDto>({
    mutationFn: trpc.wallet.unarchive.mutationOptions().mutationFn,
    successMessage: t("wallet.toast.restored"),
    invalidateQueries: WALLET_INVALIDATIONS,
  });
}

export function useDeleteWalletMutation() {
  return useApiMutation<unknown, DeleteWalletDto>({
    mutationFn: trpc.wallet.delete.mutationOptions().mutationFn,
    successMessage: t("wallet.toast.deleted"),
    invalidateQueries: WALLET_INVALIDATIONS,
  });
}
