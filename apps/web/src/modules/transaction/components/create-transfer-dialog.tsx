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
import { useTransferForm } from "../hooks/use-transfer-form";
import { useCreateTransferMutation } from "../mutations/use-transaction-mutation";
import { todayAsDateString } from "../utils/date";
import { TransferFormFields } from "./transfer-form-fields";

export function CreateTransferDialog() {
  const [open, setOpen] = useState(false);
  const formId = useId();

  const createMutation = useCreateTransferMutation();

  const form = useTransferForm({
    defaultValues: {
      status: TransactionStatus.PAID,
      name: "",
      amountCents: 0,
      occurrenceDate: todayAsDateString(),
      fromWalletId: "",
      toWalletId: "",
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
      <DialogTrigger render={<Button variant="outline">Transfer</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New Transfer</DialogTitle>
          <DialogDescription>
            Move money between two of your wallets.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <TransferFormFields form={form} />
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form={formId} disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create transfer"}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
