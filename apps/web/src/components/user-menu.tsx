import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@budget-manager/ui/components/navigation-menu";
import { Skeleton } from "@budget-manager/ui/components/skeleton";
import { Link } from "@tanstack/react-router";

import { useSignOut } from "@/hooks/use-sign-out";
import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
  const signOut = useSignOut();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <NavigationMenuItem>
        <Skeleton className="h-9 w-24" />
      </NavigationMenuItem>
    );
  }

  if (!session) {
    return (
      <NavigationMenuItem>
        <NavigationMenuLink
          className={navigationMenuTriggerStyle()}
          render={<Link to="/login">Sign In</Link>}
        />
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>{session.user.name}</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="w-48">
          <li className="p-2 text-xs text-muted-foreground">
            {session.user.email}
          </li>
          <li>
            <NavigationMenuLink
              closeOnClick
              className="w-full text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
              render={<button type="button" onClick={signOut} />}
            >
              Sign Out
            </NavigationMenuLink>
          </li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
