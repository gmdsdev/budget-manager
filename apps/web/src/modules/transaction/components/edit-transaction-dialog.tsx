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
import { useId } from "react";
import { useTransactionForm } from "../hooks/use-transaction-form";
import { useUpdateTransactionMutation } from "../mutations/use-transaction-mutation";
import type { TransactionRow } from "../types";
import { TransactionFormFields } from "./transaction-form-fields";

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: TransactionRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
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
      handleOpenChange(false);
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      form.reset();
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the details for “{transaction.name}”.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <TransactionFormFields form={form} />
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
      </DialogContent>
    </Dialog>
  );
}
