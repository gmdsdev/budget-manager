import { RouteError } from "@/components/route-error";
import ListCreditCardsPage from "@/modules/credit-card/pages/list-credit-cards.page";
import { creditCardsQueryInput } from "@/modules/credit-card/queries/use-credit-cards-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/credit-card")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      context.trpc.creditCard.getAll.queryOptions(creditCardsQueryInput()),
    ),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  return <ListCreditCardsPage />;
}
