import type { CategoryColor } from "@budget-manager/schemas";

/**
 * The one place the design language is written down for native. It mirrors
 * `packages/ui/src/styles/globals.css` token for token — React Native cannot
 * read CSS custom properties, and it cannot parse `oklch()` either, so every
 * step is carried here as the sRGB hex the web file now states directly.
 * Change a token there and change it here; the hues are the same design.
 */
export type ThemeMode = "light" | "dark";

export const THEME_MODES: readonly ThemeMode[] = ["light", "dark"];

/**
 * Wise's own palette, for surfaces that are deliberately branded rather than
 * themed — the dashboard hero, and the ink on the buttons that sit on it. It does
 * not flip with the mode: bright green with forest-green ink is the brand, not a
 * light-mode reading of it. Reach for a semantic token first; these are the
 * exception, and the account mark is deliberately *not* one of them — a second
 * green beside the create action would read as a peer of it.
 */
export const BRAND = {
  brightGreen: "#9fe870",
  forestGreen: "#163300",
  brightBlue: "#a0e1e1",
  brightYellow: "#ffeb69",
  brightOrange: "#ffc091",
  brightPink: "#ffd7ef",
} as const;

type Palette = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  primaryHover: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveMuted: string;
  border: string;
  input: string;
  ring: string;
  link: string;
  contentSecondary: string;
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  warningMark: string;
  chart: readonly string[];
  chartIncome: string;
  chartExpense: string;
  chartTrack: string;
  /** How strongly a record glyph tints its own hue behind the icon. */
  glyphTint: number;
  category: Record<CategoryColor, string>;
};

const LIGHT_CHART = [
  "#2f7ed8",
  "#e8722c",
  "#00918f",
  "#a4841c",
  "#c94f86",
  "#3aa957",
  "#6f57d9",
  "#e0463c",
] as const;

const DARK_CHART = [
  "#4d9ae8",
  "#f0894a",
  "#17a8a4",
  "#d9b53c",
  "#e0699b",
  "#4dbf6d",
  "#8a75e8",
  "#f0645a",
] as const;

const light: Palette = {
  background: "#ffffff",
  foreground: "#0e0f0c",
  card: "#ffffff",
  cardForeground: "#0e0f0c",
  popover: "#ffffff",
  popoverForeground: "#0e0f0c",
  primary: BRAND.brightGreen,
  primaryForeground: BRAND.forestGreen,
  primaryHover: "#80e142",
  secondary: "#e2f6d5",
  secondaryForeground: BRAND.forestGreen,
  muted: "#f1f4ef",
  mutedForeground: "#6a6c6a",
  accent: "#f1f4ef",
  accentForeground: "#0e0f0c",
  destructive: "#cb272f",
  destructiveMuted: "#fbeaea",
  border: "#e3e4e1",
  input: "#c9cbc7",
  ring: "#0e0f0c",
  link: BRAND.forestGreen,
  contentSecondary: "#454745",
  success: "#054d28",
  successMuted: "#e2f6d5",
  warning: "#4a3b1c",
  warningMuted: "#fff7d7",
  warningMark: "#ffd11a",
  chart: LIGHT_CHART,
  // Wise's own pair: bright green income against forest green spending.
  chartIncome: BRAND.brightGreen,
  chartExpense: BRAND.forestGreen,
  chartTrack: "#e3e7e0",
  glyphTint: 0.16,
  // Eight slots alias the chart ring so a category bar and a chart series of
  // the same hue cannot drift apart; four fill the gaps the ring leaves.
  category: {
    blue: LIGHT_CHART[0],
    cyan: "#0b87b5",
    teal: LIGHT_CHART[2],
    green: LIGHT_CHART[5],
    lime: "#6b9420",
    yellow: LIGHT_CHART[3],
    orange: LIGHT_CHART[1],
    red: LIGHT_CHART[7],
    pink: LIGHT_CHART[4],
    purple: "#9333ac",
    violet: LIGHT_CHART[6],
    slate: "#5c7089",
  },
};

