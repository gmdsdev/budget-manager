import {
  useEnumLabels,
  useMarkTransactionPaidMutation,
  useRecurringSeriesQuery,
  useSetRecurringActiveMutation,
} from "@budget-manager/client/react";
import {
  transactionRepeatsLabel,
  type TransactionRow,
} from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import {
  CREDITED_TRANSACTION_KINDS,
  TransactionKind,
  TransactionStatus,
} from "@budget-manager/schemas";
import { Button } from "@budget-manager/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@budget-manager/ui/components/dialog";
import { Separator } from "@budget-manager/ui/components/separator";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { CategoryLabel } from "@/modules/category/components/category-dot";
import { DeleteRecurringDialog } from "@/modules/recurring/components/delete-recurring-dialog";
import { EditRecurringDialog } from "@/modules/recurring/components/edit-recurring-dialog";
import { DeleteTransactionDialog } from "./delete-transaction-dialog";
import { EditCardPaymentDialog } from "./edit-card-payment-dialog";
import { EditCardPurchaseDialog } from "./edit-card-purchase-dialog";
import { EditTransactionDialog } from "./edit-transaction-dialog";
import { EditTransferDialog } from "./edit-transfer-dialog";

type NestedDialog = "edit" | "delete" | "series" | "deleteSeries" | null;

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-row items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium [&>*]:justify-end">
        {children}
      </dd>
    </div>
  );
}

/**
 * The row is the way in to a transaction, and this is what it opens: the record
 * in full, with every action on it gathered in one place. The list itself
 * carries no menu — an irreversible action one mis-tap from a dropdown in a
 * table of hundreds of rows is a trap, and the row already has somewhere to go.
 */
export function TransactionDetailDialog({
  transaction,
  onClose,
}: {
  transaction: TransactionRow;
  /** Dismisses the whole thing — the caller drops the selected row. */
  onClose: () => void;
}) {
  const { t, formatDateString } = useI18n();
  const labels = useEnumLabels();
  const [dialog, setDialog] = useState<NestedDialog>(null);
  const markPaidMutation = useMarkTransactionPaidMutation();
  const setActiveMutation = useSetRecurringActiveMutation();
  const templateId = transaction.templateId;
  const series = useRecurringSeriesQuery(templateId);

  const canMarkPaid = transaction.status === TransactionStatus.WAITING_PAYMENT;
  const transferGroupId = transaction.transferGroupId;
  const isCardPurchase =
    transaction.kind === TransactionKind.CREDIT_CARD_PURCHASE;
  const isCardPayment =
    transaction.kind === TransactionKind.CREDIT_CARD_PAYMENT;
  const isCredit = CREDITED_TRANSACTION_KINDS.includes(transaction.kind);

  // Each shape has its own editor; the plain form cannot carry a card or a
  // transfer pair, and the server rejects it if tried.
  const editLabel = transferGroupId
    ? t("transaction.action.editTransfer")
    : isCardPurchase
      ? t("transaction.action.editPurchase")
      : isCardPayment
        ? t("transaction.action.editPayment")
        : t("transaction.action.edit");

  // A nested dialog replaces this one rather than stacking on it: two modals
  // deep, Escape becomes ambiguous and the scrim doubles up. Which is also why
  // the detail view's own `open` is derived — this component has to stay
  // mounted to hold the nested dialog it just opened.
  function openNested(next: Exclude<NestedDialog, null>) {
    setDialog(next);
  }

  /** Dismissing a nested dialog ends the whole interaction, as the old row menu did. */
  function closeNested(next: boolean) {
    if (!next) onClose();
  }

  return (
    <>
      <Dialog
        open={dialog === null}
        onOpenChange={(next) => {
          if (!next && dialog === null) onClose();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("transaction.detail.title")}</DialogTitle>
            <DialogDescription>{transaction.name}</DialogDescription>
          </DialogHeader>

          <p
            className={`text-3xl font-bold tracking-[-0.04em] tabular-nums ${
              isCredit ? "text-success" : ""
            }`}
          >
            {isCredit ? "+" : "−"}
            {formatMinorUnits(
              transaction.amountCents,
              transaction.walletCurrencyCode ?? "BRL",
            )}
          </p>

          <dl className="divide-y divide-border">
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
                name={
                  transaction.categoryName ?? t("category.uncategorized")
                }
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
              <DetailRow label={t("common.notes")}>
                <span className="whitespace-pre-wrap">{transaction.notes}</span>
              </DetailRow>
            ) : null}
          </dl>

          <div className="flex flex-col gap-2">
            {canMarkPaid && (
              <Button
                size="default"
                disabled={markPaidMutation.isPending}
                onClick={() =>
                  markPaidMutation.mutate(
                    { id: transaction.id },
                    { onSuccess: onClose },
                  )
                }
              >
                {t("transaction.action.markAsPaid")}
              </Button>
            )}
            <Button
              variant="outline"
              size="default"
              onClick={() => openNested("edit")}
            >
              {editLabel}
            </Button>

            {templateId && (
              <>
                <Separator className="my-1" />
                <p className="text-xs font-semibold tracking-[0.02em] uppercase text-muted-foreground">
                  {t("transaction.detail.series")}
                </p>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => openNested("series")}
                >
                  {t("recurring.edit.action")}
                </Button>
                {/* Reversible from the same place, so it needs no confirmation
                    and no scrim of its own. */}
                <Button
                  variant="outline"
                  size="default"
                  disabled={setActiveMutation.isPending || !series}
                  onClick={() =>
                    series &&
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
                    )
                  }
                >
                  {series?.isActive === false
                    ? t("transaction.action.resumeSeries")
                    : t("transaction.action.pauseSeries")}
                </Button>
                <Button
                  variant="destructive"
                  size="default"
                  disabled={!series}
                  onClick={() => openNested("deleteSeries")}
                >
                  {t("recurring.delete.submit")}
                </Button>
              </>
            )}

            <Separator className="my-1" />
            <Button
              variant="destructive"
              size="default"
              onClick={() => openNested("delete")}
            >
              {transferGroupId
                ? t("transaction.action.deleteTransfer")
                : t("transaction.action.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {dialog === "edit" &&
        (transferGroupId ? (
          <EditTransferDialog
            key={transaction.id}
            transaction={transaction}
            transferGroupId={transferGroupId}
            open
            onOpenChange={closeNested}
          />
        ) : isCardPurchase ? (
          <EditCardPurchaseDialog
            key={transaction.id}
            transaction={transaction}
            open
            onOpenChange={closeNested}
          />
        ) : isCardPayment ? (
          <EditCardPaymentDialog
            key={transaction.id}
            transaction={transaction}
            open
            onOpenChange={closeNested}
          />
        ) : (
          <EditTransactionDialog
            key={transaction.id}
            transaction={transaction}
            open
            onOpenChange={closeNested}
          />
        ))}

      {dialog === "series" && series && (
        <EditRecurringDialog
          key={series.id}
          series={series}
          open
          onOpenChange={closeNested}
        />
      )}

      {dialog === "deleteSeries" && series && (
        <DeleteRecurringDialog
          key={series.id}
          series={series}
          open
          onOpenChange={closeNested}
        />
      )}

      {dialog === "delete" && (
        <DeleteTransactionDialog
          key={transaction.id}
          transaction={transaction}
          open
          onOpenChange={closeNested}
        />
      )}
    </>
  );
}
