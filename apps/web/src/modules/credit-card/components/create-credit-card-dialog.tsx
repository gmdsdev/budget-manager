import { usePreferredCurrency } from "@budget-manager/client/react";
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
import { useCreditCardForm } from "@budget-manager/client/react";
import { useCreateCreditCardMutation } from "@budget-manager/client/react";
import { CreditCardFormFields } from "./credit-card-form-fields";

export function CreateCreditCardDialog() {
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const formId = useId();

  const createMutation = useCreateCreditCardMutation();
  const preferredCurrency = usePreferredCurrency();

  const form = useCreditCardForm({
    defaultValues: {
      name: "",
      limitCents: 0,
      closeDay: 1,
      dueDay: 10,
      defaultBillingWalletId: null,
      currencyCode: preferredCurrency,
    },
    onSubmit: async (values) => {
      await createMutation.mutateAsync(values);
      handleOpenChange(false);
    },
  });

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
      <DialogTrigger render={<Button>{t("creditCard.create.trigger")}</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("creditCard.create.title")}</DialogTitle>
          <DialogDescription>
            {t("creditCard.create.description")}
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
                {isSubmitting
                  ? t("common.creating")
                  : t("creditCard.create.submit")}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
