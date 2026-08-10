import { formatMinorUnits } from "@budget-manager/money";
import { View } from "react-native";

import { Text, type TextTone, type TextVariant } from "@/components/ui/text";
import { withAlpha } from "@/theme/color";
import { useColors } from "@/theme/theme-provider";
import { FONTS, RADIUS, SPACING } from "@/theme/tokens";

/**
 * The pieces the dashboard hero and the ledger totals share, the native twin of
 * `apps/web/src/components/summary-figures.tsx`. Both screens state the same thing
 * — a settled figure, what it is projected to become, and how much of the
 * projection is already real — so the pieces are described once or they drift.
 *
 * **Vertical rhythm is stated by explicit margins, not by a container `gap`.** The
 * web's own spacing is per-element (`mt-0.5` inside a pair, `mt-2` to it, `mt-3` to
 * the bar, `mt-6` to the splits), and a uniform gap cannot reproduce that: one
 * value replaces four and the whole block reads compressed and flat. So the
 * constants below mirror those margins, and callers lay blocks out with them rather
 * than wrapping everything in a `gap` view.
 */
export const RHYTHM = {
  /** `mt-0.5` — an eyebrow to the figure under it. */
  label: 2,
  /** `mt-1` — a tight pair, and a collapsed figure to its eyebrow. */
  tight: SPACING.xs,
  /** `mt-1.5` — a lead figure to its caption. */
  caption: 6,
  /** `mt-2` — an eyebrow to a pair, a bar to its caption, a line to the next. */
  block: SPACING.sm,
  /** `mt-3` — a pair to the bar under it. */
  bar: SPACING.md,
  /** `mt-6` — a block to the splits below it. */
  section: SPACING.xl,
} as const;

export function amountTone(amountCents: number): TextTone {
  return amountCents < 0 ? "destructive" : "default";
}

export function projectedTone(amountCents: number): TextTone {
  return amountCents < 0 ? "destructive" : "secondary";
}

const BAR_HEIGHT = 6;

/**
 * The settled share of the projected figure: solid is settled, washed is still
 * waiting. Decoration only — both figures are stated in full beside it — so callers
 * only render it when 0 ≤ settled ≤ projected, since a share outside that range
 * means nothing.
 *
 * The web draws the waiting share as a hatch. React Native has no repeating
 * gradient, and the alternatives are a second colour (a new pairing to keep
 * colourblind-safe) or an SVG pattern (charts here are plain views on purpose). So
 * the waiting share is the *same* hue at reduced alpha: one colour, two strengths,
 * which reads as "the same thing, not settled yet" and needs no pattern engine.
 */
export function SplitBar({
  settledCents,
  projectedCents,
}: {
  settledCents: number;
  projectedCents: number;
}) {
  const colors = useColors();
  const share = projectedCents > 0 ? (settledCents / projectedCents) * 100 : 0;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        marginTop: RHYTHM.bar,
        height: BAR_HEIGHT,
        flexDirection: "row",
        overflow: "hidden",
        borderRadius: RADIUS.full,
        backgroundColor: colors.chartTrack,
      }}
    >
      <View
        style={{ width: `${share}%`, backgroundColor: colors.chartIncome }}
      />
      <View
        style={{
          width: `${100 - share}%`,
          backgroundColor: withAlpha(colors.chartIncome, 0.4),
        }}
      />
    </View>
  );
}

