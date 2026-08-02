import type { WalletRow } from "@budget-manager/client";
import { useUpdateWalletMutation, useWalletForm } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { type WalletCurrency } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { FormSheet } from "@/components/ui/form-sheet";

import { WalletFormFields } from "./wallet-form-fields";

export function EditWalletSheet({
  wallet,
  open,
  onOpenChange,
}: {
  wallet: WalletRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const updateMutation = useUpdateWalletMutation();

  const form = useWalletForm({
    defaultValues: {
      name: wallet.name,
      type: wallet.type,
      // The row carries the column's `text`; the form carries the enum.
      currencyCode: wallet.currencyCode as WalletCurrency,
      openingBalanceCents: wallet.openingBalanceCents,
    },
    onSubmit: async (values) => {
      await updateMutation.mutateAsync({ ...values, id: wallet.id });
      onOpenChange(false);
    },
  });

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("wallet.edit.title")}
      description={t("wallet.edit.description", { name: wallet.name })}
      submitLabel={t("common.saveChanges")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <WalletFormFields form={form} />
    </FormSheet>
  );
}
