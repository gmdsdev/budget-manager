import { TransactionKind, TransactionStatus } from "@budget-manager/schemas";
import { Button } from "@budget-manager/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@budget-manager/ui/components/dropdown-menu";
import { useTranslate } from "@budget-manager/i18n/react";
import { DotsThreeIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSetRecurringActiveMutation } from "@/modules/recurring/mutations/use-recurring-mutation";
import { DeleteRecurringDialog } from "@/modules/recurring/components/delete-recurring-dialog";
import { EditRecurringDialog } from "@/modules/recurring/components/edit-recurring-dialog";
import { useRecurringSeriesQuery } from "@/modules/recurring/queries/use-recurring-query";
import { useMarkTransactionPaidMutation } from "../../mutations/use-transaction-mutation";
import type { TransactionRow } from "../../types";
import { DeleteTransactionDialog } from "../delete-transaction-dialog";
import { EditCardPaymentDialog } from "../edit-card-payment-dialog";
import { EditCardPurchaseDialog } from "../edit-card-purchase-dialog";
import { EditTransactionDialog } from "../edit-transaction-dialog";
import { EditTransferDialog } from "../edit-transfer-dialog";

type RowDialog = "edit" | "delete" | "series" | "deleteSeries" | null;

export function TransactionRowActions({
  transaction,
}: {
  transaction: TransactionRow;
}) {
  const t = useTranslate();
  const [dialog, setDialog] = useState<RowDialog>(null);
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

  // Each shape has its own editor; the plain form cannot carry a card or a
  // transfer pair, and the server rejects it if tried.
  const editLabel = transferGroupId
    ? t("transaction.action.editTransfer")
    : isCardPurchase
      ? t("transaction.action.editPurchase")
      : isCardPayment
        ? t("transaction.action.editPayment")
        : t("transaction.action.edit");

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon">
              <DotsThreeIcon />
              <span className="sr-only">
                {t("common.actionsFor", { name: transaction.name })}
              </span>
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {canMarkPaid && (
            <DropdownMenuItem
              disabled={markPaidMutation.isPending}
              onClick={() => markPaidMutation.mutate({ id: transaction.id })}
            >
              {t("transaction.action.markAsPaid")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setDialog("edit")}>
            {editLabel}
          </DropdownMenuItem>
          {templateId && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDialog("series")}>
                {t("recurring.edit.action")}
              </DropdownMenuItem>
              <DropdownMenuItem
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
              </DropdownMenuItem>
              {/* Confirmed like every other destructive action: deleting a
                  series drops the rule and every occurrence it laid down that
                  has not happened yet, across months, and none of that is
                  recoverable. */}
              <DropdownMenuItem
                variant="destructive"
                disabled={!series}
                onClick={() => setDialog("deleteSeries")}
              >
                {t("recurring.delete.submit")}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDialog("delete")}
          >
            {transferGroupId
              ? t("transaction.action.deleteTransfer")
              : t("transaction.action.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {dialog === "edit" &&
        (transferGroupId ? (
          <EditTransferDialog
            key={transaction.id}
            transaction={transaction}
            transferGroupId={transferGroupId}
            open
            onOpenChange={(next) => setDialog(next ? "edit" : null)}
          />
        ) : isCardPurchase ? (
          <EditCardPurchaseDialog
            key={transaction.id}
            transaction={transaction}
            open
            onOpenChange={(next) => setDialog(next ? "edit" : null)}
          />
        ) : isCardPayment ? (
          <EditCardPaymentDialog
            key={transaction.id}
            transaction={transaction}
            open
            onOpenChange={(next) => setDialog(next ? "edit" : null)}
          />
        ) : (
          <EditTransactionDialog
            key={transaction.id}
            transaction={transaction}
            open
            onOpenChange={(next) => setDialog(next ? "edit" : null)}
          />
        ))}

      {dialog === "series" && series && (
        <EditRecurringDialog
          key={series.id}
          series={series}
          open
          onOpenChange={(next) => setDialog(next ? "series" : null)}
        />
      )}

      {dialog === "deleteSeries" && series && (
        <DeleteRecurringDialog
          key={series.id}
          series={series}
          open
          onOpenChange={(next) => setDialog(next ? "deleteSeries" : null)}
        />
      )}

      {dialog === "delete" && (
        <DeleteTransactionDialog
          key={transaction.id}
          transaction={transaction}
          open
          onOpenChange={(next) => setDialog(next ? "delete" : null)}
        />
      )}
    </div>
  );
}
