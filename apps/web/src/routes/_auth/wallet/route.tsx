import ListWalletsPage from "@/modules/wallet/pages/list-wallets.page";
import { WalletDto } from "@budget-manager/schemas";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/wallet")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isLoading } = useQuery(trpc.wallet.getAll.queryOptions());

  if (isLoading) return <div>Loading...</div>;

  if (!data?.length) return <div>No wallets found</div>;

  return <ListWalletsPage wallets={data as unknown as WalletDto[]} />;
}
