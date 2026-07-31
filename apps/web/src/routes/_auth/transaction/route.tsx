import { RouteError } from "@/components/route-error";
import ListTransactionsPage from "@/modules/transaction/pages/list-transactions.page";
import { transactionSummaryQueryInput } from "@/modules/transaction/queries/use-transaction-summary-query";
import { transactionsQueryInput } from "@/modules/transaction/queries/use-transactions-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/transaction")({
  loader: async ({ context }) => {
    // The totals sit under the list on the same screen, so they are prefetched
    // with it rather than arriving after it and pushing the page down.
    await Promise.all([
      context.queryClient.ensureQueryData(
        context.trpc.transaction.getAll.queryOptions(transactionsQueryInput()),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.transaction.summary.queryOptions(
          transactionSummaryQueryInput(),
        ),
      ),
    ]);
  },
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  return <ListTransactionsPage />;
}
