import { Link } from "@tanstack/react-router";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@budget-manager/ui/components/navigation-menu";
import { Logotipo } from "./logotipo";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

const mainLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/transaction", label: "Transactions" },
] as const;

const settingsLinks = [
  { to: "/wallet", label: "Wallets" },
  { to: "/credit-card", label: "Credit Cards" },
  { to: "/category", label: "Categories" },
] as const;

export default function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex flex-row items-center gap-4 py-2">
        <div className="flex flex-1 items-center">
          <Link
            to="/dashboard"
            aria-label="Budget Manager dashboard"
            className="shrink-0 text-foreground"
          >
            <Logotipo className="h-6" aria-hidden />
          </Link>
        </div>
        <NavigationMenu aria-label="Main">
          <NavigationMenuList>
            {mainLinks.map((link) => (
              <NavigationMenuItem key={link.to}>
                <NavigationMenuLink
                  className={navigationMenuTriggerStyle()}
                  render={<Link to={link.to}>{link.label}</Link>}
                />
              </NavigationMenuItem>
            ))}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Settings</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="w-40">
                  {settingsLinks.map((link) => (
                    <li key={link.to}>
                      <NavigationMenuLink
                        closeOnClick
                        render={<Link to={link.to}>{link.label}</Link>}
                      />
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex flex-1 items-center justify-end">
          <NavigationMenu align="end" aria-label="Account menu">
            <NavigationMenuList>
              <ModeToggle />
              <UserMenu />
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  );
}
