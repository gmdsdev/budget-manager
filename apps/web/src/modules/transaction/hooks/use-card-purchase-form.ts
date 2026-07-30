import {
  type CardPurchaseFormDto,
  CardPurchaseFormSchema,
} from "@budget-manager/schemas";
import { revalidateLogic, useForm } from "@tanstack/react-form";

export function useCardPurchaseForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (values: CardPurchaseFormDto) => Promise<unknown>;
  defaultValues: CardPurchaseFormDto;
}) {
  return useForm({
    defaultValues,
    onSubmit: ({ value }) => onSubmit(value),
    validationLogic: revalidateLogic({
      mode: "change",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: CardPurchaseFormSchema,
    },
  });
}

export type UseCardPurchaseFormReturnType = ReturnType<
  typeof useCardPurchaseForm
>;
