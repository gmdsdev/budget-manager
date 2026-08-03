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

/** Two letters at most, so a long name still fits a 32px circle. */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function UserMenu() {
  const t = useTranslate();
  const signOut = useSignOut();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-14 w-full rounded-lg" />;
  }

  if (!session) {
    return (
      <Link
        to="/login"
        className="flex h-10 items-center justify-center rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        {t("nav.signIn")}
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full min-w-0 items-center gap-2.5 rounded-lg bg-muted px-3 py-2.5 text-left transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-accent">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-wise-bright-blue text-xs font-bold text-wise-forest-green"
        >
          {initials(session.user.name)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">
            {session.user.name}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {session.user.email}
          </span>
        </span>
        <CaretUpIcon
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
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
