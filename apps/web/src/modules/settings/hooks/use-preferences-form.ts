import {
  type PreferencesFormDto,
  PreferencesFormSchema,
} from "@budget-manager/schemas";
import { revalidateLogic, useForm } from "@tanstack/react-form";

export function usePreferencesForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (values: PreferencesFormDto) => Promise<unknown>;
  defaultValues: PreferencesFormDto;
}) {
  return useForm({
    defaultValues,
    onSubmit: ({ value }) => onSubmit(value),
    validationLogic: revalidateLogic({
      mode: "change",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: PreferencesFormSchema,
    },
  });
}

export type UsePreferencesFormReturnType = ReturnType<typeof usePreferencesForm>;
