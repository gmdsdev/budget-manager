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
import { useWalletForm } from "../hooks/use-wallet-form";
import { useUpdateWalletMutation } from "../mutations/use-wallet-mutation";
import type { WalletRow } from "../types";
import { WalletFormFields } from "./wallet-form-fields";

export function EditWalletDialog({
  wallet,
  open,
  onOpenChange,
}: {
  wallet: WalletRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const updateMutation = useUpdateWalletMutation();

  const form = useWalletForm({
    defaultValues: {
      name: wallet.name,
      type: wallet.type,
      openingBalanceCents: wallet.openingBalanceCents,
      currencyCode: wallet.currencyCode as WalletCurrency,
    },
    onSubmit: async (values) => {
      await updateMutation.mutateAsync({ ...values, id: wallet.id });
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
          <DialogTitle>Edit Wallet</DialogTitle>
          <DialogDescription>
            Update the details for “{wallet.name}”.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <WalletFormFields form={form} />
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
