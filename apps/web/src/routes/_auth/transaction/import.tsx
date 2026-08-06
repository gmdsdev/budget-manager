import { RouteError } from "@/components/route-error";
import ImportTransactionsPage from "@/modules/transaction/pages/import-transactions.page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/transaction/import")({
  loader: async ({ context }) => {
    // The review step matches every row against these three lists, so they are
    // in hand before the first file is chosen.
    await Promise.all([
      context.queryClient.ensureQueryData(
        context.trpc.wallet.options.queryOptions(),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.creditCard.options.queryOptions(),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.category.options.queryOptions({}),
      ),
    ]);
  },
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  return <ImportTransactionsPage />;
}
