import { TransactionStatus } from "@budget-manager/schemas";
import { Button } from "@budget-manager/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@budget-manager/ui/components/dialog";
import { useId, useState } from "react";
import { useCardPurchaseForm } from "../hooks/use-card-purchase-form";
import { useCreateCardPurchaseMutation } from "../mutations/use-transaction-mutation";
import { todayAsDateString } from "../utils/date";
import { CardPurchaseFormFields } from "./card-purchase-form-fields";

export function CreateCardPurchaseDialog() {
  const [open, setOpen] = useState(false);
  const formId = useId();

  const createMutation = useCreateCardPurchaseMutation();

  const form = useCardPurchaseForm({
    defaultValues: {
      status: TransactionStatus.PAID,
      name: "",
      amountCents: 0,
      occurrenceDate: todayAsDateString(),
      creditCardId: "",
      categoryId: null,
      notes: null,
    },
    onSubmit: async (values) => {
      await createMutation.mutateAsync(values);
      handleOpenChange(false);
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

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
      <DialogTrigger
        render={<Button variant="outline">Card purchase</Button>}
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Card Purchase</DialogTitle>
          <DialogDescription>
            Something bought on a card. It adds to the card's balance, not a
            wallet's.
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
                {isSubmitting ? "Recording…" : "Record purchase"}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
