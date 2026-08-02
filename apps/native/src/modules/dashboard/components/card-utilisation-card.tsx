import type { CardSlice } from "@budget-manager/client";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { Feather } from "@expo/vector-icons";
import { View } from "react-native";

import { Card, CardHeader } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

const NEAR_LIMIT_PERCENT = 80;

/**
 * A limit is a ratio against a ceiling, so each card gets a meter rather than a bar in
 * a chart. Severity rides the fill and is spelled out in words beside it — colour never
 * carries the warning alone.
 */
export function CardUtilisationCard({
  cards,
  currencyCode,
}: {
  cards: CardSlice[];
  currencyCode: string;
}) {
  const t = useTranslate();
  const colors = useColors();
  const ranked = [...cards].sort((a, b) => b.outstandingCents - a.outstandingCents);

  return (
    <Card>
      <CardHeader
        title={t("dashboard.cards.title")}
        description={t("dashboard.cards.description")}
      />

      <View style={{ gap: SPACING.md }}>
        {ranked.map((item) => {
          const used =
            item.limitCents > 0
              ? Math.round((item.outstandingCents / item.limitCents) * 100)
              : 0;
          const overLimit = item.availableCents < 0;
          const nearLimit = !overLimit && used >= NEAR_LIMIT_PERCENT;

          return (
            <View key={item.id} style={{ gap: SPACING.xs }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.sm,
                }}
              >
                <Text variant="small" numberOfLines={1} style={{ flex: 1 }}>
                  {item.name}
                </Text>
                <Text variant="small" style={{ fontVariant: ["tabular-nums"] }}>
                  {formatMinorUnits(item.outstandingCents, currencyCode)}
                </Text>
                <Text variant="tiny" tone="muted">
                  {`/ ${formatMinorUnits(item.limitCents, currencyCode)}`}
                </Text>
              </View>

              <Meter
                label={t("dashboard.cards.limitUsed", { name: item.name })}
                valueText={t("dashboard.cards.percentOfLimit", { percent: used })}
                segments={[
                  {
                    ratio: used / 100,
                    color: overLimit
                      ? colors.destructive
                      : nearLimit
                        ? colors.warning
                        : colors.chart[0]!,
                  },
                ]}
              />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.xs,
                }}
              >
                {(overLimit || nearLimit) && (
                  <Feather
                    name="alert-triangle"
                    size={12}
                    color={overLimit ? colors.destructive : colors.warning}
                  />
                )}
                <Text variant="tiny" tone="muted">
                  {overLimit
                    ? t("dashboard.cards.overLimit", {
                        amount: formatMinorUnits(-item.availableCents, currencyCode),
                      })
                    : t("dashboard.cards.used", {
                        percent: used,
                        amount: formatMinorUnits(item.availableCents, currencyCode),
                      })}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
