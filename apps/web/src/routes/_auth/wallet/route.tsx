import ListWalletsPage from "@/modules/wallet/pages/list-wallets.page";
import { WalletDto } from "@budget-manager/schemas";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/wallet")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ListWalletsPage />;
}
