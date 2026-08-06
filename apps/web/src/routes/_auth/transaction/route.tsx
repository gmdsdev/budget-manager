import { RouteError } from "@/components/route-error";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/transaction")({
  component: Outlet,
  errorComponent: RouteError,
});
