import { subscriptionAction, subscriptionCopy } from "@budget-manager/client";
import { useSubscriptionStatusQuery } from "@budget-manager/client/react";
import { formatDate, type MessageKey } from "@budget-manager/i18n";
import { useLocale, useTranslate } from "@budget-manager/i18n/react";
import { TRIAL_DAYS } from "@budget-manager/schemas";
import { useCallback } from "react";
import { ActivityIndicator, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useSignOut } from "@/hooks/use-sign-out";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { SPACING } from "@/theme/tokens";

import { useBillingActions } from "../components/use-billing-actions";

const ACTION_LABELS = {
  start: "subscription.action.startTrial",
  subscribe: "subscription.action.subscribe",
  updatePayment: "subscription.action.updatePayment",
  manage: "subscription.action.manage",
} as const satisfies Record<string, MessageKey>;

export function BillingScreen() {
  const t = useTranslate();
  const locale = useLocale();
  const signOut = useSignOut();
  const {
    data: status,
    isPending,
    refetch,
    isFetching,
  } = useSubscriptionStatusQuery();
  const onReturn = useCallback(() => void refetch(), [refetch]);
  const { pending, subscribe, manage } = useBillingActions({ onReturn });

  if (isPending || !status) {
    return (
      <AuthCard title={t("subscription.title")}>
        <ActivityIndicator accessibilityLabel={t("subscription.loading")} />
      </AuthCard>
    );
  }

  const copy = subscriptionCopy(status);
  const action = subscriptionAction(status);
  const date = (value: string) => formatDate(locale, new Date(value), "day");

  const title =
    copy.kind === "start"
      ? t("subscription.paywall.startTitle", { days: copy.days })
      : copy.kind === "trialing"
        ? t("subscription.paywall.trialTitle")
        : copy.kind === "pastDue"
          ? t("subscription.paywall.pastDueTitle")
          : copy.kind === "expired"
            ? t("subscription.paywall.title")
            : t("subscription.paywall.activeTitle");

  const description =
    copy.kind === "start"
      ? t("subscription.paywall.startDescription")
      : copy.kind === "trialing"
        ? copy.endsAt
          ? t("subscription.trial.endsOn", { date: date(copy.endsAt) })
          : t("subscription.paywall.activeDescription")
        : copy.kind === "pastDue"
          ? t("subscription.paywall.pastDueDescription")
          : copy.kind === "expired"
            ? t("subscription.paywall.description")
            : copy.kind === "unmanaged"
              ? t("subscription.unavailable")
              : copy.endsAt
                ? t(
                    copy.ending
                      ? "subscription.endsOn"
                      : "subscription.renewsOn",
                    { date: date(copy.endsAt) },
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
              variant={action === "manage" ? "outline" : "default"}
              label={t(ACTION_LABELS[action])}
              loading={pending !== null}
              onPress={
                action === "start" || action === "subscribe" ? subscribe : manage
              }
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

        <Button variant="ghost" label={t("nav.signOut")} onPress={signOut} />
      </View>
    </AuthCard>
  );
}
