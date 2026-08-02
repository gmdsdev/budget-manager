import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { PALETTES, type ThemeColors, type ThemeMode } from "./tokens";

/**
 * The colour scheme is the one setting that is **not** server state, exactly as
 * on the web: it lives under the same `kivo-theme` key so a device remembers
 * what it was reading in, and nothing has to guess what the OS is showing.
 * There is deliberately no `system` mode — the logo artwork is a pair of files
 * per shape, so the mode in state has to be the mode on screen.
 */
const STORAGE_KEY = "kivo-theme";

const DEFAULT_MODE: ThemeMode = "dark";

type ThemeValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeValue>({
  mode: DEFAULT_MODE,
  colors: PALETTES[DEFAULT_MODE],
  setMode: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);

  useEffect(() => {
    let cancelled = false;

    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (!cancelled && (stored === "light" || stored === "dark")) {
        setModeState(stored);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({ mode, colors: PALETTES[mode], setMode }),
    [mode, setMode],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

/** The common case: only the palette is needed. */
export function useColors(): ThemeColors {
  return useContext(ThemeContext).colors;
}
