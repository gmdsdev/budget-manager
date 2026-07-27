import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/wallet")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isLoading } = useQuery(trpc.wallet.getAll.queryOptions());

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Wallets</h1>
      <ul>
        {data?.map((wallet) => (
          <li key={wallet.id}>{wallet.name}</li>
        ))}
      </ul>
    </div>
  );
}
