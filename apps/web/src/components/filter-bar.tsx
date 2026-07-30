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
  return (
    <div className="flex flex-row flex-wrap items-center justify-start gap-2 pb-4">
      {children}

      {isFiltered && (
        <Button variant="ghost" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
