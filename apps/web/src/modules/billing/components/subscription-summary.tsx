import { formatDate } from "@budget-manager/i18n";
import { useLocale, useTranslate } from "@budget-manager/i18n/react";
import type { SubscriptionStatusRow } from "@budget-manager/client";
import { SubscriptionAccessState } from "@budget-manager/schemas";

export function SubscriptionSummary({
  status,
}: {
  status: SubscriptionStatusRow;
}) {
  const t = useTranslate();
  const locale = useLocale();

  const date = (value: string) => formatDate(locale, new Date(value), "day");

  if (status.state === SubscriptionAccessState.EXPIRED) {
    return (
      <Copy
        title={t("subscription.paywall.title")}
        description={t("subscription.paywall.description")}
      />
    );
  }

  if (status.state === SubscriptionAccessState.PAST_DUE) {
    return (
      <Copy
        title={t("subscription.paywall.pastDueTitle")}
        description={t("subscription.paywall.pastDueDescription")}
      />
    );
  }

  if (status.state === SubscriptionAccessState.TRIALING) {
    return (
      <Copy
        title={t("subscription.paywall.trialTitle")}
        description={t("subscription.trial.endsOn", {
          date: date(status.trialEndsAt),
        })}
      />
    );
  }

  return (
    <Copy
      title={t("subscription.paywall.activeTitle")}
      description={
        status.currentPeriodEnd
          ? t(
              status.cancelAtPeriodEnd
                ? "subscription.endsOn"
                : "subscription.renewsOn",
              { date: date(status.currentPeriodEnd) },
            )
          : t("subscription.paywall.activeDescription")
      }
    />
  );
}

function Copy({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h1>
      <p className="text-content-secondary">{description}</p>
    </div>
  );
}
