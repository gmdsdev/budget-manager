import { Button } from "@budget-manager/ui/components/button";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";

import { useThemeMode } from "@/components/theme-provider";

const themes = [
  { value: "light", label: "Light theme", icon: SunIcon },
  { value: "dark", label: "Dark theme", icon: MoonIcon },
] as const;

export function ModeToggle() {
  const { mode, setMode } = useThemeMode();

  return (
    <div role="group" aria-label="Theme" className="flex flex-row gap-1.5">
      {themes.map((option) => (
        <Button
          key={option.value}
          variant={mode === option.value ? "secondary" : "ghost"}
          size="icon-sm"
          className="flex-1"
          aria-pressed={mode === option.value}
          aria-label={option.label}
          onClick={() => setMode(option.value)}
        >
          <option.icon aria-hidden />
        </Button>
      ))}
    </div>
  );
}
