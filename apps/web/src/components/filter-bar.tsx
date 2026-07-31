import { useTranslate } from "@budget-manager/i18n/react";
import { Button } from "@budget-manager/ui/components/button";
import type { ReactNode } from "react";

export function FilterBar({
  children,
  isFiltered,
  onClear,
}: {
  children: ReactNode;
  isFiltered: boolean;
  onClear: () => void;
}) {
  const t = useTranslate();

  // Two columns on a phone rather than one: seven stacked controls would push
  // the list itself off the first screen.
  return (
    <div className="grid grid-cols-2 items-center gap-2 pb-4 sm:flex sm:flex-row sm:flex-wrap sm:justify-start">
      {children}

      {isFiltered && (
        <Button
          variant="ghost"
          onClick={onClear}
          className="col-span-2 sm:col-span-1"
        >
          {t("common.clearFilters")}
        </Button>
      )}
    </div>
  );
}
