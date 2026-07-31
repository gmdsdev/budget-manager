import { Link } from "@tanstack/react-router";

import { Logotipo } from "./logotipo";
import { MobileNav } from "./mobile-nav";
import { ModeToggle } from "./mode-toggle";
import { MAIN_LINKS, SETTINGS_LINKS } from "./nav-links";
import UserMenu from "./user-menu";

const NAV_LINK_CLASS =
  "flex h-10 items-center gap-2 border border-transparent px-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";

const NAV_LINK_ACTIVE_CLASS =
  "border-border bg-card text-foreground shadow-brutal-xs";

function SidebarLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className={NAV_LINK_CLASS}
      activeProps={{ className: NAV_LINK_ACTIVE_CLASS }}
    >
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
          aria-label="Budget Manager dashboard"
          className="block text-foreground"
        >
          <Logotipo className="h-6" aria-hidden />
        </Link>
        <p className="mt-2 text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Total control
        </p>
      </div>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {[...MAIN_LINKS, ...SETTINGS_LINKS].map((link) => (
          <SidebarLink key={link.to} to={link.to} label={link.label} />
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
            aria-label="Budget Manager dashboard"
            // The negative margin buys the 24px wordmark a 40px tap area
            // without changing how tall the header draws.
            className="-m-2 shrink-0 p-2 text-foreground"
          >
            <Logotipo className="h-6" aria-hidden />
          </Link>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}
