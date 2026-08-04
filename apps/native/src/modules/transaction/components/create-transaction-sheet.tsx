import { todayAsDateString } from "@budget-manager/client";
import {
  useCreateRecurringMutation,
  useCreateTransactionMutation,
  useTransactionForm,
  useWalletOptionsQuery,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import {
  RecurrenceType,
  TransactionKind,
  TransactionStatus,
} from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";
import { useEffect, useState } from "react";

import { FormSheet } from "@/components/ui/form-sheet";
import { useResetOnOpen } from "@/hooks/use-reset-on-open";
import {
  NO_REPEAT_STATE,
  RepeatsFields,
} from "@/modules/transaction/components/repeats-fields";
import type { RepeatState } from "@/modules/transaction/components/repeats-fields";
import {
  TransactionFormFields,
} from "@/modules/transaction/components/transaction-form-fields";

export function CreateTransactionSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const createMutation = useCreateTransactionMutation();
  const createSeriesMutation = useCreateRecurringMutation();
  const [repeat, setRepeat] = useState<RepeatState>(NO_REPEAT_STATE);

  const { data: wallets } = useWalletOptionsQuery();
  const firstWalletId = wallets?.[0]?.id ?? "";

  const form = useTransactionForm({
    defaultValues: {
      kind: TransactionKind.EXPENSE,
      status: TransactionStatus.PAID,
      name: "",
      amountCents: 0,
      occurrenceDate: todayAsDateString(),
      walletId: firstWalletId,
      categoryId: null,
      notes: null,
    },
    onSubmit: async (values) => {
      // One form, two destinations: a repeating transaction becomes a series, a
      // plain one stays a single ledger row.
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

  // Reset on open as well as close: the date defaults to today and the wallet to
  // the first one, both read from outside the form — a sheet opened after midnight
  // would otherwise offer yesterday, and a wallet created since would not be
  // preselected.
  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    form.reset();
    setRepeat(NO_REPEAT_STATE);
  }

  useResetOnOpen(open, form.reset);

  // Wallets may land while the sheet is already open, and a wallet created since the
  // last visit should win — `dontUpdateMeta` keeps that from marking the field touched
  // and revealing an error the user has not caused.
  useEffect(() => {
    if (firstWalletId && !form.getFieldValue("walletId")) {
      form.setFieldValue("walletId", firstWalletId, { dontUpdateMeta: true });
    }
  }, [firstWalletId, form]);

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={t("transaction.create.title")}
      description={t("transaction.create.description")}
      submitLabel={
        repeat.enabled
          ? t("transaction.create.submitSeries")
          : t("transaction.create.submit")
      }
      submittingLabel={t("common.creating")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <TransactionFormFields form={form}>
        <RepeatsFields value={repeat} onChange={setRepeat} />
      </TransactionFormFields>
    </FormSheet>
  );
}
