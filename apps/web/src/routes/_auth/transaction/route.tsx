import { RouteError } from "@/components/route-error";
import ListTransactionsPage from "@/modules/transaction/pages/list-transactions.page";
import { transactionsQueryInput } from "@/modules/transaction/queries/use-transactions-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/transaction")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      context.trpc.transaction.getAll.queryOptions(transactionsQueryInput()),
    ),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  return <ListTransactionsPage />;
}
