import type { PendingItem } from "@budget-manager/client";
import { useEnumLabels } from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Swatch } from "@/components/ui/swatch";
import { Text } from "@/components/ui/text";
import { categoryColorOrNeutral } from "@/modules/category/colors";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

// `as const` keeps each value a literal key, so `t` can see that none of them takes a
// placeholder.

/** Everything awaiting payment, overdue included and oldest first. */
export function PendingList({
  items,
  today,
  onOpenTransactions,
}: {
  items: PendingItem[];
  today: string;
  onOpenTransactions: () => void;
}) {
  const { t, formatDateString } = useI18n();
  const labels = useEnumLabels();
  const colors = useColors();
  const overdueCount = items.filter((item) => item.occurrenceDate < today).length;

  return (
    <Card>
      <CardHeader
        title={t("dashboard.pending.title")}
        description={
          overdueCount > 0
            ? t("dashboard.pending.overdue", { count: overdueCount })
            : t("dashboard.pending.none")
        }
      />

      {items.length === 0 ? (
        <Text variant="tiny" tone="muted">
          {t("dashboard.pending.empty")}
        </Text>
      ) : (
        <View style={{ gap: SPACING.md }}>
          {items.map((item) => {
            const overdue = item.occurrenceDate < today;

            return (
              <View
                key={item.id}
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
                      {item.name}
                    </Text>
                    {overdue && (
                      <Text variant="tiny" tone="destructive">
                        {t("dashboard.pending.overdueFlag")}
                      </Text>
                    )}
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: SPACING.xs,
                    }}
                  >
                    <Text variant="tiny" tone="muted">
                      {formatDateString(item.occurrenceDate, "monthDay")}
                      {" · "}
                      {item.walletName ?? item.creditCardName ?? t("common.none")}
                    </Text>
                    {item.categoryName ? (
                      <>
                        <Swatch
                          color={categoryColorOrNeutral(colors, item.categoryColor)}
                          size={8}
                        />
                        <Text variant="tiny" tone="muted" numberOfLines={1}>
                          {item.categoryName}
                        </Text>
                      </>
                    ) : null}
                  </View>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    variant="small"
                    tone={overdue ? "destructive" : "default"}
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {formatMinorUnits(item.amountCents, item.walletCurrencyCode)}
                  </Text>
                  <Text variant="tiny" tone="muted">
                    {labels.transactionKind(item.kind)}
                  </Text>
                </View>
              </View>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            label={t("dashboard.pending.action")}
            onPress={onOpenTransactions}
          />
        </View>
      )}
    </Card>
  );
}
