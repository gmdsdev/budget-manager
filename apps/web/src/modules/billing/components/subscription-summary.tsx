import {
  subscriptionCopy,
  type SubscriptionStatusRow,
} from "@budget-manager/client";
import { formatDate } from "@budget-manager/i18n";
import { useLocale, useTranslate } from "@budget-manager/i18n/react";

export function SubscriptionSummary({
  status,
}: {
  status: SubscriptionStatusRow;
}) {
  const t = useTranslate();
  const locale = useLocale();

  const copy = subscriptionCopy(status);
  const date = (value: string) => formatDate(locale, new Date(value), "day");

  switch (copy.kind) {
    case "start":
      return (
        <Copy
          title={t("subscription.paywall.startTitle", { days: copy.days })}
          description={t("subscription.paywall.startDescription")}
        />
      );
    case "trialing":
      return (
        <Copy
          title={t("subscription.paywall.trialTitle")}
          description={
            copy.endsAt
              ? t("subscription.trial.endsOn", { date: date(copy.endsAt) })
              : t("subscription.paywall.activeDescription")
          }
        />
      );
    case "pastDue":
      return (
        <Copy
          title={t("subscription.paywall.pastDueTitle")}
          description={t("subscription.paywall.pastDueDescription")}
        />
      );
    case "expired":
      return (
        <Copy
          title={t("subscription.paywall.title")}
          description={t("subscription.paywall.description")}
        />
      );
    case "unmanaged":
      return (
        <Copy
          title={t("subscription.paywall.activeTitle")}
          description={t("subscription.unavailable")}
        />
      );
    default:
      return (
        <Copy
          title={t("subscription.paywall.activeTitle")}
          description={
            copy.endsAt
              ? t(copy.ending ? "subscription.endsOn" : "subscription.renewsOn", {
                  date: date(copy.endsAt),
                })
              : t("subscription.paywall.activeDescription")
          }
        />
      );
  }
}

function Copy({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h1>
      <p className="text-content-secondary">{description}</p>
    </div>
  );
}
