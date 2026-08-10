import type { TransactionSummaryRow } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import {
  amountTone,
  Pair,
  PairCell,
  projectedTone,
  RHYTHM,
  SoloFigure,
  SplitBar,
  SplitLegend,
} from "@/components/summary-figures";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, CONTROL_HEIGHT, RADIUS, SPACING } from "@/theme/tokens";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

/**
 * `space-y-5` on the web, and applied as a **margin rather than a `gap`** — see the
 * note on the card below, where that distinction is load-bearing, not stylistic.
 */
const SECTION_GAP = 20;

/**
 * One of the two flow figures, on its own plane inside the card. While anything is
 * waiting, settled and projected sit as labelled peers — a projection demoted to a
 * caption made a pending-heavy month lead with the least informative number — and
 * the bar states the split before either figure is read.
 *
 * The figure takes the **panel** step, the web's `text-2xl`, in both states, and the
 * pair wraps rather than being split into halves, so a paired figure and a collapsed
 * one are the same size. Sizing each to its own box instead would leave Income and
 * Expenses at two different weights whenever only one of them had something still to
 * come.
 */
function FlowTile({
  label,
  icon,
  iconColor,
  amountCents,
  projectedCents,
  currencyCode,
  marginTop,
}: {
  label: string;
  icon: FeatherName;
  iconColor: string;
  amountCents: number;
  projectedCents: number;
  currencyCode: string;
  marginTop: number;
}) {
  const { t } = useI18n();
  const waitingCents = projectedCents - amountCents;

  return (
    <Surface
      fill="muted"
      bordered={false}
      radius="lg"
      style={{ marginTop, padding: SPACING.lg }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: RHYTHM.caption,
        }}
      >
        <Feather name={icon} size={14} color={iconColor} />
        <Text variant="eyebrow" tone="muted">
          {label}
        </Text>
      </View>

      {waitingCents > 0 ? (
        <>
          <Pair style={{ marginTop: RHYTHM.block }}>
            <PairCell
              label={t("transaction.summary.effective")}
              cents={amountCents}
              currencyCode={currencyCode}
              variant="figurePanel"
              tone={amountTone(amountCents)}
            />
            <PairCell
              label={t("transaction.summary.projected")}
              cents={projectedCents}
              currencyCode={currencyCode}
              variant="figurePanel"
              tone={projectedTone(projectedCents)}
              weight="semibold"
            />
          </Pair>
          <SplitBar
            settledCents={Math.max(0, amountCents)}
            projectedCents={projectedCents}
          />
        </>
      ) : (
        <View style={{ marginTop: RHYTHM.tight }}>
          <SoloFigure
            cents={amountCents}
            currencyCode={currencyCode}
            caption={t("transaction.summary.settled")}
            variant="figurePanel"
            captionVariant="tag"
            captionGap={RHYTHM.label}
          />
        </View>
      )}
    </Surface>
  );
}

/**
 * One currency is in view at a time, the reading the dashboard already takes:
 * figures are never summed across currencies, and a block per currency read as one
 * long scroll of near-identical numbers. The row scrolls sideways rather than
 * wrapping, so an account with six currencies costs one row here whatever the
 * screen is; switching costs no refetch, since the payload carries them all.
 *
 * It is the web's **inset track**, not a row of standalone chips: a `muted` plane
 * holding borderless pills, so the group reads as one control with a selection
 * inside it rather than as several buttons that happen to be adjacent. The track
 * hugs its content (`alignSelf`) so it never stretches the width of the card.
 */