const dark: Palette = {
  background: "#121511",
  foreground: "#f3f5f1",
  card: "#1e211d",
  cardForeground: "#f3f5f1",
  popover: "#1e211d",
  popoverForeground: "#f3f5f1",
  primary: BRAND.brightGreen,
  primaryForeground: BRAND.forestGreen,
  primaryHover: "#cdffad",
  secondary: "#1d3f06",
  secondaryForeground: "#cdffad",
  muted: "#262a24",
  mutedForeground: "#a8ada4",
  accent: "#262a24",
  accentForeground: "#f3f5f1",
  destructive: "#ffa8ad",
  destructiveMuted: "#410b0d",
  border: "#33372f",
  input: "#4b5046",
  ring: "#f3f5f1",
  link: BRAND.brightGreen,
  contentSecondary: "#cacfc7",
  success: "#bae5a0",
  successMuted: "#252c20",
  warning: "#fadc65",
  warningMuted: "#3a3523",
  warningMark: "#fadc65",
  chart: DARK_CHART,
  // Forest green disappears on the dark plane, so spending takes bright blue.
  chartIncome: BRAND.brightGreen,
  chartExpense: BRAND.brightBlue,
  chartTrack: "#33372f",
  glyphTint: 0.26,
  category: {
    blue: DARK_CHART[0],
    cyan: "#33b8e0",
    teal: DARK_CHART[2],
    green: DARK_CHART[5],
    lime: "#8fbf33",
    yellow: DARK_CHART[3],
    orange: DARK_CHART[1],
    red: DARK_CHART[7],
    pink: DARK_CHART[4],
    purple: "#b055c4",
    violet: DARK_CHART[6],
    slate: "#7488a1",
  },
};

export const PALETTES: Record<ThemeMode, Palette> = { light, dark };

export type ThemeColors = Palette;

/**
 * Wise's radius scale: nothing in this app is square any more, and the things a
 * thumb presses are `full` — buttons, chips, pills, swatches, glyphs and meters.
 */
export const RADIUS = {
  sm: 8,
  md: 10,
  lg: 16,
  xl: 24,
  "2xl": 32,
  full: 9999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
} as const;

/**
 * One control scale, and it does not change with the viewport. The everyday
 * control is **48pt** — `13px 24px` around 16px/1.2 text in Wise's reference —
 * which already clears the touch minimum, so there is no dense variant to
 * shrink to. `sm` is the chip the filter bar, the month steppers and the row
 * actions wear; `lg` is a form's own primary action.
 */
export const CONTROL_HEIGHT = {
  xs: 28,
  sm: 36,
  default: 48,
  lg: 56,
} as const;

export type ControlSize = keyof typeof CONTROL_HEIGHT;

/**
 * Elevation is a soft shadow on things that float over the page, and nothing at
 * all on a card — which reads as raised by its hairline border alone. In dark
 * mode a card drops that border and is separated by its lighter fill instead,
 * exactly as `dark:border-transparent` does on the web.
 */
export const SHADOW = {
  menu: {
    light: {
      shadowColor: "#0e0f0c",
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    dark: {
      shadowColor: "#000000",
      shadowOpacity: 0.5,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 8 },
      elevation: 12,
    },
  },
} as const;

/** The weights `_layout.tsx` loads. Inter is both body and heading face. */
export const FONTS = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

/**
 * Sentence case on Wise's own scale. Headings take negative tracking rather
 * than extra weight, and figures get their own steps. React Native measures
 * `letterSpacing` in points, so each em value from the reference is resolved
 * against its own size here rather than at the call site.
 */
export const TYPE = {
  pageTitle: { fontSize: 32, fontFamily: FONTS.bold, letterSpacing: -1.28 },
  sheetTitle: { fontSize: 24, fontFamily: FONTS.bold, letterSpacing: -0.72 },
  cardTitle: { fontSize: 18, fontFamily: FONTS.semibold, letterSpacing: -0.27 },
  body: { fontSize: 16, fontFamily: FONTS.regular },
  bodyMedium: { fontSize: 16, fontFamily: FONTS.medium },
  bodySemibold: {
    fontSize: 16,
    fontFamily: FONTS.semibold,
    letterSpacing: -0.24,
  },
  meta: { fontSize: 14, fontFamily: FONTS.regular },
  metaMedium: { fontSize: 14, fontFamily: FONTS.medium },
  /**
   * The one survivor of the old uppercase treatment, and only for a small label
   * over a figure — stat tiles, hero splits, nav group headings.
   */
  eyebrow: { fontSize: 12, fontFamily: FONTS.semibold, letterSpacing: 0.24 },
  tag: { fontSize: 12, fontFamily: FONTS.semibold },
  figureHero: { fontSize: 60, fontFamily: FONTS.bold, letterSpacing: -2.7 },
  figureTile: { fontSize: 32, fontFamily: FONTS.bold, letterSpacing: -1.28 },
  figureRow: { fontSize: 18, fontFamily: FONTS.bold, letterSpacing: -0.45 },
} as const;

export const BORDER_WIDTH = 1;
