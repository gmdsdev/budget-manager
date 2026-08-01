import { RouteError } from "@/components/route-error";
import ListBudgetsPage from "@/modules/budget/pages/list-budgets.page";
import { budgetMonthQueryInput } from "@/modules/budget/queries/use-budget-month-query";
import { budgetsQueryInput } from "@/modules/budget/queries/use-budgets-query";
import { currentMonth } from "@/lib/month";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/budget")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        context.trpc.budget.getAll.queryOptions(budgetsQueryInput()),
      ),
      // The month card leads the page, so it is prefetched beside the list.
      // The month is explicit rather than left to the server's default: the
      // page asks for `currentMonth()`, and a bare prefetch would sit under a
      // different query key and leave the card loading on every visit.
      context.queryClient.ensureQueryData(
        context.trpc.budget.getMonth.queryOptions(
          budgetMonthQueryInput(currentMonth()),
        ),
      ),
    ]),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  return <ListBudgetsPage />;
}
