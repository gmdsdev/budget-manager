import { Button } from "@budget-manager/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@budget-manager/ui/components/sheet";
import { useTranslate } from "@budget-manager/i18n/react";
import { ListIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { useSignOut } from "@/hooks/use-sign-out";
import { authClient } from "@/lib/auth-client";
import { useThemeMode } from "@/components/theme-provider";
import { KivoLockup } from "./logo";
import { NAV_GROUPS } from "./nav-links";

const THEMES = [
  { value: "light", label: "common.light" },
  { value: "dark", label: "common.dark" },
] as const;

/**
 * The whole nav collapses to one button below md: six items in a row need more
 * width than a phone has, and hiding them behind a sheet keeps every
 * destination one tap away instead of off screen.
 */
export function MobileNav() {
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const { mode, setMode } = useThemeMode();
  const signOut = useSignOut();
  const { data: session } = authClient.useSession();

  function close() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={t("common.openMenu")}>
            <ListIcon aria-hidden />
          </Button>
        }
        className="md:hidden"
      />
      <SheetContent side="right" className="w-4/5 max-w-xs overflow-y-auto">
        <SheetHeader>
          <KivoLockup className="mb-3 h-9" alt="" />
          <SheetTitle>{t("common.menu")}</SheetTitle>
          {session ? (
            <SheetDescription>{session.user.email}</SheetDescription>
          ) : null}
        </SheetHeader>

        <nav aria-label={t("nav.main")} className="flex flex-col gap-4 px-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.heading} className="flex flex-col gap-0.5">
              <p className="px-4 pb-1 text-xs font-semibold tracking-[0.02em] uppercase text-muted-foreground">
                {t(group.heading)}
              </p>
              {group.links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={close}
                  className="flex min-h-11 items-center gap-3 rounded-full px-4 text-base font-medium text-content-secondary hover:bg-accent hover:text-foreground"
                  activeProps={{
                    className:
                      "bg-secondary font-semibold text-secondary-foreground",
                  }}
                >
                  <link.icon aria-hidden className="size-5 shrink-0" />
                  {t(link.label)}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <SheetFooter>
          <div className="flex flex-col gap-2">
            <p className="flex flex-row items-center gap-1.5 text-xs text-muted-foreground">
              {mode === "dark" ? (
                <MoonIcon aria-hidden className="size-3.5" />
              ) : (
                <SunIcon aria-hidden className="size-3.5" />
              )}
              {t("common.theme")}
            </p>
            <div className="flex flex-row gap-2">
              {THEMES.map((option) => (
                <Button
                  key={option.value}
                  variant={mode === option.value ? "secondary" : "outline"}
                  className="flex-1"
                  aria-pressed={mode === option.value}
                  onClick={() => setMode(option.value)}
                >
                  {t(option.label)}
                </Button>
              ))}
            </div>
          </div>

          {session ? (
            <Button
              variant="destructive"
              onClick={() => {
                close();
                signOut();
              }}
            >
              {t("nav.signOut")}
            </Button>
          ) : (
            <Link
              to="/login"
              onClick={close}
              className="flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              {t("nav.signIn")}
            </Link>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
