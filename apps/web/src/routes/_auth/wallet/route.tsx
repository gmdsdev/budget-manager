import { RouteError } from "@/components/route-error";
import ListWalletsPage from "@/modules/wallet/pages/list-wallets.page";
import { walletsQueryInput } from "@budget-manager/client";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/wallet")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      context.trpc.wallet.getAll.queryOptions(walletsQueryInput()),
    ),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  return <ListWalletsPage />;
}
