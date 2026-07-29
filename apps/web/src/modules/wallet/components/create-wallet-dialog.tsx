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
import { useWalletForm } from "../hooks/use-wallet-form";
import { WalletFormFields } from "./wallet-form-fields";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { useCreateWalletMutation } from "../mutations/use-wallet-mutation";

const FORM_ID = "create-wallet-form";

export function CreateWalletDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset();
    }
  }

  const createMutation = useCreateWalletMutation();

  const form = useWalletForm({
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
