import { useEffect, useState } from "react";
import { Animated, View } from "react-native";

import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

export function Skeleton({ height = 40 }: { height?: number }) {
  const colors = useColors();
  // Created once and never replaced, which is what a state initialiser is for —
  // reading a ref during render is what the hook rules forbid.
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ height, opacity, backgroundColor: colors.muted, width: "100%" }}
    />
  );
}

export function SkeletonList({
  count = 3,
  height = 64,
  label,
}: {
  count?: number;
  height?: number;
  label: string;
}) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={{ gap: SPACING.sm }}
    >
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} height={height} />
      ))}
    </View>
  );
}
