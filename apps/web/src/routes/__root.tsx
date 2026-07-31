import { RouteError } from "@/components/route-error";
import { ThemeProvider } from "@/components/theme-provider";
import { AppI18nProvider } from "@/lib/i18n";
import { t } from "@budget-manager/i18n";
import type { trpc } from "@/utils/trpc";
import { Toaster } from "@budget-manager/ui/components/sonner";
import { TooltipProvider } from "@budget-manager/ui/components/tooltip";
import type { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import "../index.css";

const Devtools = import.meta.env.DEV
  ? lazy(() => import("@/components/devtools"))
  : null;

export interface RouterAppContext {
  trpc: typeof trpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  errorComponent: RouteError,
  // Read through the module-scoped translator rather than a hook: `head` runs
  // outside React, and `AppI18nProvider` has already applied the stored locale
  // by the time the router renders.
  head: () => ({
    meta: [
      {
        title: "Kivo",
      },
      {
        name: "description",
        content: t("nav.appDescription"),
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <AppI18nProvider>
        <ThemeProvider>
          <TooltipProvider>
            {/* grid-cols-1 is minmax(0,1fr), not auto: an auto track sizes to its
                max-content, so one wide table used to widen the whole document
                and every page scrolled sideways. */}
            <div className="grid min-h-svh grid-cols-1">
              <Outlet />
            </div>
            <Toaster richColors />
          </TooltipProvider>
        </ThemeProvider>
      </AppI18nProvider>
      {Devtools ? (
        <Suspense fallback={null}>
          <Devtools />
        </Suspense>
      ) : null}
    </>
  );
}
