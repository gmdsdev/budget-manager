import { useTranslate } from "@budget-manager/i18n/react";
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
import { useCreditCardForm } from "@budget-manager/client/react";
import { useUpdateCreditCardMutation } from "@budget-manager/client/react";
import type { CreditCardRow } from "@budget-manager/client";
import { CreditCardFormFields } from "./credit-card-form-fields";

export function EditCreditCardDialog({
  card,
  open,
  onOpenChange,
}: {
  card: CreditCardRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const formId = useId();
  const updateMutation = useUpdateCreditCardMutation();

  const form = useCreditCardForm({
    defaultValues: {
      name: card.name,
      limitCents: card.limitCents,
      closeDay: card.closeDay,
      dueDay: card.dueDay,
      defaultBillingWalletId: card.defaultBillingWalletId,
      currencyCode: card.currencyCode as WalletCurrency,
    },
    onSubmit: async (values) => {
      await updateMutation.mutateAsync({ ...values, id: card.id });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("creditCard.edit.title")}</DialogTitle>
          <DialogDescription>
            {t("creditCard.edit.description", { name: card.name })}
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <CreditCardFormFields form={form} />
        </form>

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline">{t("common.cancel")}</Button>}
          />
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form={formId} disabled={isSubmitting}>
                {isSubmitting ? t("common.saving") : t("common.saveChanges")}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
