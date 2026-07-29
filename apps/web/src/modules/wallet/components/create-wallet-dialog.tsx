import { WalletFormDto, WalletType } from "@budget-manager/schemas";
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
import { useCreateWalletMutation } from "../mutations/use-wallet-mutation";
import { WalletFormFields } from "./wallet-form-fields";

const FORM_ID = "create-wallet-form";

export function CreateWalletDialog() {
  const [open, setOpen] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset();
    }
  }

  const createMutation = useCreateWalletMutation();

  const form = useWalletForm({
    defaultValues: {
      name: "",
      type: WalletType.CHECKING,
      currencyCode: "BRL",
      openingBalanceCents: 0,
    } as WalletFormDto,
    onSubmit: (values) => {
      createMutation.mutate(values, {
        onSuccess: () => {
          handleOpenChange(false);
        },
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button>Create Wallet</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Wallet</DialogTitle>
          <DialogDescription>
            Create a new wallet to start tracking your finances.
          </DialogDescription>
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
