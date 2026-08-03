import { getErrorMessage } from "@budget-manager/client";
import { TransactionKind } from "@budget-manager/schemas";
import { useTranslate } from "@budget-manager/i18n/react";
import { Button } from "@budget-manager/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@budget-manager/ui/components/dialog";
import { Skeleton } from "@budget-manager/ui/components/skeleton";
import { useId } from "react";
import { useTransferForm } from "@budget-manager/client/react";
import { useUpdateTransferMutation } from "@budget-manager/client/react";
import {
  type TransferLeg,
  useTransferQuery,
} from "@budget-manager/client/react";
import type { TransactionRow } from "@budget-manager/client";
import { TransferFormFields } from "./transfer-form-fields";

function EditTransferForm({
  transaction,
  transferGroupId,
  legs,
  onDone,
}: {
  transaction: TransactionRow;
  transferGroupId: string;
  legs: TransferLeg[];
  onDone: () => void;
}) {
  const t = useTranslate();
  const formId = useId();
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
      onDone();
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  };

  return (
    <>
      <form id={formId} onSubmit={handleSubmit}>
        <TransferFormFields form={form} />
      </form>

      <DialogFooter>
        <DialogClose
          render={<Button variant="outline">{t("common.cancel")}</Button>}
        />
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : t("common.saveChanges")}
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </>
  );
}

export function EditTransferDialog({
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("transfer.edit.title")}</DialogTitle>
          <DialogDescription>
            {t("transfer.edit.description", { name: transaction.name })}
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div
            className="space-y-4"
            role="status"
            aria-label={t("transfer.loading")}
          >
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
        ) : (
          <EditTransferForm
            transaction={transaction}
            transferGroupId={transferGroupId}
            legs={data}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
