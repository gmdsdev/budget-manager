import {
  type LanguageFormDto,
  LanguageFormSchema,
} from "@budget-manager/schemas";
import { revalidateLogic, useForm } from "@tanstack/react-form";

export function useLanguageForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (values: LanguageFormDto) => Promise<unknown>;
  defaultValues: LanguageFormDto;
}) {
  return useForm({
    defaultValues,
    onSubmit: ({ value }) => onSubmit(value),
    validationLogic: revalidateLogic({
      mode: "change",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: LanguageFormSchema,
    },
  });
}

export type UseLanguageFormReturnType = ReturnType<typeof useLanguageForm>;
