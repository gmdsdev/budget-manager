import type { TransactionRow } from "@budget-manager/client";
import {
  useTransactionForm,
  useUpdateTransactionMutation,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { TransactionKind } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { FormSheet } from "@/components/ui/form-sheet";
import {
  TransactionFormFields,
} from "@/modules/transaction/components/transaction-form-fields";

export function EditTransactionSheet({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: TransactionRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const updateMutation = useUpdateTransactionMutation();

  const form = useTransactionForm({
    defaultValues: {
      kind:
        transaction.kind === TransactionKind.INCOME
          ? TransactionKind.INCOME
          : TransactionKind.EXPENSE,
      status: transaction.status,
      name: transaction.name,
      amountCents: transaction.amountCents,
      occurrenceDate: transaction.occurrenceDate,
      walletId: transaction.walletId ?? "",
      categoryId: transaction.categoryId,
      notes: transaction.notes,
    },
    onSubmit: async (values) => {
      await updateMutation.mutateAsync({ ...values, id: transaction.id });
      onOpenChange(false);
    },
  });

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("transaction.edit.title")}
      description={t("transaction.edit.description", { name: transaction.name })}
      submitLabel={t("common.saveChanges")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <TransactionFormFields form={form} />
    </FormSheet>
  );
}
