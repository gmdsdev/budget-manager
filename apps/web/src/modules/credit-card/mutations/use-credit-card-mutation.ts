import { useApiMutation } from "@/hooks/use-api-mutation";
import { trpc } from "@/utils/trpc";
import { t } from "@budget-manager/i18n";
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
    successMessage: t("creditCard.toast.created"),
    invalidateQueries: CREDIT_CARD_INVALIDATIONS,
  });
}

export function useUpdateCreditCardMutation() {
  return useApiMutation<unknown, CreditCardFormDto & { id: string }>({
    mutationFn: trpc.creditCard.update.mutationOptions().mutationFn,
    successMessage: t("creditCard.toast.updated"),
    invalidateQueries: CREDIT_CARD_INVALIDATIONS,
  });
}

export function useArchiveCreditCardMutation() {
  return useApiMutation<unknown, DeleteCreditCardDto>({
    mutationFn: trpc.creditCard.archive.mutationOptions().mutationFn,
    successMessage: t("creditCard.toast.archived"),
    invalidateQueries: CREDIT_CARD_INVALIDATIONS,
  });
}

export function useUnarchiveCreditCardMutation() {
  return useApiMutation<unknown, DeleteCreditCardDto>({
    mutationFn: trpc.creditCard.unarchive.mutationOptions().mutationFn,
    successMessage: t("creditCard.toast.restored"),
    invalidateQueries: CREDIT_CARD_INVALIDATIONS,
  });
}

export function useDeleteCreditCardMutation() {
  return useApiMutation<unknown, DeleteCreditCardDto>({
    mutationFn: trpc.creditCard.delete.mutationOptions().mutationFn,
    successMessage: t("creditCard.toast.deleted"),
    invalidateQueries: CREDIT_CARD_INVALIDATIONS,
  });
}
