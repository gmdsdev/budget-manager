import { DATE_RANGE_PRESETS, type DateRangeValue } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View, type ViewStyle } from "react-native";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, CONTROL_HEIGHT, SPACING } from "@/theme/tokens";

function Trigger({
  text,
  placeholder,
  label,
  invalid,
  style,
  onPress,
}: {
  text?: string;
  placeholder: string;
  label?: string;
  invalid?: boolean;
  style?: ViewStyle;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        {
          minHeight: CONTROL_HEIGHT,
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.sm,
          paddingHorizontal: SPACING.md,
          borderWidth: BORDER_WIDTH,
          borderColor: invalid ? colors.destructive : colors.input,
          backgroundColor: colors.card,
        },
        style,
      ]}
    >
      <Feather name="calendar" size={16} color={colors.mutedForeground} />
      <Text tone={text ? "default" : "muted"} numberOfLines={1} style={{ flex: 1 }}>
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
 */
export function DateRangePicker({
  value,
  onValueChange,
  label,
  style,
}: {
  value: DateRangeValue;
  onValueChange: (value: DateRangeValue) => void;
  label: string;
  style?: ViewStyle;
}) {
  const { t, formatDateString } = useI18n();
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState<string | null>(null);

  const text =
    value.from && value.to
      ? `${formatDateString(value.from, "dayShort")} – ${formatDateString(value.to, "day")}`
      : undefined;

  function handleSelect(next: string) {
    if (!draftStart) {
      setDraftStart(next);

      return;
    }

    const [from, to] = next < draftStart ? [next, draftStart] : [draftStart, next];

    setDraftStart(null);
    onValueChange({ from, to });
    setOpen(false);
  }

  return (
    <>
      <Trigger
        text={text}
        placeholder={t("common.pickADateRange")}
        label={label}
        style={style}
        onPress={() => {
          setDraftStart(null);
          setOpen(true);
        }}
      />
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <View style={{ gap: SPACING.sm }}>
          {DATE_RANGE_PRESETS.map((preset) => (
            <Button
              key={preset.labelKey}
              variant="outline"
              size="sm"
              label={t(preset.labelKey)}
              onPress={() => {
                setDraftStart(null);
                onValueChange(preset.getRange());
                setOpen(false);
              }}
            />
          ))}
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
