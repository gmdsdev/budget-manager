import type { CategoryColor } from "@budget-manager/schemas";

/**
 * The one place the design language is written down for native. It mirrors
 * `packages/ui/src/styles/globals.css` token for token — React Native cannot
 * read CSS custom properties, and it cannot parse `oklch()` either, so the
 * achromatic and chromatic steps are carried here as the sRGB hex they resolve
 * to. Change a token there and change it here; the hues are the same design.
 */
export type ThemeMode = "light" | "dark";

export const THEME_MODES: readonly ThemeMode[] = ["light", "dark"];

type Palette = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
  shadowHard: string;
  success: string;
  warning: string;
  chart: readonly string[];
  chartIncome: string;
  chartExpense: string;
  chartTrack: string;
  category: Record<CategoryColor, string>;
};

const LIGHT_CHART = [
  "#689bdb",
  "#de8e69",
  "#009595",
  "#c7b05a",
  "#b7698f",
  "#6cb17b",
  "#7a6fb4",
  "#d2736c",
] as const;

const DARK_CHART = [
  "#5788c7",
  "#ca7b57",
  "#008e9d",
  "#aa943d",
  "#a4587d",
  "#5a9e6a",
  "#6c5fa7",
  "#bd615b",
] as const;

const light: Palette = {
  background: "#ebebeb",
  foreground: "#181818",
  card: "#fcfcfc",
  cardForeground: "#181818",
  popover: "#fcfcfc",
  popoverForeground: "#181818",
  primary: "#181818",
  primaryForeground: "#fcfcfc",
  secondary: "#c0ddc5",
  secondaryForeground: "#181818",
  muted: "#dedede",
  mutedForeground: "#525252",
  accent: "#dedede",
  accentForeground: "#181818",
  destructive: "#a83630",
  border: "#262626",
  input: "#262626",
  ring: "#181818",
  shadowHard: "#262626",
  success: "#31693f",
  warning: "#876114",
  chart: LIGHT_CHART,
  chartIncome: LIGHT_CHART[5],
  chartExpense: LIGHT_CHART[7],
  chartTrack: "#d0dcec",
  // Eight slots alias the chart ring so a category bar and a chart series of
  // the same hue cannot drift apart; four fill the gaps the ring leaves.
  category: {
    blue: LIGHT_CHART[0],
    cyan: "#60bbde",
    teal: LIGHT_CHART[2],
    green: LIGHT_CHART[5],
    lime: "#80a03e",
    yellow: LIGHT_CHART[3],
    orange: LIGHT_CHART[1],
    red: LIGHT_CHART[7],
    pink: LIGHT_CHART[4],
    purple: "#955599",
    violet: LIGHT_CHART[6],
    slate: "#748192",
  },
};

const dark: Palette = {
  background: "#191919",
  foreground: "#e8e8e8",
  card: "#1e1e1e",
  cardForeground: "#e8e8e8",
  popover: "#1e1e1e",
  popoverForeground: "#e8e8e8",
  primary: "#e8e8e8",
  primaryForeground: "#181818",
  secondary: "#37563d",
  secondaryForeground: "#e8e8e8",
  muted: "#292929",
  mutedForeground: "#a8a8a8",
  accent: "#2e2e2e",
  accentForeground: "#e8e8e8",
  destructive: "#dd7570",
  border: "#989898",
  input: "#989898",
  ring: "#e8e8e8",
  shadowHard: "#000000",
  success: "#75b683",
  warning: "#cea856",
  chart: DARK_CHART,
  chartIncome: DARK_CHART[5],
  chartExpense: DARK_CHART[7],
  chartTrack: "#2d3e55",
  category: {
    blue: DARK_CHART[0],
    cyan: "#459ec2",
    teal: DARK_CHART[2],
    green: DARK_CHART[5],
    lime: "#6a862d",
    yellow: DARK_CHART[3],
    orange: DARK_CHART[1],
    red: DARK_CHART[7],
    pink: DARK_CHART[4],
    purple: "#854888",
    violet: DARK_CHART[6],
    slate: "#7a8798",
  },
};

export const PALETTES: Record<ThemeMode, Palette> = { light, dark };

export type ThemeColors = Palette;

/**
 * `--radius` is `0rem` and every step is pinned to it, so nothing in this app is
 * ever rounded. Kept as a named token rather than a literal `0` so a component
 * reads as speaking the design language rather than as having forgotten it.
 */
export const RADIUS = 0;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
} as const;

/**
 * Elevation is a hard offset, never a blur — the web casts
 * `Npx Npx 0 0 var(--shadow-hard)`. React Native has no zero-blur box shadow
 * that renders the same on both platforms, so the offset is drawn as a plate
 * behind the element (`Plate` in `components/ui/plate.tsx`) at these offsets.
 */
export const SHADOW_OFFSET = {
  xs: 2,
  sm: 3,
  default: 4,
  lg: 6,
} as const;

export type ShadowSize = keyof typeof SHADOW_OFFSET;

/**
 * One mono face everywhere: `JetBrains Mono` is both `--font-sans` and
 * `--font-heading`. The weights are the ones `_layout.tsx` loads.
 */
export const FONTS = {
  regular: "JetBrainsMono_400Regular",
  medium: "JetBrainsMono_500Medium",
  semibold: "JetBrainsMono_600SemiBold",
  bold: "JetBrainsMono_700Bold",
} as const;

/**
 * Headings, buttons, labels and table headers are bold uppercase with tracking.
 * Native has no `text-transform` shorthand per size, so the tracking lives here
 * and the casing is applied by the `Text` variants that carry it.
 */
export const TYPE = {
  h1: { fontSize: 20, fontFamily: FONTS.bold, letterSpacing: 1 },
  h2: { fontSize: 14, fontFamily: FONTS.bold, letterSpacing: 0.8 },
  h3: { fontSize: 13, fontFamily: FONTS.bold, letterSpacing: 0.6 },
  body: { fontSize: 14, fontFamily: FONTS.regular },
  bodyMedium: { fontSize: 14, fontFamily: FONTS.medium },
  small: { fontSize: 12, fontFamily: FONTS.regular },
  tiny: { fontSize: 11, fontFamily: FONTS.regular },
  label: { fontSize: 12, fontFamily: FONTS.semibold, letterSpacing: 0.6 },
  figure: { fontSize: 22, fontFamily: FONTS.semibold },
  figureLead: { fontSize: 26, fontFamily: FONTS.bold },
} as const;

/** 44pt is the tap target every control on this app meets or exceeds. */
export const CONTROL_HEIGHT = 44;

export const BORDER_WIDTH = 1;

/** Cards, tables, dialogs and popovers are plated with a doubled edge. */
export const PLATE_BORDER_WIDTH = 2;
