import { useTranslate } from "@budget-manager/i18n/react";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SettingsSection } from "@/modules/settings/components/settings-section";
import { useTheme } from "@/theme/theme-provider";
import { SPACING, THEME_MODES } from "@/theme/tokens";

/**
 * The colour scheme is the one setting that is not server state: it is applied
 * immediately and remembered on this device, so there is nothing to submit.
 */
export function AppearanceForm() {
  const t = useTranslate();
  const { mode, setMode } = useTheme();

  return (
    <SettingsSection
      title={t("settings.appearance.title")}
      description={t("settings.appearance.description")}
    >
      <Field
        label={t("settings.appearance.scheme")}
        description={t("settings.appearance.hint")}
      >
        <View style={{ flexDirection: "row", gap: SPACING.sm }}>
          {THEME_MODES.map((value) => (
            <Button
              key={value}
              variant={mode === value ? "secondary" : "outline"}
              label={value === "light" ? t("common.light") : t("common.dark")}
              onPress={() => setMode(value)}
              style={{ flex: 1 }}
            />
          ))}
        </View>
      </Field>
    </SettingsSection>
  );
}
