import {
  type CardPaymentFormDto,
  CardPaymentFormSchema,
} from "@budget-manager/schemas";
import { revalidateLogic, useForm } from "@tanstack/react-form";

export function useCardPaymentForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (values: CardPaymentFormDto) => Promise<unknown>;
  defaultValues: CardPaymentFormDto;
}) {
  return useForm({
    defaultValues,
    onSubmit: ({ value }) => onSubmit(value),
    validationLogic: revalidateLogic({
      mode: "change",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: CardPaymentFormSchema,
    },
  });
}

export type UseCardPaymentFormReturnType = ReturnType<
  typeof useCardPaymentForm
>;
