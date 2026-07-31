import { RouteError } from "@/components/route-error";
import UserSettingsPage from "@/modules/settings/pages/user-settings.page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/settings/user")({
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  return <UserSettingsPage />;
}
