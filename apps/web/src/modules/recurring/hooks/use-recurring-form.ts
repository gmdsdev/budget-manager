import {
  type RecurringFormDto,
  RecurringFormSchema,
} from "@budget-manager/schemas";
import { revalidateLogic, useForm } from "@tanstack/react-form";

export function useRecurringForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (values: RecurringFormDto) => Promise<unknown>;
  defaultValues: RecurringFormDto;
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
      onDynamic: RecurringFormSchema,
    },
  });
}

export type UseRecurringFormReturnType = ReturnType<typeof useRecurringForm>;
