import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { RADIUS } from "@/theme/tokens";

/**
 * Initials from a display name: the first letter of the first and last words, so
 * "Guilherme Souza" reads GS and a single-word name reads G. Non-letter characters
 * are skipped rather than rendered — a name that starts with a quote or an emoji
 * would otherwise put punctuation in the circle.
 */
export function initialsFor(name: string) {
  const words = name
    .split(/\s+/)
    .map((word) => [...word].find((character) => /\p{L}/u.test(character)))
    .filter((letter): letter is string => !!letter);

  if (words.length === 0) {
    return "";
  }

  const first = words[0] ?? "";
  const last = words.length > 1 ? (words.at(-1) ?? "") : "";

  return `${first}${last}`.toUpperCase();
}

/**
 * The account's mark: a neutral disc, not a branded one. It sits in the app bar right
 * beside the filled create action, and two filled discs a thumb's width apart read as
 * two peers — while the one that matters is the action. `muted` keeps the mark
 * legible as an object without competing for the eye.
 */
export function AccountAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const colors = useColors();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: RADIUS.full,
        backgroundColor: colors.muted,
      }}
    >
      <Text variant="tag" tone="secondary">
        {initialsFor(name)}
      </Text>
    </View>
  );
}
