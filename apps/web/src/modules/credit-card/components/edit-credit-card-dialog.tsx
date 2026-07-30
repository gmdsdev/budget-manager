import type { WalletCurrency } from "@budget-manager/schemas";
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
import { useCreditCardForm } from "../hooks/use-credit-card-form";
import { useUpdateCreditCardMutation } from "../mutations/use-credit-card-mutation";
import type { CreditCardRow } from "../types";
import { CreditCardFormFields } from "./credit-card-form-fields";

export function EditCreditCardDialog({
  card,
  open,
  onOpenChange,
}: {
  card: CreditCardRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const updateMutation = useUpdateCreditCardMutation();

  const form = useCreditCardForm({
    defaultValues: {
      name: card.name,
      limitCents: card.limitCents,
      closeDay: card.closeDay,
      dueDay: card.dueDay,
      defaultBillingWalletId: card.defaultBillingWalletId,
      currencyCode: card.currencyCode as WalletCurrency,
    },
    onSubmit: async (values) => {
      await updateMutation.mutateAsync({ ...values, id: card.id });
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
          <DialogTitle>Edit Credit Card</DialogTitle>
          <DialogDescription>
            Update the details for “{card.name}”.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <CreditCardFormFields form={form} />
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
