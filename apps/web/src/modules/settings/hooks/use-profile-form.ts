import { type ProfileFormDto, ProfileFormSchema } from "@budget-manager/schemas";
import { revalidateLogic, useForm } from "@tanstack/react-form";

export function useProfileForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (values: ProfileFormDto) => Promise<unknown>;
  defaultValues: ProfileFormDto;
}) {
  return useForm({
    defaultValues,
    onSubmit: ({ value }) => onSubmit(value),
    validationLogic: revalidateLogic({
      mode: "change",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: ProfileFormSchema,
    },
  });
}

export type UseProfileFormReturnType = ReturnType<typeof useProfileForm>;
