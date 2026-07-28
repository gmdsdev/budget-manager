import {
  CreateWalletDto,
  CreateWalletSchema,
  WalletType,
} from "@budget-manager/schemas";
import { useForm } from "@tanstack/react-form";

export function useWalletForm({
  onSubmit,
}: {
  onSubmit: (values: CreateWalletDto) => void;
}) {
  const defaultValues: CreateWalletDto = {
    name: "",
    type: WalletType.CHECKING,
    currency: "BRL",
    balance: 0,
  };

  return useForm({
    defaultValues,
    onSubmit: ({ value }) => {
      onSubmit(value);
    },
    validators: {
      onSubmit: CreateWalletSchema,
    },
  });
}

export type UseWalletFormReturnType = ReturnType<typeof useWalletForm>;