/** The swatch pair naming what the bar's two strengths mean. */
export function SplitLegend({
  settledLabel,
  waitingLabel,
  marginTop = 0,
}: {
  settledLabel: string;
  waitingLabel: string;
  marginTop?: number;
}) {
  const colors = useColors();

  const entries = [
    { label: settledLabel, fill: colors.chartIncome },
    { label: waitingLabel, fill: withAlpha(colors.chartIncome, 0.4) },
  ];

  return (
    <View
      style={{
        marginTop,
        flexDirection: "row",
        flexWrap: "wrap",
        columnGap: SPACING.lg,
        rowGap: RHYTHM.tight,
      }}
    >
      {entries.map((entry) => (
        <View
          key={entry.label}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: RHYTHM.caption,
          }}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: entry.fill,
            }}
          />
          <Text variant="tag" tone="muted">
            {entry.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Wherever settled and projected disagree the two are stated as peers rather than
 * one of them demoted to a caption — a pending-heavy period otherwise leads with
 * the least informative number.
 *
 * **The pair is a column, and that is deliberate rather than a compromise.** The
 * web lays it out as `flex-wrap` with a column gap, and at phone width that always
 * resolves to the two cells stacked — a money figure at this step is wider than
 * half of a 375pt screen, so they never fit side by side on the layout the web
 * itself shows a phone. Stacking on purpose reproduces that, and it avoids two RN
 * traps that a wrapping row walks straight into:
 *
 * - **A `Text` in a `flexWrap` row with insufficient width has its *box* shrunk,
 *   not its font.** `numberOfLines` does not stop it: the cell collapses to
 *   min-content and the glyphs stack one per line, so the whole panel renders as
 *   two tall grey columns with no readable figure. That is exactly the bug this
 *   replaced, and it is invisible to `check-types`, `lint` and the bundle check.
 * - **`adjustsFontSizeToFit` is the only thing that avoids it in a wrapping row,
 *   and it shrinks per `Text`** — so the longer figure comes out *smaller* than the
 *   one it is meant to be compared against, inverting the reading.
 *
 * A column gives each cell the full width, so neither is squeezed, neither has to
 * shrink, and the two figures are the same size as each other and as a lone one.
 */
export function Pair({
  align = "flex-start",
  style,
  children,
}: {
  /** `flex-end` for a pair that closes a line, like the net row's. */
  align?: "flex-start" | "flex-end";
  style?: { marginTop?: number };
  children: React.ReactNode;
}) {
  return (
    <View style={[{ alignItems: align, rowGap: RHYTHM.block }, style]}>
      {children}
    </View>
  );
}

/**
 * One half of a pair. **The two halves are not the same weight**: the settled
 * figure is bold in the body ink and the projection is semibold in the secondary
 * ink, which is what ranks "already real" above "expected" without either of them
 * being demoted out of the comparison. Same weights on both is how the hierarchy
 * disappears while every figure is still technically on screen.
 */
export function PairCell({
  label,
  cents,
  currencyCode,
  variant = "figureTile",
  tone,
  weight = "bold",
  align = "flex-start",
}: {
  label: string;
  cents: number;
  currencyCode: string;
  variant?: TextVariant;
  tone: TextTone;
  weight?: "bold" | "semibold";
  align?: "flex-start" | "flex-end";
}) {
  return (
    <View style={{ alignItems: align }}>
      <Text variant="eyebrow" tone="muted">
        {label}
      </Text>
      <Text
        variant={variant}
        tone={tone}
        numberOfLines={1}
        style={{
          marginTop: RHYTHM.label,
          fontVariant: ["tabular-nums"],
          ...(weight === "semibold" ? { fontFamily: FONTS.semibold } : null),
        }}
      >
        {formatMinorUnits(cents, currencyCode)}
      </Text>
    </View>
  );
}

/**
 * What a pair collapses to where settled and projected agree: the one figure and
 * the caption saying nothing else is coming. Same figure step the pair takes, so a
 * fully settled period is quieter than a pending one without also being smaller.
 */
export function SoloFigure({
  cents,
  currencyCode,
  caption,
  variant = "figureTile",
  captionVariant = "meta",
  captionGap = RHYTHM.caption,
  align = "flex-start",
}: {
  cents: number;
  currencyCode: string;
  caption: string;
  variant?: TextVariant;
  captionVariant?: TextVariant;
  captionGap?: number;
  align?: "flex-start" | "flex-end";
}) {
  return (
    <View style={{ alignItems: align }}>
      <Text
        variant={variant}
        tone={amountTone(cents)}
        adjustsFontSizeToFit
        numberOfLines={1}
        // The lone figure has the whole width, so shrinking only ever happens to a
        // figure with nothing to be compared against — which is why it is allowed
        // here and not in the pair above.
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {formatMinorUnits(cents, currencyCode)}
      </Text>
      <Text
        variant={captionVariant}
        tone="muted"
        style={{ marginTop: captionGap }}
      >
        {caption}
      </Text>
    </View>
  );
}
