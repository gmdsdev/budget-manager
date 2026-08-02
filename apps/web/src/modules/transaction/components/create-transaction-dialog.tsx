import {
  RecurrenceType,
  TransactionKind,
  TransactionStatus,
} from "@budget-manager/schemas";
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
import { useEffect, useId, useState } from "react";
import { useCreateRecurringMutation } from "@budget-manager/client/react";
import { useWalletOptionsQuery } from "@budget-manager/client/react";
import { useTransactionForm } from "@budget-manager/client/react";
import { useCreateTransactionMutation } from "@budget-manager/client/react";
import { todayAsDateString } from "@budget-manager/client";
import {
  NO_REPEAT_STATE,
  RepeatsFields,
  type RepeatState,
} from "./repeats-fields";
import { TransactionFormFields } from "./transaction-form-fields";

export function CreateTransactionDialog() {
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const formId = useId();

  const createMutation = useCreateTransactionMutation();
  const createSeriesMutation = useCreateRecurringMutation();
  const [repeat, setRepeat] = useState<RepeatState>(NO_REPEAT_STATE);

  const { data: wallets } = useWalletOptionsQuery();
  const firstWalletId = wallets?.[0]?.id ?? "";

  const form = useTransactionForm({
    defaultValues: {
      kind: TransactionKind.EXPENSE,
      status: TransactionStatus.WAITING_PAYMENT,
      name: "",
      amountCents: 0,
      occurrenceDate: todayAsDateString(),
      walletId: firstWalletId,
      categoryId: null,
      notes: null,
    },
    onSubmit: async (values) => {
      // One form, two destinations: a repeating transaction becomes a series,
      // a plain one stays a single ledger row.
      if (!repeat.enabled) {
        await createMutation.mutateAsync(values);
      } else {
        await createSeriesMutation.mutateAsync({
          kind: values.kind,
          name: values.name,
          amountCents: values.amountCents,
          categoryId: values.categoryId,
          walletId: values.walletId,
          creditCardId: null,
          notes: values.notes,
          recurrenceType: repeat.recurrenceType,
          interval: repeat.interval,
          installments:
            repeat.recurrenceType === RecurrenceType.FIXED
              ? repeat.installments
              : null,
          startsOn: values.occurrenceDate,
        });
      }

      handleOpenChange(false);
    },
  });

  useEffect(() => {
    if (firstWalletId && !form.getFieldValue("walletId")) {
      form.setFieldValue("walletId", firstWalletId, { dontUpdateMeta: true });
    }
  }, [firstWalletId, form]);

  // Reset on open as well as close: the date defaults to today, which is read
  // from outside the form, so a tab left open across midnight would otherwise
  // offer yesterday — and a wallet created since would not be preselected.
  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    form.reset();
    setRepeat(NO_REPEAT_STATE);
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button>{t("transaction.create.trigger")}</Button>}
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("transaction.create.title")}</DialogTitle>
          <DialogDescription>
            {t("transaction.create.description")}
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <TransactionFormFields form={form}>
            <RepeatsFields value={repeat} onChange={setRepeat} />
          </TransactionFormFields>
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
                  : repeat.enabled
                    ? t("transaction.create.submitSeries")
                    : t("transaction.create.submit")}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
