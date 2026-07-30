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
        title: "budget-manager",
      },
      {
        name: "description",
        content: "budget-manager is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <TooltipProvider>
          {/* grid-cols-1 is minmax(0,1fr), not auto: an auto track sizes to its
              max-content, so one wide table used to widen the whole document
              and every page scrolled sideways. */}
          <div className="grid min-h-svh grid-cols-1 grid-rows-[auto_1fr]">
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
