import { toOnboardingCompleted } from "@budget-manager/schemas";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { RouteError } from "@/components/route-error";
import { getCachedSession } from "@/lib/session";
import OnboardingPage from "@/modules/onboarding/pages/onboarding.page";

export const Route = createFileRoute("/onboarding")({
  component: RouteComponent,
  errorComponent: RouteError,
  beforeLoad: async () => {
    const session = await getCachedSession();

    if (!session.data) {
      throw redirect({ to: "/login" });
    }

    if (toOnboardingCompleted(session.data.user.onboardingCompleted)) {
      throw redirect({ to: "/dashboard" });
    }

    return { session };
  },
});

function RouteComponent() {
  return <OnboardingPage />;
}
