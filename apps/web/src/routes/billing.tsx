import { createFileRoute, redirect } from "@tanstack/react-router";

import { RouteError } from "@/components/route-error";
import { getCachedSession } from "@/lib/session";
import BillingPage from "@/modules/billing/pages/billing.page";

export const Route = createFileRoute("/billing")({
  component: BillingPage,
  errorComponent: RouteError,
  beforeLoad: async () => {
    const session = await getCachedSession();

    if (!session.data) {
      throw redirect({ to: "/login" });
    }
  },
});
