import { Button } from "@budget-manager/ui/components/button";
import { useTranslate } from "@budget-manager/i18n/react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";

import { useThemeMode } from "@/components/theme-provider";

const themes = [
  { value: "light", label: "common.lightTheme", icon: SunIcon },
  { value: "dark", label: "common.darkTheme", icon: MoonIcon },
] as const;

export function ModeToggle() {
  const t = useTranslate();
  const { mode, setMode } = useThemeMode();

  return (
    <div role="group" aria-label={t("common.theme")} className="flex flex-row gap-1.5">
      {themes.map((option) => (
        <Button
          key={option.value}
          variant={mode === option.value ? "secondary" : "ghost"}
          size="icon-sm"
          className="flex-1"
          aria-pressed={mode === option.value}
          aria-label={t(option.label)}
          onClick={() => setMode(option.value)}
        >
          <option.icon aria-hidden />
        </Button>
      ))}
    </div>
  );
}
