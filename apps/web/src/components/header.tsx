import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

import { KivoLockup, KivoMark } from "./logo";
import { MobileNav } from "./mobile-nav";
import { ModeToggle } from "./mode-toggle";
import { MAIN_LINKS, SETTINGS_LINKS } from "./nav-links";
import UserMenu from "./user-menu";

const NAV_LINK_CLASS =
  "flex h-10 items-center gap-2 border border-transparent px-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";

const NAV_LINK_ACTIVE_CLASS =
  "border-border bg-card text-foreground shadow-brutal-xs";

function SidebarLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: PhosphorIcon;
}) {
  return (
    <Link
      to={to}
      className={NAV_LINK_CLASS}
      activeProps={{ className: NAV_LINK_ACTIVE_CLASS }}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-svh min-w-0 flex-col border-r-2 border-border bg-sidebar md:flex">
      <div className="border-b-2 border-border px-4 py-5">
        <Link
          to="/dashboard"
          aria-label="Kivo dashboard"
          className="block text-foreground"
        >
          <KivoLockup className="h-10" alt="" />
        </Link>
      </div>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {[...MAIN_LINKS, ...SETTINGS_LINKS].map((link) => (
          <SidebarLink
            key={link.to}
            to={link.to}
            label={link.label}
            icon={link.icon}
          />
        ))}
      </nav>

      <div className="flex flex-col gap-3 border-t-2 border-border p-3">
        <ModeToggle />
        <UserMenu />
      </div>
    </aside>
  );
}

export default function Header() {
  return (
    <header className="min-w-0 border-b-2 border-border md:hidden">
      <div className="container mx-auto flex min-w-0 flex-row items-center gap-4 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center">
          <Link
            to="/dashboard"
            aria-label="Kivo dashboard"
            // The negative margin buys the 32px mark a 48px tap area
            // without changing how tall the header draws.
            className="-m-2 shrink-0 p-2 text-foreground"
          >
            <KivoMark className="h-8" alt="" />
          </Link>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}
