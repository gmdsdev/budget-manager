import {
  subscriptionNeedsAttention,
  type SubscriptionStatusRow,
} from "@budget-manager/client";
import { useSubscriptionStatusQuery } from "@budget-manager/client/react";
import { formatDate } from "@budget-manager/i18n";
import { useLocale, useTranslate } from "@budget-manager/i18n/react";
import { SubscriptionAccessState } from "@budget-manager/schemas";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/theme/tokens";

export function TrialBanner() {
  const t = useTranslate();
  const locale = useLocale();
  const router = useRouter();
  const { data: status } = useSubscriptionStatusQuery();

  if (!subscriptionNeedsAttention(status) || !status) {
    return null;
  }

  return (
    <Surface style={{ padding: SPACING.md, gap: SPACING.sm }}>
      <Text variant="meta" tone="secondary">
        {message(status)}
      </Text>
      <View style={{ alignItems: "flex-start" }}>
        <Button
          size="sm"
          variant="outline"
          label={
            status.state === SubscriptionAccessState.PAST_DUE
              ? t("subscription.action.updatePayment")
              : t("subscription.action.manage")
          }
          onPress={() => router.push("/billing")}
        />
      </View>
    </Surface>
  );

  function message(row: SubscriptionStatusRow) {
    if (row.state === SubscriptionAccessState.PAST_DUE) {
      return t("subscription.paywall.pastDueTitle");
    }

    if (row.state === SubscriptionAccessState.TRIALING) {
      return row.trialDaysRemaining === 0
        ? t("subscription.trial.lastDay")
        : t("subscription.trial.daysLeft", { days: row.trialDaysRemaining });
    }

    return row.currentPeriodEnd
      ? t("subscription.endsOn", {
          date: formatDate(locale, new Date(row.currentPeriodEnd), "day"),
        })
      : t("subscription.state.expired");
  }
}
