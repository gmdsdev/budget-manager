import type { ReactNode } from "react";

/**
 * One row of a listing, shared by every screen that shows records: the ledger,
 * wallets, cards, budgets, categories and the dashboard's own lists.
 *
 * The shape is Wise's — a rounded, borderless item that only shows its edges on
 * hover: a leading glyph, the record's name over a dot-separated meta line, an
 * optional status tag, and the figure opposite. A bordered plate around hundreds
 * of rows reads as one undifferentiated block, which is why there isn't one. And
 * **the whole row is the way in to the record**. None of these listings carries a
 * row menu: a dropdown in a list of hundreds of rows puts an irreversible action
 * one mis-tap from a reversible one, so every action lives in the detail dialog
 * the row opens.
 *
 * `data-list-table` / `data-list-row` / `data-list-cell` are what the e2e row
 * helpers count and read, which is why they live here rather than per screen —
 * `rowTexts` returns cells in DOM order, so `primary` is always `cells[0]`.
 */
export function RecordList({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <ul
      data-list-table=""
      aria-label={label}
      className={className ?? "flex flex-col gap-0.5"}
    >
      {children}
    </ul>
  );
}

export function RecordRow({
  glyph,
  primary,
  meta,
  tag,
  trailing,
  label,
  onSelect,
}: {
  glyph?: ReactNode;
  /** The record's name. Always the first cell an assertion reads. */
  primary: ReactNode;
  /** Dot-separated; falsy entries drop out, so a screen can omit a field. */
  meta?: readonly ReactNode[];
  /** A status pill, hidden below sm where the row has no width for it. */
  tag?: ReactNode;
  trailing?: ReactNode;
  label: string;
  /** Omitted where the record has nowhere to open — the row then reads as plain. */
  onSelect?: () => void;
}) {
  const parts = (meta ?? []).filter(Boolean);
  // The control is inside the <li> rather than being it: the row opens the
  // record, and a list item cannot carry that role.
  const interactive = onSelect
    ? {
        role: "button" as const,
        tabIndex: 0,
        "aria-label": label,
        onClick: onSelect,
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          // Not a <button>, so Space would scroll the page instead.
          event.preventDefault();
          onSelect();
        },
      }
    : undefined;

  return (
    <li data-list-row="">
      <div
        {...interactive}
        className={`flex flex-row items-center gap-4 rounded-lg px-4 py-3 ${
          onSelect
            ? "cursor-pointer transition-colors outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            : ""
        }`}
      >
        {glyph}

        <div className="min-w-0 flex-1">
          <div
            data-list-cell
            className="truncate font-semibold tracking-[-0.015em]"
          >
            {primary}
          </div>
          {parts.length > 0 ? (
            <p className="flex flex-row flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
              {parts.map((part, index) => (
                // Index keys: these are positional slots on one row, not a
                // reorderable collection.
                <span key={index} className="flex flex-row items-center gap-1.5">
                  {index > 0 ? (
                    <span aria-hidden className="opacity-50">
                      ·
                    </span>
                  ) : null}
                  <span data-list-cell>{part}</span>
                </span>
              ))}
            </p>
          ) : null}
        </div>

        {tag ? <div className="hidden shrink-0 sm:block">{tag}</div> : null}
        {trailing ? <div className="shrink-0 text-right">{trailing}</div> : null}
      </div>
    </li>
  );
}

/** A circle tinted with the record's own hue, holding an icon. */
export function RecordGlyph({
  color,
  children,
}: {
  /** A CSS colour. Falls back to the muted ink when the record has none. */
  color?: string;
  children: ReactNode;
}) {
  const ink = color ?? "var(--muted-foreground)";

  return (
    <span
      aria-hidden
      className="flex size-11 shrink-0 items-center justify-center rounded-full"
      style={{
        // A hue at full strength behind a dark glyph is unreadable in light mode
        // and shouty in dark, so the fill is a tint of it.
        backgroundColor: `color-mix(in oklab, ${ink} var(--glyph-tint), transparent)`,
        color: ink,
      }}
    >
      {children}
    </span>
  );
}

/** A status pill. `tone` picks the sentiment wash. */
export function RecordTag({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "positive" | "warning" | "negative";
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-muted text-content-secondary",
    positive: "bg-success-muted text-success",
    warning: "bg-warning-muted text-warning",
    negative: "bg-destructive-muted text-destructive",
  } as const;

  return (
    <span
      data-list-cell
      className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
