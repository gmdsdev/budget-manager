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
import { useCardPaymentForm } from "../hooks/use-card-payment-form";
import { useCreateCardPaymentMutation } from "../mutations/use-transaction-mutation";
import { todayAsDateString } from "../utils/date";
import { CardPaymentFormFields } from "./card-payment-form-fields";

export function CreateCardPaymentDialog() {
  const [open, setOpen] = useState(false);
  const formId = useId();

  const createMutation = useCreateCardPaymentMutation();

  const form = useCardPaymentForm({
    defaultValues: {
      status: TransactionStatus.PAID,
      name: "",
      amountCents: 0,
      occurrenceDate: todayAsDateString(),
      creditCardId: "",
      walletId: "",
      creditCardBillId: null,
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
      <DialogTrigger render={<Button variant="outline">Pay card</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Pay Card</DialogTitle>
          <DialogDescription>
            Money leaving a wallet to pay down a card.
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
                {isSubmitting ? "Recording…" : "Record payment"}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
