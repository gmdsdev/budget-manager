import { formatIsoDate, parseIsoDate } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { RADIUS, SPACING } from "@/theme/tokens";

const WEEK_DAYS = 7;

/** The web's `--cell-size`, which is what makes the grid a comfortable tap. */
const CELL_SIZE = 40;

/**
 * A month grid built from plain views. The web composes react-day-picker; here
 * the grid is small enough to own, and owning it is what keeps the day pills
 * round and the fills the app's own.
 *
 * Month **and** year are steppable, because react-day-picker's default caption
 * stopping at the end of the current year is exactly what put every future-dated
 * row out of reach on the web.
 */
export function Calendar({
  selected,
  rangeStart,
  rangeEnd,
  onSelect,
}: {
  /** `yyyy-MM-dd`, the string every schema, form and tRPC input already carries. */
  selected?: string;
  rangeStart?: string;
  rangeEnd?: string;
  onSelect: (value: string) => void;
}) {
  const { locale, formatMonthString } = useI18n();
  const colors = useColors();

  const anchor = parseIsoDate(selected ?? rangeStart) ?? new Date();
  const [visible, setVisible] = useState(
    () => new Date(anchor.getFullYear(), anchor.getMonth(), 1),
  );

  const monthKey = `${visible.getFullYear()}-${`${visible.getMonth() + 1}`.padStart(2, "0")}`;
  const firstWeekday = visible.getDay();
  const daysInMonth = new Date(
    visible.getFullYear(),
    visible.getMonth() + 1,
    0,
  ).getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (cells.length % WEEK_DAYS !== 0) {
    cells.push(null);
  }

  const weekdayNames = Array.from({ length: WEEK_DAYS }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(
      // 2024-01-07 is a Sunday, so the row starts where the grid does.
      new Date(2024, 0, 7 + index),
    ),
  );

  function shift(months: number) {
    setVisible(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + months, 1),
    );
  }

  return (
    <View style={{ gap: SPACING.md }}>
      <Stepper
        label={formatMonthString(monthKey, "monthShort")}
        onPrevious={() => shift(-1)}
        onNext={() => shift(1)}
      />
      <Stepper
        label={`${visible.getFullYear()}`}
        onPrevious={() => shift(-12)}
        onNext={() => shift(12)}
      />

      <View style={{ flexDirection: "row" }}>
        {weekdayNames.map((name, index) => (
          <View key={index} style={{ flex: 1, alignItems: "center" }}>
            <Text variant="meta" tone="muted">
              {name}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {cells.map((day, index) => {
          if (day === null) {
            return <View key={index} style={{ width: `${100 / WEEK_DAYS}%`, height: CELL_SIZE }} />;
          }

          const value = formatIsoDate(
            new Date(visible.getFullYear(), visible.getMonth(), day),
          );
          const isSelected = value === selected;
          const isEdge = value === rangeStart || value === rangeEnd;
          const inRange =
            !!rangeStart && !!rangeEnd && value > rangeStart && value < rangeEnd;

          return (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected || isEdge }}
              accessibilityLabel={value}
              onPress={() => onSelect(value)}
              style={{
                width: `${100 / WEEK_DAYS}%`,
                height: CELL_SIZE,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: RADIUS.full,
                  backgroundColor:
                    isSelected || isEdge
                      ? colors.primary
                      : inRange
                        ? colors.secondary
                        : "transparent",
                }}
              >
                <Text
                  variant="meta"
                  tone={isSelected || isEdge ? "onPrimary" : "default"}
                  style={
                    inRange && !isSelected && !isEdge
                      ? { color: colors.secondaryForeground }
                      : undefined
                  }
                >
                  {`${day}`}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Stepper({
  label,
  onPrevious,
  onNext,
}: {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const colors = useColors();

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} −`}
        onPress={onPrevious}
        hitSlop={8}
        style={{ padding: SPACING.sm }}
      >
        <Feather name="chevron-left" size={18} color={colors.foreground} />
      </Pressable>
      <Text variant="metaMedium" style={{ flex: 1, textAlign: "center" }}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} +`}
        onPress={onNext}
        hitSlop={8}
        style={{ padding: SPACING.sm }}
      >
        <Feather name="chevron-right" size={18} color={colors.foreground} />
      </Pressable>
    </View>
  );
}
