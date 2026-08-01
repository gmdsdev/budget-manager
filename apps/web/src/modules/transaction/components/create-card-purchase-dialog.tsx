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
import { useCardPurchaseForm } from "../hooks/use-card-purchase-form";
import { useCreateCardPurchaseMutation } from "../mutations/use-transaction-mutation";
import { todayAsDateString } from "../utils/date";
import { CardPurchaseFormFields } from "./card-purchase-form-fields";

export function CreateCardPurchaseDialog() {
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const formId = useId();

  const createMutation = useCreateCardPurchaseMutation();

  const form = useCardPurchaseForm({
    defaultValues: {
      status: TransactionStatus.PAID,
      name: "",
      amountCents: 0,
      occurrenceDate: todayAsDateString(),
      creditCardId: "",
      categoryId: null,
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
          <Button variant="outline">{t("cardPurchase.create.trigger")}</Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("cardPurchase.create.title")}</DialogTitle>
          <DialogDescription>
            {t("cardPurchase.create.description")}
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <CardPurchaseFormFields form={form} />
        </form>

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline">{t("common.cancel")}</Button>}
          />
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form={formId} disabled={isSubmitting}>
                {isSubmitting
                  ? t("cardPurchase.create.submitting")
                  : t("cardPurchase.create.submit")}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
