import { Button } from "@budget-manager/ui/components/button";
import { DesktopIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";

import { useTheme } from "@/components/theme-provider";

const themes = [
  { value: "light", label: "Light theme", icon: SunIcon },
  { value: "dark", label: "Dark theme", icon: MoonIcon },
  { value: "system", label: "System theme", icon: DesktopIcon },
] as const;

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div role="group" aria-label="Theme" className="flex flex-row gap-1.5">
      {themes.map((option) => (
        <Button
          key={option.value}
          variant={theme === option.value ? "secondary" : "ghost"}
          size="icon-sm"
          className="flex-1"
          aria-pressed={theme === option.value}
          aria-label={option.label}
          onClick={() => setTheme(option.value)}
        >
          <option.icon aria-hidden />
        </Button>
      ))}
    </div>
  );
}
