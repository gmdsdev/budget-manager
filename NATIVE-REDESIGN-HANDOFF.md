# Port the Wise redesign to `apps/native`

`apps/web` and `packages/ui` have been redesigned onto Wise's Neptune design system
(commits `e654959` and `08e0022` on `feat/native-app`). `apps/native` was deliberately
**not** touched and still carries the old pastel-neobrutalist tokens, so the two apps are
knowingly out of sync. Your job is to close that gap.

Read `CLAUDE.md` first — its **UI**, **Native** and **Mobile** sections were updated as part
of the redesign and already describe the target state. This file is the delta and the
things that are easy to get wrong.

## What did not change, and why that makes this tractable

`packages/client`, `packages/schemas`, `packages/api` and `packages/money` are untouched.
Every hook, form hook, row shape, filter trio and query-input builder the native screens
already read is still correct. `packages/i18n` only gained keys. **This is a rendering
change, not a behaviour change** — if you find yourself editing a service or a query, stop
and re-read.

Two keys exist purely because native still uses them, and both carry a comment saying so:
`dashboard.stat.net.sparkline` and `budget.period.actionsFor`. If you drop native's
sparkline or its month-card menu, delete the key too.

## Step 1 — mirror the tokens (do this first, alone, and commit it)

`apps/native/src/theme/tokens.ts` mirrors `packages/ui/src/styles/globals.css` by hand,
because React Native reads neither CSS custom properties nor `oklch()`. That duplication is
the *only* accepted duplication of the design; keep it exact.

The web file is now plain sRGB hex, so this is a transcription rather than a conversion.
Current values:

**Light**

```
wiseBrightGreen #9fe870   wiseForestGreen #163300   wiseBrightBlue #a0e1e1
wiseBrightYellow #ffeb69  wiseBrightOrange #ffc091  wiseBrightPink #ffd7ef

background #ffffff   foreground #0e0f0c   card #ffffff        cardForeground #0e0f0c
popover #ffffff      popoverForeground #0e0f0c
primary #9fe870      primaryForeground #163300  primaryHover #80e142
secondary #e2f6d5    secondaryForeground #163300
muted #f1f4ef        mutedForeground #6a6c6a
accent #f1f4ef       accentForeground #0e0f0c
destructive #cb272f  destructiveMuted #fbeaea
border #e3e4e1       input #c9cbc7   ring #0e0f0c
link #163300         contentSecondary #454745
success #054d28      successMuted #e2f6d5
warning #4a3b1c      warningMuted #fff7d7   warningMark #ffd11a
chartIncome #9fe870  chartExpense #163300   chartTrack #e3e7e0
glyphTint 16%
chart1 #2f7ed8  chart2 #e8722c  chart3 #00918f  chart4 #a4841c
chart5 #c94f86  chart6 #3aa957  chart7 #6f57d9  chart8 #e0463c
categoryCyan #0b87b5  categoryLime #6b9420  categoryPurple #9333ac  categorySlate #5c7089
```

**Dark**

```
background #121511   foreground #f3f5f1   card #1e211d   cardForeground #f3f5f1
popover #1e211d      popoverForeground #f3f5f1
primary #9fe870      primaryForeground #163300  primaryHover #cdffad
secondary #1d3f06    secondaryForeground #cdffad
muted #262a24        mutedForeground #a8ada4
accent #262a24       accentForeground #f3f5f1
destructive #ffa8ad  destructiveMuted #410b0d
border #33372f       input #4b5046   ring #f3f5f1
link #9fe870         contentSecondary #cacfc7
success #bae5a0      successMuted #252c20
warning #fadc65      warningMuted #3a3523   warningMark #fadc65
chartIncome #9fe870  chartExpense #a0e1e1   chartTrack #33372f
glyphTint 26%
chart1 #4d9ae8  chart2 #f0894a  chart3 #17a8a4  chart4 #d9b53c
chart5 #e0699b  chart6 #4dbf6d  chart7 #8a75e8  chart8 #f0645a
categoryCyan #33b8e0  categoryLime #8fbf33  categoryPurple #b055c4  categorySlate #7488a1
```

