import { useTranslate } from "@budget-manager/i18n/react";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";

/**
 * Every destructive action is confirmed, series included: a row menu puts an
 * irreversible action one tap from a mis-press. Pause/resume stays unconfirmed on
 * purpose — it is reversible from the same menu.
 */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
}) {
  const t = useTranslate();

  return (
    <Sheet
      open={open}
      onClose={() => onOpenChange(false)}
      title={title}
      footer={
        <>
          <Button
            variant="outline"
            label={t("common.cancel")}
            onPress={() => onOpenChange(false)}
            style={{ flex: 1 }}
          />
          <Button
            variant="destructive"
            label={isPending ? (pendingLabel ?? t("common.deleting")) : confirmLabel}
            loading={isPending}
            onPress={onConfirm}
            style={{ flex: 1 }}
          />
        </>
      }
    >
      <Text tone="muted">{description}</Text>
    </Sheet>
  );
}
