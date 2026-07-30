import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@budget-manager/ui/components/navigation-menu";
import { Skeleton } from "@budget-manager/ui/components/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { invalidateSessionCache } from "@/lib/session";

export default function UserMenu() {
  const navigate = useNavigate();
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
              render={
                <button
                  type="button"
                  onClick={() => {
                    void authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          invalidateSessionCache();
                          void navigate({
                            to: "/",
                          });
                        },
                      },
                    });
                  }}
                />
              }
            >
              Sign Out
            </NavigationMenuLink>
          </li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
