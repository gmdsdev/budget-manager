import { useSubscriptionStatusQuery } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { SubscriptionAccessState, TRIAL_DAYS } from "@budget-manager/schemas";
import {
  Button,
  buttonVariants,
} from "@budget-manager/ui/components/button";
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

export default function BillingPage() {
  const t = useTranslate();
  const signOut = useSignOut();
  const { data: status, isPending, refetch, isFetching } = useSubscriptionStatusQuery();
  const { pending, subscribe, manage } = useBillingActions();

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <KivoLogo className="mx-auto h-10" alt="" />

        <Card>
          <CardContent className="flex flex-col gap-6">
            {isPending || !status ? (
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
                    {status.state === SubscriptionAccessState.EXPIRED ? (
                      <Button
                        size="lg"
                        onClick={subscribe}
                        disabled={pending !== null}
                      >
                        {t("subscription.action.subscribe")}
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        variant={
                          status.state === SubscriptionAccessState.PAST_DUE
                            ? "default"
                            : "outline"
                        }
                        onClick={
                          status.state === SubscriptionAccessState.TRIALING
                            ? subscribe
                            : manage
                        }
                        disabled={pending !== null}
                      >
                        {status.state === SubscriptionAccessState.TRIALING
                          ? t("subscription.action.subscribe")
                          : status.state === SubscriptionAccessState.PAST_DUE
                            ? t("subscription.action.updatePayment")
                            : t("subscription.action.manage")}
                      </Button>
                    )}

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
              <Link to="/dashboard" className={buttonVariants({ variant: "link" })}>
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
