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
import { useCardPurchaseForm } from "../hooks/use-card-purchase-form";
import { useUpdateCardPurchaseMutation } from "../mutations/use-transaction-mutation";
import type { TransactionRow } from "../types";
import { CardPurchaseFormFields } from "./card-purchase-form-fields";

export function EditCardPurchaseDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: TransactionRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const updateMutation = useUpdateCardPurchaseMutation();

  const form = useCardPurchaseForm({
    defaultValues: {
      status: transaction.status,
      name: transaction.name,
      amountCents: transaction.amountCents,
      occurrenceDate: transaction.occurrenceDate,
      creditCardId: transaction.creditCardId ?? "",
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
          <DialogTitle>Edit Card Purchase</DialogTitle>
          <DialogDescription>
            Update the details for “{transaction.name}”.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <CardPurchaseFormFields form={form} />
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
