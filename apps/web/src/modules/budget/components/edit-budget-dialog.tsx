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
import { useBudgetForm } from "@budget-manager/client/react";
import { useUpdateBudgetMutation } from "@budget-manager/client/react";
import type { BudgetRow } from "@budget-manager/client";
import { BudgetFormFields } from "./budget-form-fields";

export function EditBudgetDialog({
  budget,
  open,
  onOpenChange,
}: {
  budget: BudgetRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const formId = useId();
  const updateMutation = useUpdateBudgetMutation();

  const form = useBudgetForm({
    defaultValues: {
      categoryId: budget.categoryId,
      currencyCode: budget.currencyCode as WalletCurrency,
      amountCents: budget.amountCents,
      recurrenceType: budget.recurrenceType,
      interval: budget.interval,
      installments: budget.installments,
      startsOn: budget.startsOn,
    },
    onSubmit: async (values) => {
      await updateMutation.mutateAsync({ ...values, id: budget.id });
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
          <DialogTitle>{t("budget.edit.title")}</DialogTitle>
          <DialogDescription>{t("budget.edit.description")}</DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <BudgetFormFields form={form} />
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
