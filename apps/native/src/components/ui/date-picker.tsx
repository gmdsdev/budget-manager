import {
  DATE_RANGE_CUSTOM_KEY,
  DATE_RANGE_PRESETS,
  isWholeMonthRange,
  type DateRangeValue,
} from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View, type ViewStyle } from "react-native";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import {
  BORDER_WIDTH,
  CONTROL_HEIGHT,
  RADIUS,
  SPACING,
} from "@/theme/tokens";

/** `sm` is the filter bar's chip; `default` is the 48pt form field. */
export type DatePickerSize = "default" | "sm";

function Trigger({
  text,
  placeholder,
  label,
  invalid,
  size = "default",
  style,
  onPress,
}: {
  text?: string;
  placeholder: string;
  label?: string;
  invalid?: boolean;
  size?: DatePickerSize;
  style?: ViewStyle;
  onPress: () => void;
}) {
  const colors = useColors();
  const isChip = size === "sm";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: isChip ? CONTROL_HEIGHT.sm : CONTROL_HEIGHT.default,
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.sm,
          paddingHorizontal: SPACING.lg,
          borderRadius: isChip ? RADIUS.full : RADIUS.md,
          borderWidth: BORDER_WIDTH,
          borderColor: invalid ? colors.destructive : colors.input,
          backgroundColor: pressed ? colors.accent : colors.card,
        },
        style,
      ]}
    >
      <Feather name="calendar" size={16} color={colors.mutedForeground} />
      <Text
        variant={isChip ? "metaMedium" : "body"}
        tone={text ? "default" : "muted"}
        numberOfLines={1}
        style={{ flex: 1 }}
      >
        {text ?? placeholder}
      </Text>
    </Pressable>
  );
}

/**
 * Reads and writes `yyyy-MM-dd` **strings**, which is what every schema, form and
 * tRPC input already carries — the app never hands a `Date` across that boundary.
 */
export function DatePicker({
  value,
  onValueChange,
  label,
  invalid,
  style,
}: {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  invalid?: boolean;
  style?: ViewStyle;
}) {
  const { t, formatDateString } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Trigger
        text={value ? formatDateString(value, "day") : undefined}
        placeholder={t("common.pickADate")}
        label={label}
        invalid={invalid}
        style={style}
        onPress={() => setOpen(true)}
      />
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={label ?? t("common.pickADate")}
      >
        <Calendar
          // The sheet's Modal keeps its children mounted, so a stale visible month
          // would survive a value picked elsewhere.
          key={value}
          selected={value}
          onSelect={(next) => {
            onValueChange(next);
            setOpen(false);
          }}
        />
      </Sheet>
    </>
  );
}

/**
 * A start-and-end pair is one control, not two date pickers. Two rules are
 * load-bearing: every pick **starts a fresh range** (first tap the start, second
 * the end, ordered if the second lands earlier), and only a *complete* range is
 * handed to `onValueChange` — so a caller that requires a range is never left
 * holding half of one.
 *
 * The trigger names the period rather than reciting its ends: a whole month reads
 * as `August 2026` and a single day as itself. On a phone that is not only how a
 * reader refers to the range, it is what leaves room for the stepper arrows beside
 * it — `1 de ago. – 31 de ago. de 2026` does not fit next to two chips.
 */
export function DateRangePicker({
  value,
  onValueChange,
  label,
  size,
  style,
}: {
  value: DateRangeValue;
  onValueChange: (value: DateRangeValue) => void;
  label: string;
  size?: DatePickerSize;
  style?: ViewStyle;
}) {
  const { t, formatDateStringRange, formatMonthString } = useI18n();
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState<string | null>(null);
  // `Custom` sets no range, so being on it is the one thing about this control that
  // cannot be read back off the value. It lasts as long as the sheet.
  const [custom, setCustom] = useState(false);

  const activePreset = DATE_RANGE_PRESETS.find((preset) => {
    const range = preset.getRange();

    return range.from === value.from && range.to === value.to;
  });

  // `Intl` states whatever the two ends share once (`2 – 8 de ago. de 2026`) and
  // collapses a range of one day to that day, so neither needs a branch here.
  const text =
    value.from && value.to
      ? isWholeMonthRange(value)
        ? formatMonthString(value.from.slice(0, 7), "monthYear")
        : formatDateStringRange(value.from, value.to, "day")
      : undefined;

  function handleSelect(next: string) {
    if (!draftStart) {
      setDraftStart(next);

      return;
    }

    const [from, to] = next < draftStart ? [next, draftStart] : [draftStart, next];

    setDraftStart(null);
    setCustom(false);
    onValueChange({ from, to });
    setOpen(false);
  }

  return (
    <>
      <Trigger
        text={text}
        placeholder={t("common.pickADateRange")}
        label={label}
        size={size}
        style={style}
        onPress={() => {
          setDraftStart(null);
          setCustom(false);
          setOpen(true);
        }}
      />
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <View style={{ gap: SPACING.sm }}>
          {DATE_RANGE_PRESETS.map((preset) => (
            <Button
              key={preset.labelKey}
              variant={
                !custom && preset === activePreset ? "secondary" : "outline"
              }
              size="sm"
              label={t(preset.labelKey)}
              onPress={() => {
                setDraftStart(null);
                setCustom(false);
                onValueChange(preset.getRange());
                setOpen(false);
              }}
            />
          ))}

          {/* The one option that applies nothing: it marks a range no preset can
              express, and tapping it leaves the sheet open on the calendar below
              rather than committing anything. */}
          <Button
            variant={custom || !activePreset ? "secondary" : "outline"}
            size="sm"
            label={t(DATE_RANGE_CUSTOM_KEY)}
            onPress={() => setCustom(true)}
          />
        </View>

        <Calendar
          key={draftStart ?? value.from}
          rangeStart={draftStart ?? value.from}
          rangeEnd={draftStart ? undefined : value.to}
          onSelect={handleSelect}
        />
      </Sheet>
    </>
  );
}