The category aliases hold: blue→chart1, teal→chart3, green→chart6, yellow→chart4,
orange→chart2, red→chart8, pink→chart5, violet→chart7. Only cyan, lime, purple and slate
are their own values.

**Radius** — Wise's scale, and nothing is square any more:
`sm 8`, `md 10` (inputs, pickers), `lg 16` (menus, popovers), `xl 24` (cards, sheets),
`2xl 32` (the hero), `full 9999` (buttons, chips, pills, swatches, glyphs, meters).

**Elevation** — `--shadow-brutal-*` is gone. Light: a hairline border and no shadow on a
card; a soft shadow only on things floating over the page (`0 4px 24px rgb(14 15 12 / .12)`).
Dark: **cards drop their border entirely** (`dark:border-transparent` on web) and are
separated by the lighter `card` fill instead.

**Type** — Inter, sentence case. Native already loads JetBrains Mono via
`@expo-google-fonts/jetbrains-mono`; swap it for Inter and remove the mono dependency.
Scale: page title 32/-0.04em, sheet title 24/-0.03em, card title 18/-0.015em, body and
controls 16, meta 14, eyebrow and tag 12. Figures get their own steps — 60 on the hero,
32 on a stat tile, 18 on a ledger row amount. The old `uppercase` + wide-tracking treatment
is gone everywhere **except** the eyebrow: `12px / 600 / +0.02em / uppercase / muted`, used
only for a small label over a figure.

### The `Palette` component has to go or change meaning

`apps/native/src/components/ui/plate.tsx` exists solely to fake the web's zero-blur offset
shadow by drawing a plate of ink behind each surface. Wise has no hard shadow, so that
device is obsolete. Replace `Plate` with a plain surface (hairline border in light, borderless
lighter fill in dark) — in most places it will stop being needed at all. `Button` inlines the
same geometry for its press effect; that press-slides-into-its-shadow effect goes too. Use a
plain opacity or background change on press instead.

## Step 2 — primitives (`apps/native/src/components/ui/`)

