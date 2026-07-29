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
import { useState } from "react";
import { useWalletForm } from "../hooks/use-wallet-form";
import {
  useCreateWalletMutation,
  useUpdateWalletMutation,
} from "../mutations/use-wallet-mutation";
import { WalletFormFields } from "./wallet-form-fields";
import { WalletDto, WalletFormDto } from "@budget-manager/schemas";

const FORM_ID = "create-wallet-form";

export function EditWalletDialog({
  wallet,
  open,
  setOpen,
}: {
  wallet: WalletDto;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset();
    }
  }

  const updateMutation = useUpdateWalletMutation();

  const form = useWalletForm({
    defaultValues: {
      id: wallet.id,
      name: wallet.name,
      type: wallet.type,
      openingBalanceCents: wallet.openingBalanceCents,
      currency: wallet.currency,
    } as WalletFormDto & { id: string },
    onSubmit: (values) => {
      updateMutation.mutate(
        {
          ...values,
          id: wallet.id,
        },
        {
          onSuccess: () => {
            handleOpenChange(false);
          },
        },
      );
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Wallet</DialogTitle>
          <DialogDescription>Edit the wallet details.</DialogDescription>
        </DialogHeader>

        <form id={FORM_ID} onSubmit={handleSubmit}>
          <WalletFormFields form={form} />
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button type="submit" form={FORM_ID}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
