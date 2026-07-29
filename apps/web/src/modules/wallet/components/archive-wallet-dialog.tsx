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
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { useArchiveWalletMutation } from "../mutations/use-wallet-mutation";
import type { WalletRow } from "../types";

export function ArchiveWalletDialog({
  wallet,
  open,
  onOpenChange,
}: {
  wallet: WalletRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const archiveMutation = useArchiveWalletMutation();

  function handleArchive() {
    archiveMutation.mutate(
      { id: wallet.id },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive “{wallet.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This wallet (opening balance{" "}
            {formatMinorUnits(wallet.openingBalanceCents, wallet.currencyCode)})
            will be hidden from your list. Its transaction history is kept, and
            you can restore it later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={archiveMutation.isPending}
            onClick={handleArchive}
          >
            {archiveMutation.isPending ? "Archiving…" : "Archive wallet"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
