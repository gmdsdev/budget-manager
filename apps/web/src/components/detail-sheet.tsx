import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@budget-manager/ui/components/dialog";
import type { ReactNode } from "react";

/**
 * The shell every record's detail view shares: the lead figure, the fields, then
 * the actions. Five screens open one of these, and stating the layout once is
 * what keeps a wallet's detail view reading like a transaction's.
 *
 * A nested dialog **replaces** this one rather than stacking on it — two modals
 * deep, Escape becomes ambiguous and the scrim doubles up — which is why the
 * caller derives `open` from its own nested-dialog state rather than owning a
 * boolean. It also has to stay mounted while a nested dialog is up, or the
 * component holding that dialog unmounts before it can render.
 */
export function DetailSheet({
  open,
  onOpenChange,
  title,
  description,
  amount,
  negative = false,
  children,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** The one figure the record is about, set large. Omitted when it has none. */
  amount?: string;
  negative?: boolean;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        {amount ? (
          <p
            className={`text-3xl font-bold tracking-[-0.04em] tabular-nums ${
              negative ? "text-destructive" : ""
            }`}
          >
            {amount}
          </p>
        ) : null}

        <dl className="divide-y divide-border">{children}</dl>

        <div className="flex flex-col gap-2">{actions}</div>
      </DialogContent>
    </Dialog>
  );
}

export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-row items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium [&>*]:justify-end">
        {children}
      </dd>
    </div>
  );
}
