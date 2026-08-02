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
import { useWalletForm } from "@budget-manager/client/react";
import { useUpdateWalletMutation } from "@budget-manager/client/react";
import type { WalletRow } from "@budget-manager/client";
import { WalletFormFields } from "./wallet-form-fields";

export function EditWalletDialog({
  wallet,
  open,
  onOpenChange,
}: {
  wallet: WalletRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const formId = useId();
  const updateMutation = useUpdateWalletMutation();

  const form = useWalletForm({
    defaultValues: {
      name: wallet.name,
      type: wallet.type,
      openingBalanceCents: wallet.openingBalanceCents,
      currencyCode: wallet.currencyCode as WalletCurrency,
    },
    onSubmit: async (values) => {
      await updateMutation.mutateAsync({ ...values, id: wallet.id });
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
          <DialogTitle>{t("wallet.edit.title")}</DialogTitle>
          <DialogDescription>
            {t("wallet.edit.description", { name: wallet.name })}
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
                {isSubmitting ? t("common.saving") : t("common.saveChanges")}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