**One control scale, and it does not change with the viewport.** Wise's everyday control is
**48px** (13px padding around 16px/1.2 text), which already clears the touch minimum. The old
40/32px responsive pair and both of its documented traps are gone. Below it: `sm` 36px (chips,
steppers, row actions), `xs` 28px, `lg` 56px (a form's own primary action).

Button variants to match web: `default` (bright green fill, forest green label — **the same in
both themes**, it is the brand surface not a themed one), `outline`, `secondary` (the pale
green pill), `ghost`, `destructive` (**outlined**, `border-destructive/40 text-destructive` — not
a filled red block), `link` (reads `link`, never `primary`), plus `onBrand` and `ghostOnBrand`
for the dashboard hero where the page's own primary is the background.

Keep every invariant the native primitives already have — they are all still correct:
`Select` empties itself when its value leaves `items`; one validation cause revalidated on
change via `FORM_VALIDATION_LOGIC`; a create sheet resets on open as well as close;
`CurrencyInput` reads and writes minor units.

## Step 3 — the structural change, which is the actual point

This is bigger than a repaint. On web, **every listing became a row list and no listing
carries a row menu any more.**

Copy these three files as the pattern — they are small and they are the contract:

- `apps/web/src/components/record-row.tsx` — `RecordList` / `RecordRow` / `RecordGlyph` /
  `RecordTag`. A rounded, borderless item that only shows its edges on press: leading glyph,
  name over a dot-separated meta line, optional status tag, figure opposite.
- `apps/web/src/components/detail-sheet.tsx` — the shell every detail view shares: lead
  figure, fields, then the actions.
- `apps/web/src/modules/wallet/` — the worked example end to end (`wallet-list/wallet-rows.tsx`,
  `wallet-detail-dialog.tsx`, `pages/list-wallets.page.tsx`).

Native already renders listings as one card per row (`ui/row-card.tsx`), so this is a
refinement of something that exists rather than a new idea — but the **row menu must go**. A
dropdown in a list of hundreds of rows puts an irreversible action one mis-tap from a
reversible one. The row opens a detail sheet and every action lives there. On native the
detail view is a **sheet**, not a dialog — that rule already holds in `CLAUDE.md`.

### The invariant that will cost you a debugging pass if you miss it

A detail view's `open` is **derived** (`open={nested === null}`), never a prop the screen owns.
The screen renders `{selected && <XDetail key={selected.id} x={selected} onClose={…} />}`. When
an action opens a nested sheet, the detail component must **stay mounted** — if the screen drops
`selected` at that moment, the component holding the nested sheet unmounts and the nested sheet
never appears. I hit exactly this on web and four e2e tests caught it.

Also: a nested sheet **replaces** the detail view rather than stacking on it. Two modals deep,
the back gesture becomes ambiguous and the scrim doubles up.

## Step 4 — screen-by-screen, in this order

1. **Transactions** — the ledger. Day-grouped rows: a date stated once and ruled off, not
   repeated per row. Row = category-tinted kind glyph, description over
   `category · account · kind · repeats`, status pill, amount opposite. Kind glyph mapping and
   the tint recipe are in `transaction-list/transaction-rows.tsx`. Recording something is **one
   primary action** with card purchase / pay card / transfer beside it — never four peers.
   On web that is a split button in the header and a stacked set in the hero; on a phone a
   bottom action sheet is probably the right shape. See `create-transaction-menu.tsx`.
2. **Dashboard** — leads with a bright-green **hero** carrying the balance, a
   `currency · accounts · month` line, the pending-settlement line, card-debt splits, and the
   create actions stacked on the brand plane. Then three stat tiles (Income / Expenses / Net —
   **the web sparkline was removed**, keep or drop native's as you prefer). Cash-flow bars are
   Wise's own pair: bright green income against forest green expense in light, bright green
   against bright blue in dark. Both dashboard lists use the shared row.
3. **Wallets, credit cards, budgets, categories** — the four listings. Cards show
   `outstanding` with `{amount} available` under it and the limit in the meta line.
4. **Budgets** — meters **state the reading, not the category**: green on track, yellow close
   to the limit, red overspent (`STATUS_FILL` in `budget-meter.tsx`). The category's own ink
   stays in the swatch beside the name, where identity is what is being shown. Horizontal
   meters are pill-shaped `h-2.5` tracks; a healthy wallet or card bar wears **primary green**,
   not a chart hue.
5. **Settings, auth** — mostly falls out of the primitives.

## Rules the redesign is *not* allowed to break

- **No user-visible string literals.** Every word comes from `packages/i18n`, and adding a key
  means adding both `en` and `pt-BR` — the types enforce it.
- **No explanatory code comments.** The existing comments are the style guide: they explain
  *why*, never *what*.
- **A swatch is never the message.** The category palette was re-saturated for this redesign
  and the contrast check re-run: every hue now clears 3:1 against its own card surface
  (`#ffffff` / `#1e211d`), worst adjacent separation 6.7 ΔE light / 7.1 dark. Twelve hues
  cannot all separate under dichromacy, which is why `CategoryLabel` always pairs the swatch
  with the name. **Re-run the check if you change a step** — the method is described in
  `CLAUDE.md` under the category-colour note.
- **Money is integer minor units everywhere.** Never introduce a float.
- Totals are never summed across currencies, and the surface has to say which currency it is
  reporting.

## Verifying

There is no `test` script in `apps/native` (that is deliberate — the logic worth unit-testing
lives in `packages/client`). So:

```bash
bun run check-types          # includes apps/native
bun run lint
bun run test                 # packages + apps/web, must stay green
bunx expo export --platform ios   # catches unresolved imports and broken transforms
bun run native:ios           # the real check, needs a simulator
```

`apps/e2e` only drives the web app, so it should stay green throughout — if it breaks, you
changed something shared that you did not mean to.

## State of the repo

Two commits sit on `feat/native-app` and **have not been pushed** — the SSH agent could not
sign (`communication with agent failed`). Push them before starting:

```bash
git push -u origin feat/native-app
```

One loose end from the web pass: `@tanstack/react-table` is now unused in `apps/web` and can be
removed from its `package.json` (it needs a lockfile refresh, which is why it was left).
