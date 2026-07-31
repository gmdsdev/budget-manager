import { THEME_MODES, useThemeMode } from "@/components/theme-provider";
import { Button } from "@budget-manager/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@budget-manager/ui/components/field";
import { useTranslate } from "@budget-manager/i18n/react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useId } from "react";
import { SettingsSection } from "./settings-section";

const THEME_LABELS = {
  light: { label: "common.light", icon: SunIcon },
  dark: { label: "common.dark", icon: MoonIcon },
} as const;

export function AppearanceForm() {
  const t = useTranslate();
  const groupId = useId();
  const { mode, setMode } = useThemeMode();

  return (
    <SettingsSection
      title={t("settings.appearance.title")}
      description={t("settings.appearance.description")}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={groupId}>
            {t("settings.appearance.scheme")}
          </FieldLabel>
          <div
            id={groupId}
            role="group"
            aria-label={t("settings.appearance.scheme")}
            className="flex flex-row gap-2"
          >
            {THEME_MODES.map((value) => {
              const { label, icon: Icon } = THEME_LABELS[value];

              return (
                <Button
                  key={value}
                  type="button"
                  variant={mode === value ? "secondary" : "outline"}
                  className="flex-1"
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                >
                  <Icon aria-hidden />
                  {t(label)}
                </Button>
              );
            })}
          </div>
          <FieldDescription>
            {t("settings.appearance.hint")}
          </FieldDescription>
        </Field>
      </FieldGroup>
    </SettingsSection>
  );
}
