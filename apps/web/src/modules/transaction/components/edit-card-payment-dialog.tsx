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
import { useCardPaymentForm } from "../hooks/use-card-payment-form";
import { useUpdateCardPaymentMutation } from "../mutations/use-transaction-mutation";
import type { TransactionRow } from "../types";
import { CardPaymentFormFields } from "./card-payment-form-fields";

export function EditCardPaymentDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: TransactionRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const updateMutation = useUpdateCardPaymentMutation();

  const form = useCardPaymentForm({
    defaultValues: {
      status: transaction.status,
      name: transaction.name,
      amountCents: transaction.amountCents,
      occurrenceDate: transaction.occurrenceDate,
      creditCardId: transaction.creditCardId ?? "",
      walletId: transaction.walletId ?? "",
      creditCardBillId: transaction.creditCardBillId,
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
          <DialogTitle>Edit Card Payment</DialogTitle>
          <DialogDescription>
            Update the details for “{transaction.name}”.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <CardPaymentFormFields form={form} />
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
