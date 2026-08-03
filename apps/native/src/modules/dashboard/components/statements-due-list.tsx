import type { StatementDue } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { Feather } from "@expo/vector-icons";

import {
  RecordGlyph,
  RecordList,
  RecordRow,
  RecordTag,
} from "@/components/record-row";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";

// `as const` keeps each value a literal key, so `t` can see that none of them takes a
// placeholder.

const STATUS_KEYS = {
  open: "dashboard.statements.status.open",
  awaiting_payment: "dashboard.statements.status.awaiting_payment",
  paid: "dashboard.statements.status.paid",
} as const;

function isKnownStatus(status: string): status is keyof typeof STATUS_KEYS {
  return status in STATUS_KEYS;
}

/**
 * What the cards still owe, soonest due first. These two lists exist to show what
 * needs acting on, which is why they carry no filters of their own — the month and
 * currency above them are the only scope they take. The rows are the shared
 * `RecordRow`, so a statement reads exactly as a ledger row does.
 */
export function StatementsDueList({
  statements,
  today,
  onOpenCards,
}: {
  statements: StatementDue[];
  today: string;
  onOpenCards: () => void;
}) {
  const { t, formatDateString } = useI18n();
  const colors = useColors();
  const overdueCount = statements.filter((bill) => bill.dueAt < today).length;

  return (
    <Card>
      <CardHeader
        title={t("dashboard.statements.title")}
        description={
          overdueCount === 0
            ? t("dashboard.statements.none")
            : overdueCount === 1
              ? t("dashboard.statements.oneOverdue")
              : t("dashboard.statements.overdue", { count: overdueCount })
        }
      />

      {statements.length === 0 ? (
        <Text variant="meta" tone="muted">
          {t("dashboard.statements.empty")}
        </Text>
      ) : (
        <>
          <RecordList label={t("dashboard.statements.title")}>
            {statements.map((bill) => {
              const overdue = bill.dueAt < today;
              const ink = overdue ? colors.destructive : colors.mutedForeground;

              return (
                <RecordRow
                  key={bill.id}
                  // A statement has no detail view of its own, so the row goes
                  // where it can be acted on: its card, whose statements sheet is
                  // the one place a bill is settled.
                  label={t("dashboard.statements.open", {
                    name: bill.creditCardName,
                  })}
                  onSelect={onOpenCards}
                  glyph={
                    <RecordGlyph color={ink}>
                      <Feather name="credit-card" size={20} color={ink} />
                    </RecordGlyph>
                  }
                  primary={bill.creditCardName}
                  // Two entries, not three. `partiallyPaid` is two more amounts on a
                  // line that already carries a date and a status: it ran past the
                  // second line and truncated *inside* a figure, which is worse than
                  // not stating it — and what remains to pay is the number opposite,
                  // with the full split a tap away on the card's statements sheet.
                  meta={[
                    t("dashboard.statements.due", {
                      date: formatDateString(bill.dueAt, "monthDay"),
                    }),
                    isKnownStatus(bill.status)
                      ? t(STATUS_KEYS[bill.status])
                      : bill.status,
                  ]}
                  tag={
                    overdue ? (
                      <RecordTag tone="negative">
                        {t("dashboard.pending.overdueFlag")}
                      </RecordTag>
                    ) : undefined
                  }
                  trailing={
                    <Text
                      variant="figureRow"
                      tone={overdue ? "destructive" : "default"}
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {formatMinorUnits(bill.remainingCents, bill.currencyCode)}
                    </Text>
                  }
                />
              );
            })}
          </RecordList>

          <Button
            variant="outline"
            size="sm"
            label={t("dashboard.statements.action")}
            onPress={onOpenCards}
          />
        </>
      )}
    </Card>
  );
}
