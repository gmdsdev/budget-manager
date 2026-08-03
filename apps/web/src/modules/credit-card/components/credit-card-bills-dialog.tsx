import { Pagination } from "@/components/pagination";
import { getErrorMessage } from "@budget-manager/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@budget-manager/ui/components/dialog";
import { Skeleton } from "@budget-manager/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@budget-manager/ui/components/table";
import { useI18n } from "@budget-manager/i18n/react";
import { useIsCompact } from "@budget-manager/ui/hooks/use-media-query";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { useState } from "react";
import { useCreditCardBillsQuery } from "@budget-manager/client/react";
import {
  BILL_STATUS_KEYS,
  type BillStatus,
  type CreditCardRow,
} from "@budget-manager/client";

const STATUS_TONE: Record<BillStatus, string> = {
  open: "text-muted-foreground",
  awaiting_payment: "text-destructive",
  paid: "text-success",
};

type BillRow = {
  id: string;
  periodStart: string;
  periodEnd: string;
  dueAt: string;
  status: BillStatus;
  statementTotalCents: number;
  paidCents: number;
  remainingCents: number;
};

/**
 * The same card-per-row treatment the listings get: six columns inside a dialog
 * on a phone leaves the three money ones off screen, and those are what the
 * dialog exists to show.
 */
function BillCards({
  bills,
  currencyCode,
}: {
  bills: BillRow[];
  currencyCode: string;
}) {
  const { t, formatDateString } = useI18n();

  return (
    <ul aria-label={t("creditCard.bills.listLabel")} className="divide-y divide-border overflow-hidden rounded-lg border border-border">
      {bills.map((bill) => (
        <li key={bill.id} className="space-y-2 p-3">
          <div className="flex flex-row items-start justify-between gap-2">
            <span className="min-w-0 flex-1 text-sm font-medium">
              {formatDateString(bill.periodStart, "day")} –{" "}
              {formatDateString(bill.periodEnd, "day")}
            </span>
            <span
              className={`shrink-0 text-sm tabular-nums ${
                bill.remainingCents > 0 ? "text-destructive" : ""
              }`}
            >
              {formatMinorUnits(bill.remainingCents, currencyCode)}
            </span>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <dt className="text-muted-foreground">
              {t("creditCard.bills.due")}
            </dt>
            <dd className="text-right">
              {formatDateString(bill.dueAt, "day")}
            </dd>

            <dt className="text-muted-foreground">{t("common.status")}</dt>
            <dd className={`text-right ${STATUS_TONE[bill.status]}`}>
              {t(BILL_STATUS_KEYS[bill.status])}
            </dd>

            <dt className="text-muted-foreground">
              {t("creditCard.bills.statement")}
            </dt>
            <dd className="text-right tabular-nums">
              {formatMinorUnits(bill.statementTotalCents, currencyCode)}
            </dd>

            <dt className="text-muted-foreground">
              {t("creditCard.bills.paid")}
            </dt>
            <dd className="text-right tabular-nums">
              {formatMinorUnits(bill.paidCents, currencyCode)}
            </dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}

export function CreditCardBillsDialog({
  card,
  open,
  onOpenChange,
}: {
  card: CreditCardRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, formatDateString } = useI18n();
  const [page, setPage] = useState(1);
  const isCompact = useIsCompact();
  const { data, isPending, isError, error, isFetching } =
    useCreditCardBillsQuery(card.id, page);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t("creditCard.bills.title", { name: card.name })}
          </DialogTitle>
          <DialogDescription>
            {t("creditCard.bills.description", {
              closeDay: card.closeDay,
              dueDay: card.dueDay,
            })}
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className="space-y-2" role="status" aria-label={t("creditCard.bills.loading")}>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
        ) : data.rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("creditCard.bills.empty")}
          </p>
        ) : (
          <>
            {isCompact ? (
              <BillCards bills={data.rows} currencyCode={data.currencyCode} />
            ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">
                      {t("creditCard.bills.period")}
                    </TableHead>
                    <TableHead scope="col">
                      {t("creditCard.bills.due")}
                    </TableHead>
                    <TableHead scope="col">{t("common.status")}</TableHead>
                    <TableHead scope="col" className="text-right">
                      {t("creditCard.bills.statement")}
                    </TableHead>
                    <TableHead scope="col" className="text-right">
                      {t("creditCard.bills.paid")}
                    </TableHead>
                    <TableHead scope="col" className="text-right">
                      {t("creditCard.bills.remaining")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateString(bill.periodStart, "day")} –{" "}
                        {formatDateString(bill.periodEnd, "day")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateString(bill.dueAt, "day")}
                      </TableCell>
                      <TableCell
                        className={STATUS_TONE[bill.status]}
                      >
                        {t(BILL_STATUS_KEYS[bill.status])}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMinorUnits(
                          bill.statementTotalCents,
                          data.currencyCode,
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMinorUnits(bill.paidCents, data.currencyCode)}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums ${
                          bill.remainingCents > 0 ? "text-destructive" : ""
                        }`}
                      >
                        {formatMinorUnits(
                          bill.remainingCents,
                          data.currencyCode,
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
            <Pagination
              page={page}
              total={data.total}
              onPageChange={setPage}
              isFetching={isFetching}
              resource="statements"
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
