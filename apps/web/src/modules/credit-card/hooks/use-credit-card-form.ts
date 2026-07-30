import {
  type CreditCardFormDto,
  CreditCardFormSchema,
} from "@budget-manager/schemas";
import { revalidateLogic, useForm } from "@tanstack/react-form";

export function useCreditCardForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (values: CreditCardFormDto) => Promise<unknown>;
  defaultValues: CreditCardFormDto;
}) {
  return useForm({
    defaultValues,
    onSubmit: ({ value }) => onSubmit(value),
    // One validation cause only — see CLAUDE.md on forms.
    validationLogic: revalidateLogic({
      mode: "change",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: CreditCardFormSchema,
    },
  });
}

export type UseCreditCardFormReturnType = ReturnType<typeof useCreditCardForm>;
