import { CreateWalletSchema, WalletType } from "@budget-manager/schemas";
import { useForm } from "@tanstack/react-form";

export function useAccountForm() {
  return useForm({
    defaultValues: {
      name: "",
      type: WalletType.CASH,
      currency: "USD",
      balance: 0,
    },
    onSubmit: (values) => {
      console.log(values);
    },
    validators: {
      onChange: CreateWalletSchema,
    },
  });
}

export type UseAccountFormReturnType = ReturnType<typeof useAccountForm>;
