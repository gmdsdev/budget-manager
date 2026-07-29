import { type WalletFormDto, WalletFormSchema } from "@budget-manager/schemas";
import { useForm } from "@tanstack/react-form";

export function useWalletForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (values: WalletFormDto) => Promise<unknown>;
  defaultValues: WalletFormDto;
}) {
  return useForm({
    defaultValues,
    onSubmit: ({ value }) => onSubmit(value),
    validators: {
      onBlur: WalletFormSchema,
      onSubmit: WalletFormSchema,
    },
  });
}

export type UseWalletFormReturnType = ReturnType<typeof useWalletForm>;
