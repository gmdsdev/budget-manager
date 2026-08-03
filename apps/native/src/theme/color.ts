/**
 * The web reaches for `color-mix(in oklab, <ink> <tint>, transparent)` wherever a
 * hue has to sit behind something readable — a record glyph, a wash under an
 * outlined destructive action. React Native has no `color-mix`, but it does read
 * eight-digit hex, and a mix with `transparent` is exactly an alpha.
 */
export function withAlpha(color: string, alpha: number) {
  const clamped = Math.max(0, Math.min(1, alpha));
  const channel = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0");

  return `${color}${channel}`;
}
