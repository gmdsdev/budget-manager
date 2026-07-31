import { usePreferredCurrency } from "@/hooks/use-preferred-currency";
import { useTranslate } from "@budget-manager/i18n/react";
import { WalletType } from "@budget-manager/schemas";
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
import { useWalletForm } from "../hooks/use-wallet-form";
import { useCreateWalletMutation } from "../mutations/use-wallet-mutation";
import { WalletFormFields } from "./wallet-form-fields";

export function CreateWalletDialog() {
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const formId = useId();

  const createMutation = useCreateWalletMutation();
  const preferredCurrency = usePreferredCurrency();

  const form = useWalletForm({
    defaultValues: {
      name: "",
      type: WalletType.CHECKING,
      currencyCode: preferredCurrency,
      openingBalanceCents: 0,
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
      <DialogTrigger render={<Button>{t("wallet.create.trigger")}</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("wallet.create.title")}</DialogTitle>
          <DialogDescription>
            {t("wallet.create.description")}
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <WalletFormFields form={form} />
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
                  : t("wallet.create.submit")}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
