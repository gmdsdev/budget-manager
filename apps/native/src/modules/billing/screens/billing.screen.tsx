import { useSubscriptionStatusQuery } from "@budget-manager/client/react";
import { formatDate } from "@budget-manager/i18n";
import { useLocale, useTranslate } from "@budget-manager/i18n/react";
import { SubscriptionAccessState, TRIAL_DAYS } from "@budget-manager/schemas";
import { useCallback } from "react";
import { ActivityIndicator, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useSignOut } from "@/hooks/use-sign-out";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { SPACING } from "@/theme/tokens";

import { useBillingActions } from "../components/use-billing-actions";

export function BillingScreen() {
  const t = useTranslate();
  const locale = useLocale();
  const signOut = useSignOut();
  const { data: status, isPending, refetch, isFetching } = useSubscriptionStatusQuery();
  const onReturn = useCallback(() => void refetch(), [refetch]);
  const { pending, subscribe, manage } = useBillingActions({ onReturn });

  const date = (value: string) => formatDate(locale, new Date(value), "day");

  if (isPending || !status) {
    return (
      <AuthCard title={t("subscription.title")}>
        <ActivityIndicator accessibilityLabel={t("subscription.loading")} />
      </AuthCard>
    );
  }

  const expired = status.state === SubscriptionAccessState.EXPIRED;
  const pastDue = status.state === SubscriptionAccessState.PAST_DUE;
  const trialing = status.state === SubscriptionAccessState.TRIALING;

  const title = expired
    ? t("subscription.paywall.title")
    : pastDue
      ? t("subscription.paywall.pastDueTitle")
      : trialing
        ? t("subscription.paywall.trialTitle")
        : t("subscription.paywall.activeTitle");

  const description = expired
    ? t("subscription.paywall.description")
    : pastDue
      ? t("subscription.paywall.pastDueDescription")
      : trialing
        ? t("subscription.trial.endsOn", { date: date(status.trialEndsAt) })
        : status.currentPeriodEnd
          ? t(
              status.cancelAtPeriodEnd
                ? "subscription.endsOn"
                : "subscription.renewsOn",
              { date: date(status.currentPeriodEnd) },
            )
          : t("subscription.paywall.activeDescription");

  return (
    <AuthCard title={title}>
      <View style={{ gap: SPACING.lg }}>
        <Text tone="secondary">{description}</Text>
        <Text variant="meta" tone="muted">
          {t("subscription.description", { days: TRIAL_DAYS })}
        </Text>

        {status.billingEnabled ? (
          <View style={{ gap: SPACING.sm }}>
            <Button
              size="lg"
              label={
                expired || trialing
                  ? t("subscription.action.subscribe")
                  : pastDue
                    ? t("subscription.action.updatePayment")
                    : t("subscription.action.manage")
              }
              loading={pending !== null}
              onPress={expired || trialing ? subscribe : manage}
            />
            <Button
              variant="ghost"
              label={t("subscription.action.refresh")}
              loading={isFetching}
              onPress={onReturn}
            />
          </View>
        ) : (
          <Text variant="meta" tone="secondary">
            {t("subscription.unavailable")}
          </Text>
        )}

        <Button
          variant="ghost"
          label={t("nav.signOut")}
          onPress={signOut}
        />
      </View>
    </AuthCard>
  );
}
