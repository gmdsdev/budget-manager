import {
  RecurrenceType,
  TransactionKind,
  TransactionStatus,
} from "@budget-manager/schemas";
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
import { useCreateRecurringMutation } from "@/modules/recurring/mutations/use-recurring-mutation";
import { useWalletOptionsQuery } from "@/modules/wallet/queries/use-wallet-options-query";
import { useTransactionForm } from "../hooks/use-transaction-form";
import { useCreateTransactionMutation } from "../mutations/use-transaction-mutation";
import { todayAsDateString } from "../utils/date";
import {
  NO_REPEAT_STATE,
  RepeatsFields,
  type RepeatState,
} from "./repeats-fields";
import { TransactionFormFields } from "./transaction-form-fields";

export function CreateTransactionDialog() {
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
          endsOn:
            repeat.recurrenceType === RecurrenceType.FIXED
              ? null
              : repeat.endsOn,
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

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset();
      setRepeat(NO_REPEAT_STATE);
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button>Create Transaction</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
          <DialogDescription>
            Record an income or expense against one of your wallets.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <TransactionFormFields form={form}>
            <RepeatsFields value={repeat} onChange={setRepeat} />
          </TransactionFormFields>
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form={formId} disabled={isSubmitting}>
                {isSubmitting
                  ? "Creating…"
                  : repeat.enabled
                    ? "Create series"
                    : "Create transaction"}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