function CurrencyPills({
  currencies,
  activeCurrency,
  onSelect,
  label,
  marginTop,
}: {
  currencies: TransactionSummaryRow[];
  activeCurrency: string;
  onSelect: (currencyCode: string) => void;
  label: string;
  marginTop: number;
}) {
  const colors = useColors();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{
        marginTop,
        alignSelf: "flex-start",
        flexDirection: "row",
        padding: RHYTHM.label,
        gap: RHYTHM.label,
        borderRadius: RADIUS.full,
        backgroundColor: colors.muted,
      }}
    >
      {currencies.map((row) => {
        const active = row.currencyCode === activeCurrency;

        return (
          <Pressable
            key={row.currencyCode}
            accessibilityRole="radio"
            accessibilityState={{ checked: active, selected: active }}
            onPress={() => onSelect(row.currencyCode)}
            style={({ pressed }) => ({
              minHeight: CONTROL_HEIGHT.xs,
              justifyContent: "center",
              paddingHorizontal: SPACING.md,
              borderRadius: RADIUS.full,
              backgroundColor: active
                ? colors.secondary
                : pressed
                  ? colors.accent
                  : "transparent",
            })}
          >
            <Text
              variant="metaMedium"
              tone={active ? "default" : "muted"}
              numberOfLines={1}
              style={active ? { color: colors.secondaryForeground } : undefined}
            >
              {row.currencyCode}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * The ledger closes with its totals, between the rows and the pagination, and it
 * reads top-down: the balance the period ends on leads, the two flows follow it,
 * and the net closes the card. Wherever settled and projected disagree the two are
 * stated as labelled peers with a bar showing the split; wherever they agree the
 * block collapses to one figure, which is what keeps a settled past month quiet.
 *
 * This is a transcription of the web's own panel, block for block: the same order,
 * the same margins, the same figure steps, and the same two weights on a pair. The
 * one departure is that the two flows **stack** rather than sitting side by side as
 * they do from `sm` — which is what the web does on a phone too, since its grid is
 * `grid-cols-1 sm:grid-cols-2`.
 *
 * Blocks are spaced with margins rather than a container `gap`, which is what the
 * web's own `space-y-5` is.
 *
 * Two scopes deliberately meet in this payload — balances cover every active wallet
 * up to the end of the range, while income and expenses cover exactly the rows the
 * filters matched — which is what the folded note states. Folded rather than
 * dropped: it has to be somewhere, but it is read once.
 */
export function TransactionSummary({
  currencies,
  rangeTo,
  total,
  preferredCurrency,
  isFetching,
}: {
  currencies: TransactionSummaryRow[];
  /** The end of the range in view: what the balances are stated as of. */
  rangeTo: string;
  /** How many rows the figures cover — every match, not the page in view. */
  total: number;
  /** The account's default, which is a preference and never a scope. */
  preferredCurrency?: string;
  isFetching?: boolean;
}) {
  const { t, formatDateString } = useI18n();
  const colors = useColors();
  const [picked, setPicked] = useState<string | null>(null);
  const [explained, setExplained] = useState(false);

  // A picked currency wins, then the account's preference, then the first the API
  // returned — so a currency that stops existing can never blank the panel.
  const row =
    currencies.find((entry) => entry.currencyCode === picked) ??
    currencies.find((entry) => entry.currencyCode === preferredCurrency) ??
    currencies[0];

  if (!row) {
    return null;
  }

  const asOf = formatDateString(rangeTo, "numeric");
  const walletWaitingCents = Math.abs(
    row.projectedBalanceCents - row.balanceCents,
  );
  // Pending expenses can project the balance below the settled figure, and a
  // settled share of that projection means nothing — the pair and the waiting
  // caption still state both readings.
  const walletBar =
    row.balanceCents >= 0 && row.projectedBalanceCents > row.balanceCents;
  const netWaiting = row.projectedNetCents !== row.netCents;
  const anyBar =
    walletBar ||
    row.projectedIncomeCents > row.incomeCents ||
    row.projectedExpenseCents > row.expenseCents;

  return (
    <Surface
      // Held at reduced opacity on a refetch rather than swapped for a skeleton,
      // so changing a filter never jumps the screen.
      style={{ opacity: isFetching ? 0.6 : 1, padding: SPACING.lg }}
    >
      <View>
        <Text variant="cardTitle">{t("transaction.summary.heading")}</Text>
        <Text variant="meta" tone="muted" style={{ marginTop: RHYTHM.label }}>
          {total === 1
            ? t("transaction.summary.contextOne", { date: asOf })
            : t("transaction.summary.context", { count: total, date: asOf })}
        </Text>
      </View>

      {/* A single-currency account has nothing to pick. */}
      {currencies.length > 1 && (
        <CurrencyPills
          currencies={currencies}
          activeCurrency={row.currencyCode}
          onSelect={setPicked}
          label={t("common.currency")}
          marginTop={SECTION_GAP}
        />
      )}

      <View style={{ marginTop: SECTION_GAP }}>
        <Text variant="eyebrow" tone="muted">
          {t("transaction.summary.inWallets")}
        </Text>
        {walletWaitingCents > 0 ? (
          <>
            <Pair style={{ marginTop: RHYTHM.block }}>
              <PairCell
                label={t("transaction.summary.effective")}
                cents={row.balanceCents}
                currencyCode={row.currencyCode}
                tone={amountTone(row.balanceCents)}
              />
              <PairCell
                label={t("transaction.summary.projected")}
                cents={row.projectedBalanceCents}
                currencyCode={row.currencyCode}
                tone={projectedTone(row.projectedBalanceCents)}
                weight="semibold"
              />
            </Pair>
            {walletBar && (
              <SplitBar
                settledCents={row.balanceCents}
                projectedCents={row.projectedBalanceCents}
              />
            )}
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
                  amount: formatMinorUnits(
                    walletWaitingCents,
                    row.currencyCode,
                  ),
                })}
              </Text>
            </View>
          </>
        ) : (
          <View style={{ marginTop: RHYTHM.tight }}>
            <SoloFigure
              cents={row.balanceCents}
              currencyCode={row.currencyCode}
              caption={t("transaction.summary.settled")}
            />
          </View>
        )}
      </View>

      {/* `grid-cols-1 sm:grid-cols-2` — one per row on a phone, which is what the
          web does at this width too. */}
      <FlowTile
        label={t("transaction.summary.income")}
        icon="arrow-down-left"
        iconColor={colors.success}
        amountCents={row.incomeCents}
        projectedCents={row.projectedIncomeCents}
        currencyCode={row.currencyCode}
        marginTop={SECTION_GAP}
      />
      <FlowTile
        label={t("transaction.summary.expenses")}
        icon="arrow-up-right"
        iconColor={colors.contentSecondary}
        amountCents={row.expenseCents}
        projectedCents={row.projectedExpenseCents}
        currencyCode={row.currencyCode}
        marginTop={SPACING.md}
      />

      {/* The pattern is named once for the whole card; every figure it decorates
          is already stated in text beside the bars. */}
      {anyBar && (
        <SplitLegend
          settledLabel={t("transaction.summary.effective")}
          waitingLabel={t("transaction.summary.waitingLabel")}
          marginTop={SECTION_GAP}
        />
      )}

      <View
        style={{
          marginTop: SECTION_GAP,
          paddingTop: SPACING.lg,
          borderTopWidth: BORDER_WIDTH,
          borderColor: colors.border,
        }}
      >
        <Text variant="meta" tone="secondary">
          {t("transaction.summary.net")}
        </Text>
        {netWaiting ? (
          <Pair align="flex-end" style={{ marginTop: RHYTHM.block }}>
            <PairCell
              label={t("transaction.summary.effective")}
              cents={row.netCents}
              currencyCode={row.currencyCode}
              variant="figureLine"
              tone={amountTone(row.netCents)}
              align="flex-end"
            />
            <PairCell
              label={t("transaction.summary.projected")}
              cents={row.projectedNetCents}
              currencyCode={row.currencyCode}
              variant="figureLine"
              tone={projectedTone(row.projectedNetCents)}
              weight="semibold"
              align="flex-end"
            />
          </Pair>
        ) : (
          <View style={{ marginTop: RHYTHM.tight }}>
            <SoloFigure
              cents={row.netCents}
              currencyCode={row.currencyCode}
              caption={t("transaction.summary.settled")}
              variant="figureLine"
              captionVariant="tag"
              captionGap={RHYTHM.label}
              align="flex-end"
            />
          </View>
        )}
      </View>

      {/* The web folds the note into a `details`; a phone has no such element, so
          the same reading is a disclosure row whose caret swaps direction. */}
      <View
        style={{
          marginTop: SECTION_GAP,
          paddingTop: SPACING.lg,
          borderTopWidth: BORDER_WIDTH,
          borderColor: colors.border,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: explained }}
          onPress={() => setExplained((open) => !open)}
          style={{
            minHeight: CONTROL_HEIGHT.sm,
            flexDirection: "row",
            alignItems: "center",
            gap: RHYTHM.caption,
          }}
        >
          <Feather
            name={explained ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.contentSecondary}
          />
          <Text variant="meta" tone="secondary">
            {t("transaction.summary.explain")}
          </Text>
        </Pressable>
        {explained && (
          <Text variant="meta" tone="muted" style={{ marginTop: RHYTHM.block }}>
            {t("transaction.summary.note", { date: asOf })}
          </Text>
        )}
      </View>
    </Surface>
  );
}
