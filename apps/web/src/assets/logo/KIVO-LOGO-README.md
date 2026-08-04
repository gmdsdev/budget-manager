# Kivo — logo files

## Concept

An abstract **K** built from three monoline strokes with round caps, in the same flat
geometric language as the Wise system. The upper arm reaches higher than the lower one, so
the mark leans upward — growth, money moving in the right direction — without becoming a
literal chart or arrow.

The **K is the wordmark's capital letter**, not a separate icon sitting next to it. This is
why there is no "mark + wordmark" lockup: pairing the mark with a full "Kivo" would read as
"Kkivo". Use the mark alone where the name is already present (app icon, favicon, avatar),
and the logo everywhere else.

## Colors

| Token | Hex | Use |
|---|---|---|
| `--kivo-green` | `#9FE870` | Accent / mark on dark |
| `--kivo-forest` | `#163300` | Base / mark on light |
| `--kivo-ink` | `#0E1B00` | Mono dark (print, one-colour) |
| white | `#FFFFFF` | Mono light on photography |

Only two combinations are on-brand: **green on forest** and **forest on green**. Never green
on white (fails contrast) and never green on mid-tone photography.

## Geometry

- Icon grid: 512 × 512, stroke weight **64**, round caps and joins.
- Wordmark: cap height **144**, x-height **100**, stroke **32**, letter gap **26** (tightened
  to **16** between `v` and `o` to compensate for the diagonal-to-round pairing).
- The `o` overshoots the x-height by 2 units top and bottom — correct optically, don't
  "fix" it.
- Clear space: **one stroke width** (32 units at logo scale) on all sides. The padded
  `kivo-logo-on-*` files already have this baked in.

## Files

### `svg/`

| File | Use |
|---|---|
| `kivo-logo-forest.svg` | Primary logo, light backgrounds |
| `kivo-logo-green.svg` | Primary logo, forest / dark backgrounds |
| `kivo-logo-white.svg` | Mono, photography and dark UI |
| `kivo-logo-black.svg` | Mono, print and single-colour output |
| `kivo-logo-on-forest.svg` | Logo on a forest tile, clear space included |
| `kivo-logo-on-green.svg` | Logo on a green tile, clear space included |
| `kivo-mark-*.svg` | K mark alone, transparent, four colourways |
| `kivo-app-icon.svg` | Rounded square, green on forest |
| `kivo-app-icon-square.svg` | Unrounded — for stores that apply their own mask |
| `kivo-app-icon-circle.svg` | Circular, for avatars |
| `kivo-app-icon-inverted.svg` | Forest on green |

### `png/`

- App icon: 16, 32, 48, 64, 120, 128, 152, 180, 192, 256, 512, 1024 px
- `kivo-app-icon-square-1024.png` — App Store / Play Store submission
- `favicon.ico` — 16/32/48 multi-resolution
- Logos: 600 / 1200 / 2400 px wide, transparent, all colourways
- Marks: 1024 px wide, transparent

## Notes

- SVGs use live `stroke` rather than outlined paths, so weight is easy to adjust. If a tool
  chokes on strokes, run Object → Path → Stroke to Path (Illustrator: Object → Expand).
- Below ~24 px, use the mark alone — the wordmark's counters close up.
- This is an original mark. It borrows Wise's *design language* (palette structure, flat
  monoline geometry, round terminals), not their trademarked flag mark or typeface. Wise's
  logo, name, and brand assets remain their property and shouldn't be used in Kivo.
