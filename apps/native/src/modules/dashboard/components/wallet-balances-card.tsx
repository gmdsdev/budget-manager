import type { WalletSlice } from "@budget-manager/client";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { View } from "react-native";

import { Amount } from "@/components/amount";
import { Card, CardHeader } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

export function WalletBalancesCard({
  wallets,
  currencyCode,
}: {
  wallets: WalletSlice[];
  currencyCode: string;
}) {
  const t = useTranslate();
  const colors = useColors();
  const ranked = [...wallets].sort((a, b) => b.balanceCents - a.balanceCents);
  // Scaled on the largest magnitude so an overdrawn wallet still gets a bar.
  const widest = ranked.reduce(
    (largest, item) => Math.max(largest, Math.abs(item.balanceCents)),
    0,
  );

  return (
    <Card>
      <CardHeader
        title={t("dashboard.wallets.title")}
        description={t("dashboard.wallets.description")}
      />

      <View style={{ gap: SPACING.md }}>
        {ranked.map((item) => {
          const negative = item.balanceCents < 0;
          const pending = item.projectedBalanceCents !== item.balanceCents;

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
                <Amount
                  cents={item.balanceCents}
                  currencyCode={currencyCode}
                  variant="small"
                />
              </View>

              <Meter
                segments={[
                  {
                    ratio:
                      widest > 0 ? Math.abs(item.balanceCents) / widest : 0,
                    color: negative ? colors.chartExpense : colors.chart[0]!,
                  },
                ]}
              />

              {pending && (
                <Text variant="tiny" tone="muted">
                  {t("dashboard.wallets.pending", {
                    amount: formatMinorUnits(item.projectedBalanceCents, currencyCode),
                  })}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </Card>
  );
}
