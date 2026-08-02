import {
  useCreateWalletMutation,
  usePreferredCurrency,
  useWalletForm,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { WalletType } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { FormSheet } from "@/components/ui/form-sheet";
import { useResetOnOpen } from "@/hooks/use-reset-on-open";

import { WalletFormFields } from "./wallet-form-fields";

export function CreateWalletSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const createMutation = useCreateWalletMutation();
  const preferredCurrency = usePreferredCurrency();

  const form = useWalletForm({
    defaultValues: {
      name: "",
      type: WalletType.CHECKING,
      // A default, not a scope: the form still lets any currency be picked.
      currencyCode: preferredCurrency,
      openingBalanceCents: 0,
    },
    onSubmit: async (values) => {
      await createMutation.mutateAsync(values);
      handleOpenChange(false);
    },
  });

  // Reset on open as well as close: the preferred currency is read from outside
  // the form and can change while the sheet is shut.
  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    form.reset();
  }

  useResetOnOpen(open, form.reset);

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={t("wallet.create.title")}
      description={t("wallet.create.description")}
      submitLabel={t("wallet.create.submit")}
      submittingLabel={t("common.creating")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <WalletFormFields form={form} />
    </FormSheet>
  );
}
