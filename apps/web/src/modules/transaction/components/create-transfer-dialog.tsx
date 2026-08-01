import { TransactionStatus } from "@budget-manager/schemas";
import { useTranslate } from "@budget-manager/i18n/react";
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
  const t = useTranslate();
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

  // Reset on open as well as close: the date defaults to today, which is read
  // from outside the form, so a tab left open across midnight would otherwise
  // offer yesterday.
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
      <DialogTrigger
        render={
          <Button variant="outline">{t("transfer.create.trigger")}</Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("transfer.create.title")}</DialogTitle>
          <DialogDescription>
            {t("transfer.create.description")}
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <TransferFormFields form={form} />
        </form>

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline">{t("common.cancel")}</Button>}
          />
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form={formId} disabled={isSubmitting}>
                {isSubmitting
                  ? t("common.creating")
                  : t("transfer.create.submit")}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
