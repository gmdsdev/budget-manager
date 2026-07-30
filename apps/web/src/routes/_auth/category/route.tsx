import { RouteError } from "@/components/route-error";
import ListCategoriesPage from "@/modules/category/pages/list-categories.page";
import { categoriesQueryInput } from "@/modules/category/queries/use-categories-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/category")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      context.trpc.category.getAll.queryOptions(categoriesQueryInput()),
    ),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  return <ListCategoriesPage />;
}
