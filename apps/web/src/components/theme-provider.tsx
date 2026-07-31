import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

export const THEME_MODES = ["light", "dark"] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

const DEFAULT_MODE: ThemeMode = "dark";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={DEFAULT_MODE}
      disableTransitionOnChange
      enableSystem={false}
      storageKey="kivo-theme"
      themes={[...THEME_MODES]}
    >
      {children}
    </NextThemesProvider>
  );
}

export function useThemeMode() {
  const { theme, setTheme } = useTheme();

  return {
    mode: theme === "light" ? "light" : DEFAULT_MODE,
    setMode: (mode: ThemeMode) => setTheme(mode),
  };
}
