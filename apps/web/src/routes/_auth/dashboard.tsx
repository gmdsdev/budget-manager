import { RouteError } from "@/components/route-error";
import DashboardPage from "@/modules/dashboard/pages/dashboard.page";
import { dashboardQueryInput } from "@/modules/dashboard/queries/use-dashboard-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/dashboard")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      context.trpc.dashboard.getSummary.queryOptions(dashboardQueryInput()),
    ),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  return <DashboardPage />;
}
