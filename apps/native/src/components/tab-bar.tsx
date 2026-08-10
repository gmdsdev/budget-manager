import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, FONTS, RADIUS, SPACING } from "@/theme/tokens";

const PILL = { width: 64, height: 32 } as const;

/** The one type step with no counterpart on the web: nothing there is a tab label. */
const LABEL = { fontFamily: FONTS.medium, fontSize: 11 } as const;

/**
 * The tab bar, drawn by this app rather than by `UITabBarController`.
 *
 * The native bar bought Liquid Glass, the scroll-edge treatment and `minimizeBehavior`,
 * and charged SF Symbols, the system face and a material that only exists on one of the
 * two platforms. This is the same three destinations in the app's own design language:
 * Feather icons, Inter, `background` under a hairline `border`, and the **active tab in
 * the `secondary` pill** the web's sidebar wears for exactly the same job — so "which
 * screen am I on" is answered by a shape, not only by an ink.
 *
 * It pays the bottom inset itself, and it sits in flow above nothing: the scene ends
 * where this bar starts, so no list has to reserve room under a floating bar.
 */
export function AppTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: "row",
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.sm + insets.bottom,
        backgroundColor: colors.background,
        borderTopWidth: BORDER_WIDTH,
        borderTopColor: colors.border,
      }}
    >
      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];

        if (!descriptor) {
          return null;
        }

        const { options } = descriptor;
        const focused = state.index === index;
        const color = focused ? colors.foreground : colors.mutedForeground;
        const label = options.title ?? route.name;

        function press() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={press}
            onLongPress={() =>
              navigation.emit({ type: "tabLongPress", target: route.key })
            }
            style={({ pressed }) => ({
              flex: 1,
              alignItems: "center",
              gap: SPACING.xs,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <View
              style={{
                width: PILL.width,
                height: PILL.height,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: RADIUS.full,
                backgroundColor: focused ? colors.secondary : "transparent",
              }}
            >
              {options.tabBarIcon?.({ focused, color, size: 20 })}
            </View>
            <Text numberOfLines={1} style={[LABEL, { color }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
