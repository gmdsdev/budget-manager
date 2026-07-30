import { getErrorMessage } from "@/utils/error-message";
import { TransactionKind } from "@budget-manager/schemas";
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
import { useTransferForm } from "../hooks/use-transfer-form";
import { useUpdateTransferMutation } from "../mutations/use-transaction-mutation";
import {
  type TransferLeg,
  useTransferQuery,
} from "../queries/use-transfer-query";
import type { TransactionRow } from "../types";
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
        <DialogClose render={<Button variant="outline">Cancel</Button>} />
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save changes"}
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
  const { data, isPending, isError, error } = useTransferQuery(transferGroupId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Transfer</DialogTitle>
          <DialogDescription>
            Both legs of “{transaction.name}” are updated together.
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div
            className="space-y-4"
            role="status"
            aria-label="Loading transfer"
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
