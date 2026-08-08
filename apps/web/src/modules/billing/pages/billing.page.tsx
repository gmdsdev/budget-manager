import { subscriptionAction } from "@budget-manager/client";
import { useSubscriptionStatusQuery } from "@budget-manager/client/react";
import type { MessageKey } from "@budget-manager/i18n";
import { useTranslate } from "@budget-manager/i18n/react";
import { TRIAL_DAYS } from "@budget-manager/schemas";
import { Button, buttonVariants } from "@budget-manager/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@budget-manager/ui/components/card";
import { Skeleton } from "@budget-manager/ui/components/skeleton";
import { Link } from "@tanstack/react-router";

import { KivoLogo } from "@/components/logo";
import { useSignOut } from "@/hooks/use-sign-out";

import { SubscriptionSummary } from "../components/subscription-summary";
import { useBillingActions } from "../components/use-billing-actions";

const ACTION_LABELS = {
  start: "subscription.action.startTrial",
  subscribe: "subscription.action.subscribe",
  updatePayment: "subscription.action.updatePayment",
  manage: "subscription.action.manage",
} as const satisfies Record<string, MessageKey>;

export default function BillingPage() {
  const t = useTranslate();
  const signOut = useSignOut();
  const {
    data: status,
    isPending,
    refetch,
    isFetching,
  } = useSubscriptionStatusQuery();
  const { pending, subscribe, manage } = useBillingActions();

  const action = status ? subscriptionAction(status) : null;

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <KivoLogo className="mx-auto h-10" alt="" />

        <Card>
          <CardContent className="flex flex-col gap-6">
            {isPending || !status || !action ? (
              <div
                role="status"
                aria-label={t("subscription.loading")}
                className="flex flex-col gap-3"
              >
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <SubscriptionSummary status={status} />

                <p className="text-sm text-muted-foreground">
                  {t("subscription.description", { days: TRIAL_DAYS })}
                </p>

                {status.billingEnabled ? (
                  <div className="flex flex-col gap-2">
                    <Button
                      size="lg"
                      variant={action === "manage" ? "outline" : "default"}
                      onClick={
                        action === "start" || action === "subscribe"
                          ? subscribe
                          : manage
                      }
                      disabled={pending !== null}
                    >
                      {t(ACTION_LABELS[action])}
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => void refetch()}
                      disabled={isFetching}
                    >
                      {t("subscription.action.refresh")}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-content-secondary">
                    {t("subscription.unavailable")}
                  </p>
                )}
              </>
            )}
          </CardContent>

          <CardFooter className="justify-between">
            {status?.hasAccess ? (
              <Link
                to="/dashboard"
                className={buttonVariants({ variant: "link" })}
              >
                {t("subscription.action.backToApp")}
              </Link>
            ) : (
              <span />
            )}
            <Button variant="link" onClick={signOut}>
              {t("nav.signOut")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
