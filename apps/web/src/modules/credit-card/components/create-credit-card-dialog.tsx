import { usePreferredCurrency } from "@/hooks/use-preferred-currency";
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
import { useCreditCardForm } from "../hooks/use-credit-card-form";
import { useCreateCreditCardMutation } from "../mutations/use-credit-card-mutation";
import { CreditCardFormFields } from "./credit-card-form-fields";

export function CreateCreditCardDialog() {
  const [open, setOpen] = useState(false);
  const formId = useId();

  const createMutation = useCreateCreditCardMutation();
  const preferredCurrency = usePreferredCurrency();

  const form = useCreditCardForm({
    defaultValues: {
      name: "",
      limitCents: 0,
      closeDay: 1,
      dueDay: 10,
      defaultBillingWalletId: null,
      currencyCode: preferredCurrency,
    },
    onSubmit: async (values) => {
      await createMutation.mutateAsync(values);
      handleOpenChange(false);
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    form.reset();
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button>Create Card</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Credit Card</DialogTitle>
          <DialogDescription>
            Track a card's limit and what you currently owe on it.
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
                {isSubmitting ? "Creating…" : "Create card"}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
