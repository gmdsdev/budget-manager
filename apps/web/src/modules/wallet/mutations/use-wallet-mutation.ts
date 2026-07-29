import { useApiMutation } from "@/hooks/use-api-mutation";
import { trpc } from "@/utils/trpc";
import { CreateWalletDto, DeleteWalletDto } from "@budget-manager/schemas";

export function useCreateWalletMutation() {
  return useApiMutation<unknown, CreateWalletDto>({
    mutationFn: trpc.wallet.create.mutationOptions().mutationFn,
    successMessage: "Wallet created successfully",
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
