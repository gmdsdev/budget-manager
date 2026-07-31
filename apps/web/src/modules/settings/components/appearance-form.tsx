import { THEME_MODES, useThemeMode } from "@/components/theme-provider";
import { Button } from "@budget-manager/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@budget-manager/ui/components/field";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useId } from "react";
import { SettingsSection } from "./settings-section";

const THEME_LABELS = {
  light: { label: "Light", icon: SunIcon },
  dark: { label: "Dark", icon: MoonIcon },
} as const;

export function AppearanceForm() {
  const groupId = useId();
  const { mode, setMode } = useThemeMode();

  return (
    <SettingsSection
      title="Appearance"
      description="Pick the colour scheme the app renders in."
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={groupId}>Colour scheme</FieldLabel>
          <div
            id={groupId}
            role="group"
            aria-label="Colour scheme"
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
                  {label}
                </Button>
              );
            })}
          </div>
          <FieldDescription>
            Applied immediately and remembered on this device.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </SettingsSection>
  );
}
