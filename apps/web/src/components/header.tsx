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
import { MobileNav } from "./mobile-nav";
import { ModeToggle } from "./mode-toggle";
import { MAIN_LINKS, SETTINGS_LINKS } from "./nav-links";
import UserMenu from "./user-menu";

export default function Header() {
  return (
    <header className="min-w-0 border-b">
      <div className="container mx-auto flex min-w-0 flex-row items-center gap-4 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center">
          <Link
            to="/dashboard"
            aria-label="Budget Manager dashboard"
            // The negative margin buys the 24px wordmark a 40px tap area
            // without changing how tall the header draws.
            className="-m-2 shrink-0 p-2 text-foreground"
          >
            <Logotipo className="h-6" aria-hidden />
          </Link>
        </div>

        <NavigationMenu aria-label="Main" className="hidden md:flex">
          <NavigationMenuList>
            {MAIN_LINKS.map((link) => (
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
                  {SETTINGS_LINKS.map((link) => (
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

        <div className="hidden flex-1 items-center justify-end md:flex">
          <NavigationMenu align="end" aria-label="Account menu">
            <NavigationMenuList>
              <ModeToggle />
              <UserMenu />
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}
