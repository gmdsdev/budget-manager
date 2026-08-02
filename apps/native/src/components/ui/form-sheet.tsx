import { useTranslate } from "@budget-manager/i18n/react";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

/**
 * A form in a sheet: the shape every create and edit screen takes. Submit
 * disables on `isSubmitting` only — never on a form's `canSubmit`, which hides
 * *why* a form will not go through.
 */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  submittingLabel,
  isSubmitting,
  onSubmit,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel: string;
  submittingLabel?: string;
  isSubmitting: boolean;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  const t = useTranslate();

  return (
    <Sheet
      open={open}
      onClose={() => onOpenChange(false)}
      title={title}
      description={description}
      footer={
        <>
          <Button
            variant="outline"
            label={t("common.cancel")}
            onPress={() => onOpenChange(false)}
            style={{ flex: 1 }}
          />
          <Button
            label={isSubmitting ? (submittingLabel ?? t("common.saving")) : submitLabel}
            loading={isSubmitting}
            onPress={onSubmit}
            style={{ flex: 1 }}
          />
        </>
      }
    >
      {children}
    </Sheet>
  );
}
