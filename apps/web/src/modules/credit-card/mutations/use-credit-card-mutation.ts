import { useApiMutation } from "@/hooks/use-api-mutation";
import { trpc } from "@/utils/trpc";
import type {
  CreditCardFormDto,
  DeleteCreditCardDto,
} from "@budget-manager/schemas";

const CREDIT_CARD_INVALIDATIONS = [
  trpc.creditCard.getAll.queryFilter(),
  trpc.creditCard.options.queryFilter(),
  trpc.dashboard.getSummary.queryFilter(),
];

export function useCreateCreditCardMutation() {
  return useApiMutation<unknown, CreditCardFormDto>({
    mutationFn: trpc.creditCard.create.mutationOptions().mutationFn,
    successMessage: "Card created successfully",
    invalidateQueries: CREDIT_CARD_INVALIDATIONS,
  });
}

export function useUpdateCreditCardMutation() {
  return useApiMutation<unknown, CreditCardFormDto & { id: string }>({
    mutationFn: trpc.creditCard.update.mutationOptions().mutationFn,
    successMessage: "Card updated successfully",
    invalidateQueries: CREDIT_CARD_INVALIDATIONS,
  });
}

export function useArchiveCreditCardMutation() {
  return useApiMutation<unknown, DeleteCreditCardDto>({
    mutationFn: trpc.creditCard.archive.mutationOptions().mutationFn,
    successMessage: "Card archived",
    invalidateQueries: CREDIT_CARD_INVALIDATIONS,
  });
}

export function useUnarchiveCreditCardMutation() {
  return useApiMutation<unknown, DeleteCreditCardDto>({
    mutationFn: trpc.creditCard.unarchive.mutationOptions().mutationFn,
    successMessage: "Card restored",
    invalidateQueries: CREDIT_CARD_INVALIDATIONS,
  });
}

export function useDeleteCreditCardMutation() {
  return useApiMutation<unknown, DeleteCreditCardDto>({
    mutationFn: trpc.creditCard.delete.mutationOptions().mutationFn,
    successMessage: "Card deleted successfully",
    invalidateQueries: CREDIT_CARD_INVALIDATIONS,
  });
}
