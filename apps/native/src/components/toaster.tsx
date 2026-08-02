import { useEffect, useState } from "react";
import { Animated, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Plate } from "@/components/ui/plate";
import { Text } from "@/components/ui/text";
import { subscribeToToasts, type Toast } from "@/lib/toast";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

const VISIBLE_MS = 4_000;

/**
 * The single subscriber to the toast emitter. It sits above the navigator so a
 * message raised by a mutation is not clipped by the sheet the mutation was
 * submitted from, and it renders one toast at a time — a queue of stacked plates
 * on a phone covers the very screen the user is being told about.
 */
export function Toaster() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => subscribeToToasts(setToast), []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [toast, opacity]);

  if (!toast) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: SPACING.lg,
        right: SPACING.lg,
        top: insets.top + SPACING.sm,
        opacity,
      }}
    >
      <Plate shadow="sm">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: SPACING.md,
            padding: SPACING.md,
          }}
        >
          {/* The tone is a square of ink beside the words, never the words'
              own colour: a message has to stay readable on either surface. */}
          <View
            style={{
              width: 8,
              alignSelf: "stretch",
              backgroundColor:
                toast.tone === "error" ? colors.destructive : colors.success,
            }}
          />
          <Text variant="small" style={{ flex: 1 }}>
            {toast.message}
          </Text>
          {toast.action ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                toast.action?.onPress();
                setToast(null);
              }}
              hitSlop={8}
            >
              <Text variant="label">{toast.action.label}</Text>
            </Pressable>
          ) : null}
        </View>
      </Plate>
    </Animated.View>
  );
}
