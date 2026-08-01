import { usePreferredCurrency } from "@/hooks/use-preferred-currency";
import { useTranslate } from "@budget-manager/i18n/react";
import { RecurrenceType } from "@budget-manager/schemas";
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
import { useBudgetForm } from "../hooks/use-budget-form";
import { useCreateBudgetMutation } from "../mutations/use-budget-mutation";
import { currentMonth } from "../utils/month";
import { BudgetFormFields } from "./budget-form-fields";

export function CreateBudgetDialog({ month }: { month?: string }) {
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const formId = useId();
  const preferredCurrency = usePreferredCurrency();

  const createMutation = useCreateBudgetMutation();

  const form = useBudgetForm({
    defaultValues: {
      categoryId: "",
      currencyCode: preferredCurrency,
      amountCents: 0,
      recurrenceType: RecurrenceType.MONTHLY,
      interval: 1,
      installments: null,
      // The month the user is looking at, so a limit lands where they expect.
      startsOn: month ?? currentMonth(),
    },
    onSubmit: async (values) => {
      await createMutation.mutateAsync(values);
      handleOpenChange(false);
    },
  });

  // Reset on open as well as close: the preferred currency and the month in
  // view are read from outside the form, and either can change while it is shut.
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
      <DialogTrigger render={<Button>{t("budget.create.trigger")}</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("budget.create.title")}</DialogTitle>
          <DialogDescription>
            {t("budget.create.description")}
          </DialogDescription>
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
                {isSubmitting
                  ? t("common.creating")
                  : t("budget.create.submit")}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
