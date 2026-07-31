import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@budget-manager/ui/components/dropdown-menu";
import { Skeleton } from "@budget-manager/ui/components/skeleton";
import { useTranslate } from "@budget-manager/i18n/react";
import { CaretUpIcon, GearIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

import { useSignOut } from "@/hooks/use-sign-out";
import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
  const t = useTranslate();
  const signOut = useSignOut();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-12 w-full" />;
  }

  if (!session) {
    return (
      <Link
        to="/login"
        className="flex h-10 items-center justify-center border border-border bg-card px-3 text-xs font-semibold tracking-wide uppercase shadow-brutal-xs transition-colors hover:bg-accent"
      >
        {t("nav.signIn")}
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full min-w-0 items-center gap-2 border border-border bg-card px-3 py-2 text-left shadow-brutal-xs transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40 aria-expanded:bg-accent">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-bold tracking-wide uppercase">
            {session.user.name}
          </span>
          <span className="truncate text-[10px] text-muted-foreground">
            {session.user.email}
          </span>
        </span>
        <CaretUpIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" className="w-(--anchor-width)">
        <DropdownMenuItem
          render={
            <Link to="/settings/user">
              <GearIcon aria-hidden />
              {t("nav.settings")}
            </Link>
          }
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={signOut}>
          {t("nav.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
