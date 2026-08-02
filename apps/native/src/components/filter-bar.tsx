import { useTranslate } from "@budget-manager/i18n/react";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { SPACING } from "@/theme/tokens";

/**
 * The bar owns the layout and the `Clear filters` button, so no screen positions its
 * own. Controls wrap two to a row: seven stacked full-width ones would push the list
 * itself off the first screen.
 */
export function FilterBar({
  children,
  isFiltered,
  onClear,
}: {
  children: React.ReactNode;
  isFiltered: boolean;
  onClear: () => void;
}) {
  const t = useTranslate();

  return (
    <View style={{ gap: SPACING.sm }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm }}>
        {children}
      </View>

      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          label={t("common.clearFilters")}
          onPress={onClear}
        />
      )}
    </View>
  );
}
