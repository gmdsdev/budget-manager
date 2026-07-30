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
import { useRecurringForm } from "../hooks/use-recurring-form";
import { useUpdateRecurringMutation } from "../mutations/use-recurring-mutation";
import type { RecurringRow } from "../types";
import { RecurringFormFields } from "./recurring-form-fields";

export function EditRecurringDialog({
  series,
  open,
  onOpenChange,
}: {
  series: RecurringRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const updateMutation = useUpdateRecurringMutation();

  const form = useRecurringForm({
    defaultValues: {
      kind: series.kind,
      name: series.name,
      amountCents: series.amountCents,
      categoryId: series.categoryId,
      walletId: series.walletId,
      creditCardId: series.creditCardId,
      notes: series.notes,
      recurrenceType: series.recurrenceType,
      interval: series.interval,
      installments: series.installments,
      startsOn: series.startsOn,
      endsOn: series.endsOn,
    },
    onSubmit: async (values) => {
      await updateMutation.mutateAsync({ ...values, id: series.id });
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
          <DialogTitle>Edit Series</DialogTitle>
          <DialogDescription>
            Scheduled transactions ahead of today are re-created. Anything
            already settled or in the past is left alone.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <RecurringFormFields form={form} />
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
