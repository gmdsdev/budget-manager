import { useTranslate } from "@budget-manager/i18n/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

import { KivoLogo, KivoMark } from "./logo";
import { MobileNav } from "./mobile-nav";
import { ModeToggle } from "./mode-toggle";
import { NAV_GROUPS, type NavLabel } from "./nav-links";
import UserMenu from "./user-menu";

const NAV_LINK_CLASS =
  "flex h-11 items-center gap-3 rounded-full px-4 text-base font-medium text-content-secondary transition-colors hover:bg-accent hover:text-foreground";

const NAV_LINK_ACTIVE_CLASS =
  "bg-secondary font-semibold text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground";

function SidebarLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: NavLabel;
  icon: PhosphorIcon;
}) {
  const t = useTranslate();

  return (
    <Link
      to={to}
      className={NAV_LINK_CLASS}
      activeProps={{ className: NAV_LINK_ACTIVE_CLASS }}
    >
      <Icon aria-hidden className="size-5 shrink-0" />
      {t(label)}
    </Link>
  );
}

export function Sidebar() {
  const t = useTranslate();

  return (
    <aside className="sticky top-0 hidden h-svh min-w-0 flex-col gap-8 border-r border-border bg-sidebar px-4 py-6 md:flex">
      <Link
        to="/dashboard"
        aria-label={t("nav.homeLink")}
        className="block px-2 text-foreground"
      >
        <KivoLogo className="h-10" alt="" />
      </Link>

      <nav
        aria-label={t("nav.main")}
        className="flex flex-1 flex-col gap-4 overflow-y-auto"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.heading} className="flex flex-col gap-0.5">
            <p className="px-4 pb-1 text-xs font-semibold tracking-[0.02em] uppercase text-muted-foreground">
              {t(group.heading)}
            </p>
            {group.links.map((link) => (
              <SidebarLink
                key={link.to}
                to={link.to}
                label={link.label}
                icon={link.icon}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-3">
        <ModeToggle />
        <UserMenu />
      </div>
    </aside>
  );
}

export default function Header() {
  const t = useTranslate();

  return (
    <header className="min-w-0 border-b border-border md:hidden">
      <div className="container mx-auto flex min-w-0 flex-row items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center">
          <Link
            to="/dashboard"
            aria-label={t("nav.homeLink")}
            // The negative margin buys the 32px mark a 48px tap area
            // without changing how tall the header draws.
            className="-m-2 flex size-12 shrink-0 items-center justify-center text-foreground"
          >
            <KivoMark className="h-8" alt="" />
          </Link>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}
