import {
  transactionRepeatsLabel,
  type TransactionRow,
} from "@budget-manager/client";
import {
  useEnumLabels,
  useMarkTransactionPaidMutation,
  useRecurringSeriesQuery,
  useSetRecurringActiveMutation,
} from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import {
  CREDITED_TRANSACTION_KINDS,
  TransactionKind,
  TransactionStatus,
} from "@budget-manager/schemas";
import { useState } from "react";
import { View } from "react-native";

import { DetailRow, DetailSheet } from "@/components/detail-sheet";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { toast } from "@/lib/toast";
import { CategoryLabel } from "@/modules/category/components/category-label";
import { DeleteRecurringSheet } from "@/modules/recurring/components/delete-recurring-sheet";
import { EditRecurringSheet } from "@/modules/recurring/components/edit-recurring-sheet";
import { DeleteTransactionSheet } from "@/modules/transaction/components/delete-transaction-sheet";
import { EditCardPaymentSheet } from "@/modules/transaction/components/edit-card-payment-sheet";
import { EditCardPurchaseSheet } from "@/modules/transaction/components/edit-card-purchase-sheet";
import { EditTransactionSheet } from "@/modules/transaction/components/edit-transaction-sheet";
import { EditTransferSheet } from "@/modules/transaction/components/edit-transfer-sheet";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, SPACING } from "@/theme/tokens";

type NestedSheet = "edit" | "delete" | "series" | "deleteSeries" | null;

/**
 * The row is the way in to a transaction, and this is what it opens: the record in
 * full, with every action on it gathered in one place. The ledger itself carries no
 * menu — an irreversible action one mis-tap from a reversible one, in a list of
 * hundreds of rows, is a trap, and the row already has somewhere to go.
 */
export function TransactionDetailSheet({
  transaction,
  onClose,
}: {
  transaction: TransactionRow;
  /** Dismisses the whole thing — the caller drops the selected row. */
  onClose: () => void;
}) {
  const { t, formatDateString } = useI18n();
  const labels = useEnumLabels();
  const colors = useColors();
  const [sheet, setSheet] = useState<NestedSheet>(null);
  const markPaidMutation = useMarkTransactionPaidMutation();
  const setActiveMutation = useSetRecurringActiveMutation();
  const templateId = transaction.templateId;
  const series = useRecurringSeriesQuery(templateId);

  const canMarkPaid = transaction.status === TransactionStatus.WAITING_PAYMENT;
  const transferGroupId = transaction.transferGroupId;
  const isCardPurchase =
    transaction.kind === TransactionKind.CREDIT_CARD_PURCHASE;
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

  /** Dismissing a nested sheet ends the whole interaction, as the row menu did. */
  function closeNested(next: boolean) {
    if (!next) onClose();
  }

  const amount = `${isCredit ? "+" : "−"}${formatMinorUnits(
    transaction.amountCents,
    transaction.walletCurrencyCode ?? "BRL",
  )}`;

  return (
    <>
      <DetailSheet
        // Derived, never a prop the screen owns: this component has to stay
        // mounted to hold the nested sheet it just opened.
        open={sheet === null}
        onOpenChange={(next) => {
          if (!next && sheet === null) onClose();
        }}
        title={t("transaction.detail.title")}
        description={transaction.name}
        amount={amount}
        actions={
          <>
            {canMarkPaid && (
              <Button
                label={t("transaction.action.markAsPaid")}
                loading={markPaidMutation.isPending}
                onPress={() =>
                  markPaidMutation.mutate(
                    { id: transaction.id },
                    { onSuccess: onClose },
                  )
                }
              />
            )}
            <Button
              variant="outline"
              label={editLabel}
              onPress={() => setSheet("edit")}
            />

            {templateId && (
              <>
                <SeriesDivider label={t("transaction.detail.series")} />
                <Button
                  variant="outline"
                  label={t("recurring.edit.action")}
                  onPress={() => setSheet("series")}
                />
                {/* Reversible from the same place, so it needs no confirmation. */}
                <Button
                  variant="outline"
                  label={
                    series?.isActive === false
                      ? t("transaction.action.resumeSeries")
                      : t("transaction.action.pauseSeries")
                  }
                  disabled={setActiveMutation.isPending || !series}
                  onPress={() => {
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
                  }}
                />
                <Button
                  variant="destructive"
                  label={t("recurring.delete.submit")}
                  disabled={!series}
                  onPress={() => setSheet("deleteSeries")}
                />
              </>
            )}

            <View
              style={{
                marginTop: SPACING.xs,
                borderTopWidth: BORDER_WIDTH,
                borderColor: colors.border,
              }}
            />
            <Button
              variant="destructive"
              label={
                transferGroupId
                  ? t("transaction.action.deleteTransfer")
                  : t("transaction.action.delete")
              }
              onPress={() => setSheet("delete")}
            />
          </>
        }
      >
        <DetailRow label={t("common.date")}>
          {formatDateString(transaction.occurrenceDate, "day")}
        </DetailRow>
        <DetailRow label={t("common.account")}>
          {transaction.walletName ??
            transaction.creditCardName ??
            t("common.none")}
        </DetailRow>
        <DetailRow label={t("common.category")}>
          <CategoryLabel
            color={transaction.categoryColor}
            name={transaction.categoryName ?? t("category.uncategorized")}
            variant="metaMedium"
          />
        </DetailRow>
        <DetailRow label={t("transaction.filter.kind")}>
          {labels.transactionKind(transaction.kind)}
        </DetailRow>
        <DetailRow label={t("common.status")}>
          {labels.transactionStatus(transaction.status)}
        </DetailRow>
        <DetailRow label={t("transaction.column.repeats")}>
          {transactionRepeatsLabel(t, labels, transaction)}
        </DetailRow>
        {transaction.notes ? (
          <DetailRow label={t("common.notes")}>{transaction.notes}</DetailRow>
        ) : null}
      </DetailSheet>

      {sheet === "edit" &&
        (transferGroupId ? (
          <EditTransferSheet
            key={transaction.id}
            transaction={transaction}
            transferGroupId={transferGroupId}
            open
            onOpenChange={closeNested}
          />
        ) : isCardPurchase ? (
          <EditCardPurchaseSheet
            key={transaction.id}
            transaction={transaction}
            open
            onOpenChange={closeNested}
          />
        ) : isCardPayment ? (
          <EditCardPaymentSheet
            key={transaction.id}
            transaction={transaction}
            open
            onOpenChange={closeNested}
          />
        ) : (
          <EditTransactionSheet
            key={transaction.id}
            transaction={transaction}
            open
            onOpenChange={closeNested}
          />
        ))}

      {sheet === "series" && series && (
        <EditRecurringSheet
          key={series.id}
          series={series}
          open
          onOpenChange={closeNested}
        />
      )}

      {sheet === "deleteSeries" && series && (
        <DeleteRecurringSheet
          key={series.id}
          series={series}
          open
          onOpenChange={closeNested}
        />
      )}

      {sheet === "delete" && (
        <DeleteTransactionSheet
          key={transaction.id}
          transaction={transaction}
          open
          onOpenChange={closeNested}
        />
      )}
    </>
  );
}

function SeriesDivider({ label }: { label: string }) {
  const colors = useColors();

  return (
    <View
      style={{
        marginTop: SPACING.xs,
        paddingTop: SPACING.md,
        borderTopWidth: BORDER_WIDTH,
        borderColor: colors.border,
      }}
    >
      <Text variant="eyebrow" tone="muted">
        {label}
      </Text>
    </View>
  );
}
