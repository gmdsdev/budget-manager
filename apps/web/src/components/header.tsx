import { Link } from "@tanstack/react-router";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@budget-manager/ui/components/navigation-menu";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

// function ListItem({
//   title,
//   children,
//   href,
//   ...props
// }: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
//   return (
//     <li {...props}>
//       <NavigationMenuLink
//         render={
//           <Link to={href}>
//             <div className="flex flex-col gap-1 text-sm">
//               <div className="leading-none font-medium">{title}</div>
//               <div className="line-clamp-2 text-muted-foreground">
//                 {children}
//               </div>
//             </div>
//           </Link>
//         }
//       />
//     </li>
//   );
// }

export default function Header() {
  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/wallet", label: "Wallet" },
    { to: "/category", label: "Category" },
    { to: "/transaction", label: "Transaction" },
    { to: "/credit-card", label: "Cards" },
  ] as const;

  return (
    <div className="flex flex-row items-center justify-between container mx-auto py-2 border-b">
      <nav className="flex gap-4 text-lg">
        <NavigationMenu>
          <NavigationMenuList>
            {/* <NavigationMenuItem>
                <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="w-96">
                    <ListItem href="/docs" title="Introduction">
                      Re-usable components built with Tailwind CSS.
                    </ListItem>
                    <ListItem href="/docs/installation" title="Installation">
                      How to install dependencies and structure your app.
                    </ListItem>
                    <ListItem
                      href="/docs/primitives/typography"
                      title="Typography"
                    >
                      Styles for headings, paragraphs, lists...etc
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem> */}
            {links.map((link) => (
              <NavigationMenuItem key={link.to}>
                <NavigationMenuLink
                  className={navigationMenuTriggerStyle()}
                  render={<Link to={link.to}>{link.label}</Link>}
                />
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
      <div className="flex items-center gap-2">
        <ModeToggle />
        <UserMenu />
      </div>
    </div>
  );
}
