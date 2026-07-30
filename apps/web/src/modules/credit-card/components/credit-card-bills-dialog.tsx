import { Pagination } from "@/components/pagination";
import { getErrorMessage } from "@/utils/error-message";
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
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { useState } from "react";
import {
  BILL_STATUS_LABELS,
  useCreditCardBillsQuery,
  type BillStatus,
} from "../queries/use-credit-card-bills-query";
import type { CreditCardRow } from "../types";

function formatDay(value: string) {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
  ).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_TONE: Record<BillStatus, string> = {
  open: "text-muted-foreground",
  awaiting_payment: "text-destructive",
  paid: "text-emerald-600 dark:text-emerald-400",
};

export function CreditCardBillsDialog({
  card,
  open,
  onOpenChange,
}: {
  card: CreditCardRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, isFetching } =
    useCreditCardBillsQuery(card.id, page);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Statements — {card.name}</DialogTitle>
          <DialogDescription>
            Closes on day {card.closeDay}, due on day {card.dueDay}. A statement
            opens the first time you buy something in its cycle.
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className="space-y-2" role="status" aria-label="Loading statements">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
        ) : data.rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No statements yet. Record a card purchase and the statement for its
            cycle appears here.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Period</TableHead>
                    <TableHead scope="col">Due</TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col" className="text-right">
                      Statement
                    </TableHead>
                    <TableHead scope="col" className="text-right">
                      Paid
                    </TableHead>
                    <TableHead scope="col" className="text-right">
                      Remaining
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDay(bill.periodStart)} – {formatDay(bill.periodEnd)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDay(bill.dueAt)}
                      </TableCell>
                      <TableCell
                        className={STATUS_TONE[bill.status]}
                      >
                        {BILL_STATUS_LABELS[bill.status] ??
                          bill.status}
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
            <Pagination
              page={page}
              total={data.total}
              onPageChange={setPage}
              isFetching={isFetching}
              label="statements"
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
