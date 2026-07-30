import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@budget-manager/ui/components/navigation-menu";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";

import { useTheme } from "@/components/theme-provider";

const themes = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger aria-label="Toggle theme">
        <span className="relative flex size-4 items-center justify-center">
          <SunIcon className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <MoonIcon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </span>
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="w-32">
          {themes.map((theme) => (
            <li key={theme.value}>
              <NavigationMenuLink
                closeOnClick
                className="w-full"
                render={
                  <button
                    type="button"
                    onClick={() => {
                      setTheme(theme.value);
                    }}
                  />
                }
              >
                {theme.label}
              </NavigationMenuLink>
            </li>
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
