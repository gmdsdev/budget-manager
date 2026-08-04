import { Link, useNavigate } from "@tanstack/react-router";
import {
  RecordFigure,
  RecordGlyph,
  RecordList,
  RecordRow,
  RecordTag,
} from "@/components/record-row";
import { CreditCardIcon } from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@budget-manager/ui/components/card";
import { useI18n } from "@budget-manager/i18n/react";
import { buttonVariants } from "@budget-manager/ui/components/button";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { StatementDue } from "@budget-manager/client";

// `as const` keeps each value a literal key, so `t` can see that none of them
// takes a placeholder.
const STATUS_KEYS = {
  open: "dashboard.statements.status.open",
  awaiting_payment: "dashboard.statements.status.awaiting_payment",
  paid: "dashboard.statements.status.paid",
} as const;

function isKnownStatus(status: string): status is keyof typeof STATUS_KEYS {
  return status in STATUS_KEYS;
}

export function StatementsDueList({
  statements,
  today,
}: {
  statements: StatementDue[];
  today: string;
}) {
  const { t, formatDateString } = useI18n();
  const navigate = useNavigate();
  const overdueCount = statements.filter((bill) => bill.dueAt < today).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.statements.title")}</CardTitle>
        <CardDescription>
          {overdueCount === 0
            ? t("dashboard.statements.none")
            : overdueCount === 1
              ? t("dashboard.statements.oneOverdue")
              : t("dashboard.statements.overdue", { count: overdueCount })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {statements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.statements.empty")}
          </p>
        ) : (
          <RecordList label={t("dashboard.statements.title")}>
            {statements.map((bill) => {
              const overdue = bill.dueAt < today;

              return (
                <RecordRow
                  key={bill.id}
                  // A statement has no detail view of its own, so the row goes
                  // where it can be acted on: its card, whose Statements dialog
                  // is the one place a bill is settled.
                  label={t("dashboard.statements.open", {
                    name: bill.creditCardName,
                  })}
                  onSelect={() => void navigate({ to: "/credit-card" })}
                  glyph={
                    <RecordGlyph
                      color={overdue ? "var(--destructive)" : undefined}
                    >
                      <CreditCardIcon className="size-5" />
                    </RecordGlyph>
                  }
                  primary={bill.creditCardName}
                  meta={[
                    t("dashboard.statements.due", {
                      date: formatDateString(bill.dueAt, "monthDay"),
                    }),
                    `${formatDateString(bill.periodStart, "monthDay")}–${formatDateString(bill.periodEnd, "monthDay")}`,
                    isKnownStatus(bill.status)
                      ? t(STATUS_KEYS[bill.status])
                      : bill.status,
                    bill.paidCents > 0
                      ? t("dashboard.statements.partiallyPaid", {
                          paid: formatMinorUnits(
                            bill.paidCents,
                            bill.currencyCode,
                          ),
                          total: formatMinorUnits(
                            bill.statementTotalCents,
                            bill.currencyCode,
                          ),
                        })
                      : null,
                  ]}
                  tag={
                    overdue ? (
                      <RecordTag tone="negative">
                        {t("dashboard.pending.overdueFlag")}
                      </RecordTag>
                    ) : null
                  }
                  trailing={
                    <RecordFigure tone={overdue ? "negative" : "default"}>
                      {formatMinorUnits(bill.remainingCents, bill.currencyCode)}
                    </RecordFigure>
                  }
                />
              );
            })}
          </RecordList>
        )}
      </CardContent>

      {statements.length > 0 && (
        <CardContent className="pt-0">
          <Link
            to="/transaction"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("dashboard.statements.action")}
          </Link>
        </CardContent>
      )}
    </Card>
  );
}
