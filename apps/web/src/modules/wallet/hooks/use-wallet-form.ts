import {
  WalletFormDto,
  WalletFormSchema,
  WalletDto,
  WalletType,
} from "@budget-manager/schemas";
import { useForm } from "@tanstack/react-form";

export function useWalletForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (values: WalletFormDto) => void;
  defaultValues: WalletFormDto;
}) {
  return useForm({
    defaultValues,
    onSubmit: ({ value }) => onSubmit(value),
    validators: {
      onSubmit: WalletFormSchema,
    },
  });
}

export type UseWalletFormReturnType = ReturnType<typeof useWalletForm>;
