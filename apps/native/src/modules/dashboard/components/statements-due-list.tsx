import type { StatementDue } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

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
 * currency above them are the only scope they take.
 */
export function StatementsDueList({
  statements,
  today,
  onOpenTransactions,
}: {
  statements: StatementDue[];
  today: string;
  onOpenTransactions: () => void;
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
        <Text variant="tiny" tone="muted">
          {t("dashboard.statements.empty")}
        </Text>
      ) : (
        <View style={{ gap: SPACING.md }}>
          {statements.map((bill) => {
            const overdue = bill.dueAt < today;

            return (
              <View
                key={bill.id}
                style={{ flexDirection: "row", gap: SPACING.sm, alignItems: "flex-start" }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    marginTop: 6,
                    backgroundColor: overdue
                      ? colors.destructive
                      : colors.mutedForeground,
                  }}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: SPACING.sm,
                    }}
                  >
                    <Text variant="small" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {bill.creditCardName}
                    </Text>
                    {overdue && (
                      <Text variant="tiny" tone="destructive">
                        {t("dashboard.pending.overdueFlag")}
                      </Text>
                    )}
                  </View>
                  <Text variant="tiny" tone="muted">
                    {t("dashboard.statements.due", {
                      date: formatDateString(bill.dueAt, "monthDay"),
                    })}
                    {" · "}
                    {isKnownStatus(bill.status)
                      ? t(STATUS_KEYS[bill.status])
                      : bill.status}
                  </Text>
                  {bill.paidCents > 0 && (
                    <Text variant="tiny" tone="muted">
                      {t("dashboard.statements.partiallyPaid", {
                        paid: formatMinorUnits(bill.paidCents, bill.currencyCode),
                        total: formatMinorUnits(
                          bill.statementTotalCents,
                          bill.currencyCode,
                        ),
                      })}
                    </Text>
                  )}
                </View>
                <Text
                  variant="small"
                  tone={overdue ? "destructive" : "default"}
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatMinorUnits(bill.remainingCents, bill.currencyCode)}
                </Text>
              </View>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            label={t("dashboard.statements.action")}
            onPress={onOpenTransactions}
          />
        </View>
      )}
    </Card>
  );
}
