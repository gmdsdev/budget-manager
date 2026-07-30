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
import { useArchiveCreditCardMutation } from "../mutations/use-credit-card-mutation";
import type { CreditCardRow } from "../types";

export function ArchiveCreditCardDialog({
  card,
  open,
  onOpenChange,
}: {
  card: CreditCardRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const archiveMutation = useArchiveCreditCardMutation();

  function handleArchive() {
    archiveMutation.mutate(
      { id: card.id },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive “{card.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {card.outstandingCents > 0
              ? `This card still owes ${formatMinorUnits(card.outstandingCents, card.currencyCode)}. `
              : ""}
            It will be hidden from your lists and can no longer be picked for new
            purchases. Its history is kept, and you can restore it later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={archiveMutation.isPending}
            onClick={handleArchive}
          >
            {archiveMutation.isPending ? "Archiving…" : "Archive card"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
