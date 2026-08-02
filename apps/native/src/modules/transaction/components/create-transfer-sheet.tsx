import { todayAsDateString } from "@budget-manager/client";
import {
  useCreateTransferMutation,
  useTransferForm,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { TransactionStatus } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { FormSheet } from "@/components/ui/form-sheet";
import { useResetOnOpen } from "@/hooks/use-reset-on-open";
import {
  TransferFormFields,
} from "@/modules/transaction/components/transfer-form-fields";

export function CreateTransferSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const createMutation = useCreateTransferMutation();

  const form = useTransferForm({
    defaultValues: {
      status: TransactionStatus.PAID,
      name: "",
      amountCents: 0,
      occurrenceDate: todayAsDateString(),
      fromWalletId: "",
      toWalletId: "",
      notes: null,
    },
    onSubmit: async (values) => {
      await createMutation.mutateAsync(values);
      handleOpenChange(false);
    },
  });

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
      title={t("transfer.create.title")}
      description={t("transfer.create.description")}
      submitLabel={t("transfer.create.submit")}
      submittingLabel={t("common.creating")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <TransferFormFields form={form} />
    </FormSheet>
  );
}
