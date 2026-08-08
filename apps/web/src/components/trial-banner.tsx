import {
  subscriptionNeedsAttention,
  type SubscriptionStatusRow,
} from "@budget-manager/client";
import { useSubscriptionStatusQuery } from "@budget-manager/client/react";
import { formatDate } from "@budget-manager/i18n";
import { useLocale, useTranslate } from "@budget-manager/i18n/react";
import { SubscriptionAccessState } from "@budget-manager/schemas";
import { buttonVariants } from "@budget-manager/ui/components/button";
import { Link } from "@tanstack/react-router";

export function TrialBanner() {
  const t = useTranslate();
  const locale = useLocale();
  const { data: status } = useSubscriptionStatusQuery();

  if (!subscriptionNeedsAttention(status) || !status) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-content-secondary">{message(status)}</p>
      <Link
        to="/billing"
        className={buttonVariants({ size: "sm", variant: "outline" })}
      >
        {status.state === SubscriptionAccessState.PAST_DUE
          ? t("subscription.action.updatePayment")
          : t("subscription.action.subscribe")}
      </Link>
    </div>
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
