import { useApiMutation } from "@/hooks/use-api-mutation";
import { trpc } from "@/utils/trpc";
import type { DeleteWalletDto, WalletFormDto } from "@budget-manager/schemas";

export function useCreateWalletMutation() {
  return useApiMutation<unknown, WalletFormDto>({
    mutationFn: trpc.wallet.create.mutationOptions().mutationFn,
    successMessage: "Wallet created successfully",
    invalidateQueries: trpc.wallet.getAll.queryFilter(),
  });
}

export function useUpdateWalletMutation() {
  return useApiMutation<unknown, WalletFormDto & { id: string }>({
    mutationFn: trpc.wallet.update.mutationOptions().mutationFn,
    successMessage: "Wallet updated successfully",
    invalidateQueries: trpc.wallet.getAll.queryFilter(),
  });
}

export function useArchiveWalletMutation() {
  return useApiMutation<unknown, DeleteWalletDto>({
    mutationFn: trpc.wallet.archive.mutationOptions().mutationFn,
    successMessage: "Wallet archived",
    invalidateQueries: trpc.wallet.getAll.queryFilter(),
  });
}

export function useUnarchiveWalletMutation() {
  return useApiMutation<unknown, DeleteWalletDto>({
    mutationFn: trpc.wallet.unarchive.mutationOptions().mutationFn,
    successMessage: "Wallet restored",
    invalidateQueries: trpc.wallet.getAll.queryFilter(),
  });
}

export function useDeleteWalletMutation() {
  return useApiMutation<unknown, DeleteWalletDto>({
    mutationFn: trpc.wallet.delete.mutationOptions().mutationFn,
    successMessage: "Wallet deleted successfully",
    invalidateQueries: trpc.wallet.getAll.queryFilter(),
  });
}
