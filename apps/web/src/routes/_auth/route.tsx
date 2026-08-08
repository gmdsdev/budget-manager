import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import Header, { Sidebar } from "@/components/header";
import { TrialBanner } from "@/components/trial-banner";
import { getCachedSession } from "@/lib/session";
import { useSubscriptionGuard } from "@/modules/billing/components/use-subscription-guard";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
  beforeLoad: async ({ context }) => {
    const session = await getCachedSession();

    if (!session.data) {
      throw redirect({
        to: "/login",
      });
    }

    const subscription = await context.queryClient.ensureQueryData(
      context.trpc.subscription.status.queryOptions(),
    );

    if (!subscription.hasAccess) {
      throw redirect({ to: "/billing" });
    }

    return { session, subscription };
  },
});

function AuthLayout() {
  useSubscriptionGuard();

  return (
    <div className="min-w-0 md:grid md:grid-cols-[16.5rem_minmax(0,1fr)]">
      <Sidebar />
      <div className="min-w-0">
        <Header />
        <div className="container mx-auto min-w-0 px-4 sm:px-6">
          <TrialBanner />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
