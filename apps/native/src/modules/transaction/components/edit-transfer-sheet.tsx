import { getErrorMessage } from "@budget-manager/client";
import type { TransactionRow } from "@budget-manager/client";
import {
  type TransferLeg,
  useTransferForm,
  useTransferQuery,
  useUpdateTransferMutation,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { TransactionKind } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { FormSheet } from "@/components/ui/form-sheet";
import { SkeletonList } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import {
  TransferFormFields,
} from "@/modules/transaction/components/transfer-form-fields";

/**
 * A transfer is two rows sharing a group id, so the editor has to read both legs
 * before it can offer the pair as one form.
 */
export function EditTransferSheet({
  transaction,
  transferGroupId,
  open,
  onOpenChange,
}: {
  transaction: TransactionRow;
  transferGroupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const { data, isPending, isError, error } = useTransferQuery(transferGroupId);

  if (isPending || isError) {
    return (
      <FormSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t("transfer.edit.title")}
        description={t("transfer.edit.description", { name: transaction.name })}
        submitLabel={t("common.saveChanges")}
        isSubmitting={false}
        onSubmit={() => undefined}
      >
        {isPending ? (
          <SkeletonList label={t("transfer.loading")} count={3} height={48} />
        ) : (
          <Text tone="destructive">{getErrorMessage(error)}</Text>
        )}
      </FormSheet>
    );
  }

  return (
    <EditTransferForm
      transaction={transaction}
      transferGroupId={transferGroupId}
      legs={data}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

function EditTransferForm({
  transaction,
  transferGroupId,
  legs,
  open,
  onOpenChange,
}: {
  transaction: TransactionRow;
  transferGroupId: string;
  legs: TransferLeg[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const updateMutation = useUpdateTransferMutation();

  const outLeg = legs.find((leg) => leg.kind === TransactionKind.TRANSFER_OUT);
  const inLeg = legs.find((leg) => leg.kind === TransactionKind.TRANSFER_IN);

  const form = useTransferForm({
    defaultValues: {
      status: transaction.status,
      name: transaction.name,
      amountCents: transaction.amountCents,
      occurrenceDate: transaction.occurrenceDate,
      fromWalletId: outLeg?.walletId ?? "",
      toWalletId: inLeg?.walletId ?? "",
      notes: transaction.notes,
    },
    onSubmit: async (values) => {
      await updateMutation.mutateAsync({ ...values, transferGroupId });
      onOpenChange(false);
    },
  });

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("transfer.edit.title")}
      description={t("transfer.edit.description", { name: transaction.name })}
      submitLabel={t("common.saveChanges")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <TransferFormFields form={form} />
    </FormSheet>
  );
}
