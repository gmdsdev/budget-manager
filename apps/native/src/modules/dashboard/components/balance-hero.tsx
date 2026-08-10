import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { Feather } from "@expo/vector-icons";
import { View } from "react-native";

import {
  amountTone,
  Pair,
  PairCell,
  projectedTone,
  RHYTHM,
  SoloFigure,
  SplitBar,
} from "@/components/summary-figures";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

/**
 * The one figure the screen is answering — "how much have I got" — stated the way
 * the ledger's own totals state it: on an ordinary card rather than the `primary`
 * plane, with settled and projected as labelled peers and the split bar showing how
 * much of the projection is already real. The chrome is monochrome now, so a
 * high-contrast plane no longer reads as "the important one"; it reads as a second
 * theme, and it forced every label and caption on it into a dimmed `onPrimary` ink.
 *
 * It carries no actions: recording something moved to the app bar, where it is
 * reachable from every tab rather than only from the top of this one screen.
 *
 * This is a transcription of the web's own hero, element for element and margin for
 * margin — the pair wraps rather than being split into halves, the projection is
 * semibold in the secondary ink against the settled figure's bold, and the splits
 * sit on a muted plane below. Both screens read the same because they *are* the
 * same, not because two layouts were tuned to look alike.
 */
export function BalanceHero({
  label,
  amountCents,
  projectedAmountCents,
  currencyCode,
  context,
  splits,
}: {
  label: string;
  amountCents: number;
  projectedAmountCents: number;
  currencyCode: string;
  /** The scope line: the currency, the accounts behind it, the month. */
  context: string;
  splits?: readonly { key: string; label: string; amountCents: number }[];
}) {
  const { t } = useI18n();
  const colors = useColors();
  const format = (cents: number) => formatMinorUnits(cents, currencyCode);
  const waitingCents = Math.abs(projectedAmountCents - amountCents);
  // Pending expenses can project the balance below the settled figure, and a settled
  // share of that projection means nothing — the pair and the waiting caption still
  // state both readings.
  const showBar = amountCents >= 0 && projectedAmountCents > amountCents;

  return (
    <Surface style={{ padding: SPACING.lg }}>
      <Text variant="eyebrow" tone="muted">
        {label}
      </Text>

      {waitingCents > 0 ? (
        <>
          <Pair style={{ marginTop: RHYTHM.block }}>
            <PairCell
              label={t("transaction.summary.effective")}
              cents={amountCents}
              currencyCode={currencyCode}
              tone={amountTone(amountCents)}
            />
            <PairCell
              label={t("transaction.summary.projected")}
              cents={projectedAmountCents}
              currencyCode={currencyCode}
              tone={projectedTone(projectedAmountCents)}
              weight="semibold"
            />
          </Pair>

          {showBar ? (
            <SplitBar
              settledCents={amountCents}
              projectedCents={projectedAmountCents}
            />
          ) : null}

          <View
            style={{
              marginTop: RHYTHM.block,
              flexDirection: "row",
              alignItems: "center",
              gap: RHYTHM.caption,
            }}
          >
            <Feather name="clock" size={16} color={colors.mutedForeground} />
            <Text variant="meta" tone="muted" style={{ flex: 1 }}>
              {t("transaction.summary.waiting", {
                amount: format(waitingCents),
              })}
            </Text>
          </View>
        </>
      ) : (
        <View style={{ marginTop: RHYTHM.tight }}>
          <SoloFigure
            cents={amountCents}
            currencyCode={currencyCode}
            caption={t("transaction.summary.settled")}
          />
        </View>
      )}

      <Text variant="meta" tone="muted" style={{ marginTop: RHYTHM.block }}>
        {context}
      </Text>

      {splits && splits.length > 0 ? (
        // No wrapping and no basis: an even share of the row, so two splits are two
        // columns and the figures line up. A `flexBasis` wide enough for the longest
        // amount is what pushed the third one onto a row of its own.
        <View
          style={{
            marginTop: RHYTHM.section,
            flexDirection: "row",
            gap: SPACING.md,
          }}
        >
          {splits.map((split) => (
            <Surface
              key={split.key}
              radius="lg"
              fill="muted"
              bordered={false}
              style={{ flex: 1, minWidth: 0, padding: SPACING.lg }}
            >
              <Text variant="eyebrow" tone="muted" numberOfLines={1}>
                {split.label}
              </Text>
              <Text
                variant="figureLine"
                tone={amountTone(split.amountCents)}
                adjustsFontSizeToFit
                numberOfLines={1}
                style={{
                  marginTop: RHYTHM.tight,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {format(split.amountCents)}
              </Text>
            </Surface>
          ))}
        </View>
      ) : null}
    </Surface>
  );
}
