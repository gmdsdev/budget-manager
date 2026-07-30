import {
  type TransactionFormDto,
  TransactionFormSchema,
} from "@budget-manager/schemas";
import { revalidateLogic, useForm } from "@tanstack/react-form";

export function useTransactionForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (values: TransactionFormDto) => Promise<unknown>;
  defaultValues: TransactionFormDto;
}) {
  return useForm({
    defaultValues,
    onSubmit: ({ value }) => onSubmit(value),
    // One validation cause only. TanStack keys errors by cause, so mixing
    // onBlur with onChange strands blur-sourced errors until the next blur —
    // which Base UI selects never fire, leaving the form unsubmittable.
    validationLogic: revalidateLogic({
      mode: "change",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: TransactionFormSchema,
    },
  });
}

export type UseTransactionFormReturnType = ReturnType<
  typeof useTransactionForm
>;
