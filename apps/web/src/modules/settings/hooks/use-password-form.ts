import {
  type ChangePasswordFormDto,
  ChangePasswordFormSchema,
} from "@budget-manager/schemas";
import { revalidateLogic, useForm } from "@tanstack/react-form";

export const EMPTY_PASSWORD_FORM: ChangePasswordFormDto = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function usePasswordForm({
  onSubmit,
}: {
  onSubmit: (values: ChangePasswordFormDto) => Promise<unknown>;
}) {
  return useForm({
    defaultValues: EMPTY_PASSWORD_FORM,
    onSubmit: ({ value }) => onSubmit(value),
    validationLogic: revalidateLogic({
      mode: "change",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: ChangePasswordFormSchema,
    },
  });
}

export type UsePasswordFormReturnType = ReturnType<typeof usePasswordForm>;
