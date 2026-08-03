import { useTranslate } from "@budget-manager/i18n/react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";

import { useThemeMode } from "@/components/theme-provider";

const themes = [
  { value: "light", label: "common.light", icon: SunIcon },
  { value: "dark", label: "common.dark", icon: MoonIcon },
] as const;

export function ModeToggle() {
  const t = useTranslate();
  const { mode, setMode } = useThemeMode();

  return (
    <div
      role="group"
      aria-label={t("common.theme")}
      className="flex flex-row gap-0.5 rounded-full bg-muted p-1"
    >
      {themes.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={mode === option.value}
          onClick={() => setMode(option.value)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold text-content-secondary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
          <option.icon aria-hidden className="size-3.5" />
          {t(option.label)}
        </button>
      ))}
    </div>
  );
}
