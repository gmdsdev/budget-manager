import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@budget-manager/ui/components/alert-dialog";
import { useDeleteWalletMutation } from "../mutations/use-wallet-mutation";

export function DeleteWalletDialog({
  walletId,
  open,
  setOpen,
}: {
  walletId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const deleteMutation = useDeleteWalletMutation();

  function handleDelete() {
    deleteMutation.mutate(
      { id: walletId },
      {
        onSuccess: () => {
          setOpen(false);
        },
      },
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            wallet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
