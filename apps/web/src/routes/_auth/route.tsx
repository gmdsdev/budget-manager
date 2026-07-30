import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import Header from "@/components/header";
import { getCachedSession } from "@/lib/session";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
  beforeLoad: async () => {
    const session = await getCachedSession();

    if (!session.data) {
      throw redirect({
        to: "/login",
      });
    }

    return { session };
  },
});

function AuthLayout() {
  return (
    <>
      <Header />
      <div className="container mx-auto min-w-0 px-4 sm:px-6">
        <Outlet />
      </div>
    </>
  );
}
