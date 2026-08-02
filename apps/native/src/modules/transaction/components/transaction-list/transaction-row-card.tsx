import { transactionRepeatsLabel, type TransactionRow } from "@budget-manager/client";
import {
  useEnumLabels,
  useMarkTransactionPaidMutation,
  useRecurringSeriesQuery,
  useSetRecurringActiveMutation,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import {
  CREDITED_TRANSACTION_KINDS,
  TransactionKind,
  TransactionStatus,
} from "@budget-manager/schemas";
import { useState } from "react";

import { Amount } from "@/components/amount";
import { RowCard } from "@/components/ui/row-card";
import { type RowAction, RowMenu } from "@/components/ui/row-menu";
import { Text } from "@/components/ui/text";
import { toast } from "@/lib/toast";
import { CategoryLabel } from "@/modules/category/components/category-label";
import {
  DeleteRecurringSheet,
} from "@/modules/recurring/components/delete-recurring-sheet";
import {
  EditRecurringSheet,
} from "@/modules/recurring/components/edit-recurring-sheet";
import {
  DeleteTransactionSheet,
} from "@/modules/transaction/components/delete-transaction-sheet";
import {
  EditCardPaymentSheet,
} from "@/modules/transaction/components/edit-card-payment-sheet";
import {
  EditCardPurchaseSheet,
} from "@/modules/transaction/components/edit-card-purchase-sheet";
import {
  EditTransactionSheet,
} from "@/modules/transaction/components/edit-transaction-sheet";
import {
  EditTransferSheet,
} from "@/modules/transaction/components/edit-transfer-sheet";

type RowSheet = "edit" | "delete" | "series" | "deleteSeries" | null;

export function TransactionRowCard({ transaction }: { transaction: TransactionRow }) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const [sheet, setSheet] = useState<RowSheet>(null);
  const markPaidMutation = useMarkTransactionPaidMutation();
  const setActiveMutation = useSetRecurringActiveMutation();
  const templateId = transaction.templateId;
  const series = useRecurringSeriesQuery(templateId);

  const canMarkPaid = transaction.status === TransactionStatus.WAITING_PAYMENT;
  const transferGroupId = transaction.transferGroupId;
  const isCardPurchase = transaction.kind === TransactionKind.CREDIT_CARD_PURCHASE;
  const isCardPayment = transaction.kind === TransactionKind.CREDIT_CARD_PAYMENT;
  const isCredit = CREDITED_TRANSACTION_KINDS.includes(transaction.kind);

  // Each shape has its own editor; the plain form cannot carry a card reference or
  // a transfer pair, and the server rejects it if tried.
  const editLabel = transferGroupId
    ? t("transaction.action.editTransfer")
    : isCardPurchase
      ? t("transaction.action.editPurchase")
      : isCardPayment
        ? t("transaction.action.editPayment")
        : t("transaction.action.edit");

  const actions: RowAction[] = [
    ...(canMarkPaid
      ? [
          {
            label: t("transaction.action.markAsPaid"),
            disabled: markPaidMutation.isPending,
            onPress: () => markPaidMutation.mutate({ id: transaction.id }),
          },
        ]
      : []),
    { label: editLabel, onPress: () => setSheet("edit") },
    ...(templateId
      ? [
          { label: t("recurring.edit.action"), onPress: () => setSheet("series") },
          {
            label:
              series?.isActive === false
                ? t("transaction.action.resumeSeries")
                : t("transaction.action.pauseSeries"),
            disabled: setActiveMutation.isPending || !series,
            onPress: () => {
              if (!series) return;

              setActiveMutation.mutate(
                { id: templateId, isActive: !series.isActive },
                {
                  onSuccess: () =>
                    toast.success(
                      series.isActive
                        ? t("transaction.seriesPaused")
                        : t("transaction.seriesResumed"),
                    ),
                },
              );
            },
          },
          {
            label: t("recurring.delete.submit"),
            destructive: true,
            disabled: !series,
            onPress: () => setSheet("deleteSeries"),
          },
        ]
      : []),
    {
      label: transferGroupId
        ? t("transaction.action.deleteTransfer")
        : t("transaction.action.delete"),
      destructive: true,
      onPress: () => setSheet("delete"),
    },
  ];

  return (
    <>
      <RowCard
        primary={<Text variant="bodyMedium">{transaction.name}</Text>}
        trailing={
          <Amount
            cents={transaction.amountCents}
            currencyCode={transaction.walletCurrencyCode ?? "BRL"}
            signed
            credit={isCredit}
          />
        }
        actions={
          <RowMenu
            label={t("common.actionsFor", { name: transaction.name })}
            actions={actions}
          />
        }
        details={[
          {
            label: t("common.account"),
            // A card purchase has no wallet; the card is the account it belongs to.
            value:
              transaction.walletName ??
              transaction.creditCardName ??
              t("common.none"),
          },
          {
            label: t("common.category"),
            value: (
              <CategoryLabel
                color={transaction.categoryColor}
                name={transaction.categoryName ?? t("category.uncategorized")}
                variant="tiny"
              />
            ),
          },
          {
            label: t("transaction.filter.kind"),
            value: labels.transactionKind(transaction.kind),
          },
          {
            label: t("transaction.column.repeats"),
            value: transactionRepeatsLabel(t, labels, transaction),
          },
          {
            label: t("common.status"),
            value: labels.transactionStatus(transaction.status),
          },
        ]}
      />

      {sheet === "edit" &&
        (transferGroupId ? (
          <EditTransferSheet
            transaction={transaction}
            transferGroupId={transferGroupId}
            open
            onOpenChange={(next) => setSheet(next ? "edit" : null)}
          />
        ) : isCardPurchase ? (
          <EditCardPurchaseSheet
            transaction={transaction}
            open
            onOpenChange={(next) => setSheet(next ? "edit" : null)}
          />
        ) : isCardPayment ? (
          <EditCardPaymentSheet
            transaction={transaction}
            open
            onOpenChange={(next) => setSheet(next ? "edit" : null)}
          />
        ) : (
          <EditTransactionSheet
            transaction={transaction}
            open
            onOpenChange={(next) => setSheet(next ? "edit" : null)}
          />
        ))}

      {sheet === "series" && series && (
        <EditRecurringSheet
          series={series}
          open
          onOpenChange={(next) => setSheet(next ? "series" : null)}
        />
      )}

      {sheet === "deleteSeries" && series && (
        <DeleteRecurringSheet
          series={series}
          open
          onOpenChange={(next) => setSheet(next ? "deleteSeries" : null)}
        />
      )}

      {sheet === "delete" && (
        <DeleteTransactionSheet
          transaction={transaction}
          open
          onOpenChange={(next) => setSheet(next ? "delete" : null)}
        />
      )}
    </>
  );
}
