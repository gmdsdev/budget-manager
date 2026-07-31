import { RouteError } from "@/components/route-error";
import { ThemeProvider } from "@/components/theme-provider";
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
  head: () => ({
    meta: [
      {
        title: "Kivo",
      },
      {
        name: "description",
        content: "Kivo is a personal finance app for wallets, cards and bills",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
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
      {Devtools ? (
        <Suspense fallback={null}>
          <Devtools />
        </Suspense>
      ) : null}
    </>
  );
}
