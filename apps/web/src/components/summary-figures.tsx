export const EYEBROW =
  "text-xs font-semibold tracking-[0.02em] text-muted-foreground uppercase";

export const HATCH_FILL =
  "repeating-linear-gradient(-55deg, color-mix(in srgb, var(--chart-income) 45%, transparent) 0 4px, transparent 4px 8px)";

export function amountClass(amountCents: number) {
  return amountCents < 0 ? "text-destructive" : "";
}

export function projectedClass(amountCents: number) {
  return amountCents < 0 ? "text-destructive" : "text-content-secondary";
}

/**
 * The settled share of the projected figure: solid is settled, hatched is
 * still waiting. Decoration only — both figures are stated in full beside it —
 * and the hatch is a pattern rather than a second hue, so there is no new
 * colour pairing to keep colourblind-safe. Callers only render it when
 * 0 ≤ settled ≤ projected, since a share outside that range means nothing.
 */
export function SplitBar({
  settledCents,
  projectedCents,
}: {
  settledCents: number;
  projectedCents: number;
}) {
  const share = projectedCents > 0 ? (settledCents / projectedCents) * 100 : 0;

  return (
    <div
      aria-hidden
      data-summary-bar
      className="mt-3 flex h-1.5 w-full flex-row overflow-hidden rounded-full bg-chart-track"
    >
      <div className="h-full bg-chart-income" style={{ width: `${share}%` }} />
      <div
        className="h-full"
        style={{ width: `${100 - share}%`, backgroundImage: HATCH_FILL }}
      />
    </div>
  );
}

export function PairCell({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName: string;
}) {
  return (
    <div>
      <p className={EYEBROW}>{label}</p>
      <p
        className={`mt-0.5 font-heading tracking-[-0.03em] tabular-nums ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}
