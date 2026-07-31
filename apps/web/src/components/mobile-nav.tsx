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
import { MAIN_LINKS, SETTINGS_LINKS } from "./nav-links";

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

        <nav aria-label={t("nav.main")} className="flex flex-col px-2">
          {[...MAIN_LINKS, ...SETTINGS_LINKS].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={close}
              className="flex min-h-11 items-center gap-2.5 border border-transparent px-2 text-sm font-semibold tracking-wide uppercase text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              activeProps={{
                className:
                  "border-border bg-card text-foreground shadow-brutal-xs",
              }}
            >
              <link.icon aria-hidden className="size-4 shrink-0" />
              {t(link.label)}
            </Link>
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
              className="flex min-h-11 items-center border border-border bg-card px-2 text-sm font-semibold tracking-wide uppercase shadow-brutal-xs hover:bg-accent"
            >
              {t("nav.signIn")}
            </Link>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
