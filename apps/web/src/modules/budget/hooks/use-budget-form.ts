import {
  type BudgetFormDto,
  BudgetFormSchema,
} from "@budget-manager/schemas";
import { revalidateLogic, useForm } from "@tanstack/react-form";

export function useBudgetForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (values: BudgetFormDto) => Promise<unknown>;
  defaultValues: BudgetFormDto;
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
      onDynamic: BudgetFormSchema,
    },
  });
}

export type UseBudgetFormReturnType = ReturnType<typeof useBudgetForm>;
