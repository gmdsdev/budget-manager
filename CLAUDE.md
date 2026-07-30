# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Bun + Turborepo monorepo. Run everything from the repo root unless noted.

```bash
bun install
bun run dev                # all apps (web :3001, server :3000)
bun run dev:web            # web only
bun run dev:server         # server only
bun run check-types        # tsc across every workspace
bun run lint               # single flat ESLint config at the root
bun run lint:fix
bun run test               # turbo test (apps/web + packages/api + packages/money + packages/schemas)
bun run build
```

### Single test

Tests are `bun:test`. Turbo wires `test` in `apps/web`, `packages/api`, `packages/money` and `packages/schemas`; run a single file from inside that workspace so `bunfig.toml` preloads happy-dom:

```bash
cd apps/web && bun test src/modules/wallet/components/currency-input.test.tsx
cd apps/web && bun test -t "reads typed digits"    # filter by test name
cd packages/api && bun test
cd packages/money && bun test
cd packages/schemas && bun test
```

There is no test *database*, so `packages/api` unit tests cover pure logic only (e.g.
`modules/wallet/balance.ts`), which is why rules that could live in SQL are deliberately
kept in TypeScript — see the balances note below.

### End-to-end

`apps/e2e` runs against a live stack and is the only suite that executes real SQL. It is
**deliberately excluded from `turbo run test`** — it declares `test:e2e`, not `test`, so
`bun run test` and the pre-push hook stay hermetic. Never give it a `test` script.

```bash
bun run db:start && bun run db:migrate && bun run dev   # prerequisites
bun run test:e2e          # 240 checks: API + browser
bun run test:e2e:api      # server only, ~2s
bun run test:e2e:ui       # Playwright flows
```

The API suite drives a real `createTRPCClient<AppRouter>`, so a renamed procedure or changed
input is a *compile* error in the tests, not a runtime surprise. Each test file signs up its
own user, so suites are order-independent and safe against a dev database with existing rows;
nothing is truncated. `requireServer()`/`requireWeb()` fail with "start it with…" instead of
letting every test time out. Chromium needs `bunx playwright install chromium` once.

Three hard-won details in `src/support/web.ts`:

- Assert on row *counts* via `waitForRowCount` rather than sleeping.
- Read text through `rowTexts`/`bodyText`, which flatten the non-breaking spaces `Intl` money
  formatting emits (a plain `"R$ 300,00"` never matches raw `innerText`).
- **One shared Chromium, a fresh context per suite** (`openApp`/`closeApp`). Launching a browser
  per suite file starved the machine badly enough that `page.goto` timed out at 60s; contexts
  give the same cookie isolation for a fraction of the cost. Teardown hooks also need an
  explicit timeout — bun's 5s default is not always enough to close a context, and a timed-out
  teardown leaks it into the next suite.

`apps/web/test-setup.ts` registers a global `afterEach(cleanup)`. Don't rely on
`@testing-library/react`'s built-in auto-cleanup: it registers its hook at import
time, which Bun scopes to whichever test file imports RTL *first*, so cleanup
silently becomes filename-order-dependent and unrelated suites start failing on
leftover DOM.

### Database

Postgres runs via `packages/db/docker-compose.yml`; `drizzle.config.ts` reads `DATABASE_URL` from `apps/server/.env`.

```bash
bun run db:start           # docker compose up -d
bun run db:generate        # after editing packages/db/src/schema/* → writes drizzle/NNNN_*.sql
bun run db:migrate         # apply pending migrations
bun run db:studio
```

**Migrations, never push.** `bun run db:push` is for throwaway databases only — it applies a diff without recording it in `drizzle/meta/_journal.json`, so the snapshot silently drifts and later migrations are generated against the wrong baseline. Always read the generated SQL before applying: drizzle-kit emits `text` → enum changes as `DROP COLUMN` + `ADD COLUMN`, which discards data. `db:generate` reporting "no changes" right after a migrate is the check that snapshot and database agree.

Git hooks: `lint-staged` (eslint --fix) on commit, `check-types` + `test` on push.

## Architecture

```
apps/server      Hono host — mounts better-auth at /api/auth/* and tRPC at /trpc/*
apps/web         Vite + React 19 + TanStack Router/Query/Form/Table
apps/e2e         Live-stack end-to-end tests (API + Playwright), outside `turbo test`
packages/api     tRPC routers + business logic (routes → service → repository)
                 modules: wallet, category, transaction, credit-card, dashboard
packages/db      Drizzle schema, migrations, the `db` singleton
packages/auth    better-auth instance (drizzle adapter)
packages/schemas Zod schemas + enums shared by client and server
packages/money   Minor-unit math and currency formatting (no deps)
packages/ui      shadcn primitives built on @base-ui/react
packages/env     @t3-oss/env-core validated env (`/server` and `/web` entries)
packages/config  shared tsconfig.base.json
```

**New accounts start with a default set of categories.** `DEFAULT_CATEGORIES` in
`packages/schemas/src/category/default-categories.ts` is the one list (8 income, 20 expense),
and better-auth's `databaseHooks.user.create.after` inserts it via `ensureDefaultCategories`
(`packages/db/src/defaults/categories.ts`). Not a migration and not a seed script: categories
are per-user rows, so a migration could only ever cover accounts that already exist. The insert
is idempotent — `missingDefaultCategories` matches on trimmed, case-insensitive `(name, type)`
and treats archived rows as existing, so re-running never duplicates or resurrects anything —
and a failure is logged rather than thrown, because a missing convenience category must not
fail a sign-up whose `user` row is already committed. Accounts created before this hook keep
whatever they have; nothing backfills them.

Workspace packages export raw TypeScript from `src/` (no build step) — only `apps/server` bundles, via tsdown with `noExternal: [/@budget-manager\/.*/]`. Shared dependency versions live in the root `package.json` `workspaces.catalog`; declare them as `"catalog:"` in each package.

### Backend layering (packages/api)

`packages/api/src/index.ts` builds the tRPC instance and exports `publicProcedure` / `protectedProcedure`. Two middlewares matter:

- `requireSession` narrows `ctx.session` to non-null for `protectedProcedure`.
- `mapDomainErrors` translates the domain errors in `errors.ts` (`NotFoundError` → `NOT_FOUND`, `ConflictError` → `CONFLICT`). Services throw those; they never build `TRPCError`s. Unmapped errors become `INTERNAL_SERVER_ERROR` and the formatter replaces the message with a generic string, so internals never leak.

A feature is a directory under `src/modules/<feature>/` with `routes.ts` (thin — reads `ctx.session.user.id`, delegates), `service.ts` (rules, throws domain errors), `repository.ts` (Drizzle queries), `validators.ts` (tRPC inputs composed from `@budget-manager/schemas`), and a barrel `index.ts`. Services are instantiated once in `containers.ts` and reach handlers as `ctx.services` via `context.ts` — repositories take `Db` in their constructor, so nothing imports `db` directly.

Every repository method takes `userId` and filters on it (`and(eq(t.id, id), eq(t.userId, userId))`); a missing row returns `null` and the service turns that into `NotFoundError`. Repositories select through an explicit `*_PUBLIC_COLUMNS` map rather than `select()`, keeping internal columns (e.g. `currentBalanceCents`, `archivedAt`) out of API responses. Register new routers in `src/routers/index.ts`; `AppRouter` is what the web app types itself against.

Deletion is guarded, not cascading: `WalletService.delete` counts referencing rows via `countReferences` and throws `ConflictError` telling the user to archive instead. Archive/unarchive are soft-delete flags on the row.

The `transaction` module owns `transaction_occurrences`, and only the four wallet-facing
kinds — reads are pinned to `inArray(kind, LISTED_KINDS)` so credit-card rows can never
leak in. A transfer is **two rows** (`transfer_out` + `transfer_in`) sharing a
`transfer_group_id`, so it has its own create/update/delete routes; the service keeps the
pair consistent and makes the single-row paths transfer-aware — `update` refuses a leg
(edit the transfer instead), while `markPaid` and `delete` fan out to the whole group.
`TransactionKind` holds all four kinds and `TRANSACTION_FORM_KINDS` is the income/expense
subset the simple form accepts, which is what stops a transfer leg being edited into an
expense. Drizzle returns raw pg-enum strings, so `toDomainRow` casts `kind`/`status` to the
domain enums once at the repository boundary rather than scattering casts through services.

**Two list shapes per resource, and they are not interchangeable.** `getAll` is paginated and
returns an envelope — `{ rows, total, limit, offset }`, where `total` counts every match, not
the page — so the UI can render "Showing 21–25 of 25" and disable Next. `options` is
**unpaginated** and returns minimal rows for `<Select>` inputs. Selects must never read from
`getAll`: a page size that hides a wallet or category the user needs to pick is the same
silent-truncation bug pagination exists to fix. `options` also omits archived rows, so they
cannot be assigned to new records. Both use a shared filter builder (`walletFilter`,
`categoryFilter`, `creditCardFilter`, `transactionFilter`) so a page's `total` can never
disagree with its rows — a new list filter belongs in that builder, never in `getAll` alone.
Each takes an exported `XFilters` type that routes and services spread through untouched, so
adding a filter means editing the validator and the builder rather than five signatures.
Mutations must invalidate `options` alongside `getAll` — otherwise a newly created wallet is
missing from the transaction form until a reload.

The `dashboard` module is read-only and composes the others — it owns no rules of its own, and
reuses `computeWalletBalances`, `computeCardBalances` and `computeBillTotals` so it can never
disagree with the wallet, card or statement pages. Per currency it reports liquid money
(`balanceCents`), card debt (`cardOutstandingCents`), credit still available, and
`netWorthCents` = wallets − card debt: without that last figure the dashboard reads as though
money owed on cards does not exist. It also lists unpaid statements (`remainingCents > 0`)
soonest due first, since a settled statement is not something to act on. Its repository holds only plain
`GROUP BY` queries; every rule lives in the unit-tested `summary.ts`, and balances come from
the wallet module's `computeWalletBalances` so the dashboard can never disagree with the
wallet page. Two rules worth knowing: **totals are grouped by currency and never summed
across them** (there are no FX rates, so a single net-worth figure would be fiction), and
transfers are excluded from month income/expense because they only shuffle money between the
user's own wallets. `pending` returns *all* rows awaiting payment including overdue ones,
oldest first — filtering to `date >= today` hid exactly the bills a user most needs to see.

**The month in view is the last point of the trend, not a second query.** `getTrendMovements`
groups once by `(month, currency, kind, status)` over the trailing `TREND_MONTHS` window —
`occurrenceMonth` is a `to_char(...,'YYYY-MM')` grouping key, not a rule — and
`buildCurrencySummaries` reads `incomeCents`/`expenseCents`/`netCents` off the point whose month
is `trendMonths.at(-1)`. A separate month query is what would let the figures at the top of the
dashboard disagree with the last column of its chart. Every month in the window gets a point
even when nothing happened in it, so the chart has no gaps, and `trailingMonths` is unit tested
across the year boundary. Each summary also carries the `wallets` and `cards` behind its totals
(name, balance / limit, outstanding) so the page can break a figure down per account without a
second round trip.

The month bucketing is the one piece of dashboard logic that *is* SQL, so unit tests cannot reach
it: `apps/e2e/src/api/dashboard.test.ts` is what pins it (window boundaries, a row just outside
the window, and the last point matching the month's own figures). Anything else you push into
that query needs a check there, not in `summary.test.ts`.

### The accounting model

Every occurrence belongs to **one** account: a wallet or a card, never both. Which kinds move
what is declared once, in `packages/schemas`, and nothing should re-derive it locally:

| kind | wallet balance | card outstanding | month totals |
| --- | --- | --- | --- |
| `income` | credit | — | income |
| `expense` | debit | — | expense |
| `transfer_in` / `transfer_out` | credit / debit | — | — (internal move) |
| `credit_card_purchase` | — (no wallet) | increases | **expense** |
| `credit_card_payment` | debit | decreases | — (settles a debt) |

`WALLET_AFFECTING_KINDS`, `CARD_AFFECTING_KINDS`, `MONTH_EXPENSE_KINDS` and
`MONTH_INCOME_KINDS` encode that table. Two rules are load-bearing:

- **A card purchase is the expense; paying the bill is not a second one.** Counting both
  double-reports every card expense in the month totals. `MONTH_EXPENSE_KINDS` includes the
  purchase and excludes the payment for exactly this reason, and there are tests pinning it in
  `summary.test.ts` and `credit-card.test.ts`.
- **`computeWalletBalances` filters on an allowlist, not on "has a wallet."** A purchase carries
  no `walletId` today, but a mis-tagged row must not be able to debit an account.

Because a card-owned row has no wallet, the dashboard joins wallets and cards with `leftJoin`
and resolves the owner with `ownerCurrency` (a coalesce) and `ownerNotArchived`. An
`innerJoin(wallets)` there silently dropped every card purchase from month spending.

Card outstanding and available limit are **derived**, exactly like wallet balances:
`computeCardBalances` (unit tested) over a plain `GROUP BY`. `available = limit - outstanding`
and is allowed to go negative rather than clamp, so overspending is visible.

### Statements (bills)

`cycleFor` in `modules/credit-card/cycle.ts` decides which statement a purchase lands on: a
statement closes on `closeDay`, anything bought after that lands on the next one, a purchase
made *on* the closing day still makes that statement, and the period runs from the day after
the previous close. The due date is in the close's own month when `dueDay > closeDay` and the
following month otherwise (including when they are equal). Cycle days are capped at **1–28**
(`CYCLE_DAY_MAX`) so no month is ever too short — that cap is what keeps the arithmetic free of
month-length special cases, so don't raise it without handling them.

Bill rows are materialized lazily: the first purchase in a cycle creates the statement via
`ensureBill`, whose `onConflictDoUpdate` on the unique `(card, periodStart, periodEnd)` index
makes it idempotent. Editing a purchase's date or card re-resolves the statement, so a row
never stays filed under the wrong one.

**Nothing about a statement's money or lifecycle is stored.** `status`,
`statement_total_cents`, `paid_cents` and `used_limit_cents` were dropped in migration `0004`:
the totals are summed from the linked occurrences by `computeBillTotals`, and the status comes
from `deriveBillStatus` — `paid` when covered in full, otherwise `awaiting_payment` once
`closeAt` has passed, else `open`. A stored status would need a scheduler to flip `open` →
`awaiting_payment` when a bill closes, and would be wrong until it ran.

A card payment may optionally carry a `creditCardBillId`. Allocating it is what lets a
statement show as paid; leaving it unset still reduces the card's overall balance but no
statement's. `TransactionService` takes `CreditCardService` so cycle logic stays in the card
module rather than leaking into transactions.

**Recurrence is not a separate feature.** Per the design docs, `transaction_occurrences` *is*
the ledger and a template is only provenance — "what generated this row". So there is no
recurring screen: the transaction form carries a `Repeats` select (`repeats-fields.tsx`), and
choosing a schedule routes the same submit to `recurring.create` instead of
`transaction.create`. One-offs and generated rows live in one list, with a `Repeats` column
(`One-off` vs `Monthly` / `6× monthly`) and series actions — edit / pause / delete series —
on any row that carries a `templateId`. Don't reintroduce a separate screen for them.

**Nobody is asked when a series ends.** `endsOn` is not a form field or a tRPC input: an
open-ended series runs for `RECURRENCE_YEARS` (50) and `seriesEndsOn` derives the date from
`startsOn` — clamping a Feb 29 anchor the same way the steps do — which `create`/`update` store
on the rule row. Fifty years is not fifty years of rows: the horizon below is still what gets
materialized, so the stored date is the schedule's limit, not its size. A `fixed` series is the
one shape that carries a bound of its own (`installments`), which is why it is the only one
still showing a count. Rule rows written before this keep whatever end date they were given,
and `setActive` re-schedules against the stored value rather than re-deriving it.

The generator materializes a 12-month horizon (`HORIZON_MONTHS`), or exactly `installments`
dates for a `fixed` series, which is what lets a 12× purchase land as 12 rows past the horizon.
`occurrenceDates` clamps a month-end anchor (31 Jan → 28 Feb → **31** Mar, never drifting
earlier) and is unit tested across leap years and year boundaries. Regeneration is idempotent:
dates that already exist are skipped. Editing, pausing or deleting a series clears only rows
that are **still waiting and dated today or later** — today counts as pending, because an
unpaid row dated today has not happened yet. Settled rows and past rows are history and always
survive; `transaction_occurrences.template_id` is `ON DELETE SET NULL`, so they simply stop
pointing at a series.

Each transaction shape has its **own** editor and its own routes — plain, transfer, card
purchase, card payment. `transaction.update` refuses transfer legs and card rows with a
`ConflictError`, because the plain form cannot carry a card reference or a transfer pair, and
the row actions route each kind to the matching dialog.

**Wallet balances are derived, never stored.** `wallets.current_balance_cents` is dead —
nothing writes it and it is absent from `WALLET_PUBLIC_COLUMNS`. `WalletService.getAll`
instead pairs the wallet rows with `getMovementTotals`, whose query is deliberately a plain
`GROUP BY wallet_id, kind, status` with no `CASE`/`FILTER`: every rule (which kinds credit
vs debit, `paid` → `balanceCents`, `paid + waiting_payment` → `projectedBalanceCents`,
`cancelled` and credit-card kinds excluded) lives in the pure `computeWalletBalances`, which
is unit-tested. Keep it that way — there is no test database, so logic pushed into SQL is
logic nothing verifies. Because balances are derived, transaction mutations must invalidate
the wallet queries too; `useApiMutation`'s `invalidateQueries` accepts an array for this, and
`TRANSACTION_INVALIDATIONS` is the shared list.

### Frontend (apps/web)

Routes are file-based under `src/routes/` (`routeTree.gen.ts` is generated — never edit, it's gitignored and ESLint-ignored). The `_auth` layout route redirects to `/login` in `beforeLoad` using `getCachedSession()` from `src/lib/session.ts`, a 10s TTL + in-flight-dedupe cache around `authClient.getSession()`; call `invalidateSessionCache()` after sign-in/out. Route `loader`s prefetch with `context.queryClient.ensureQueryData(context.trpc.<path>.queryOptions())` — `trpc` and `queryClient` are injected as router context in `main.tsx`.

Feature code lives in `src/modules/<feature>/` split into `pages/`, `components/`, `hooks/`, `queries/`, `mutations/`, `types.ts`. Components never call tRPC directly — they use the module's query/mutation hooks.

Error handling is centralized: `src/utils/trpc.ts` configures a `QueryCache`/`MutationCache` that toasts `getErrorMessage(error)` (see `src/utils/error-message.ts`, which unwraps `zodError` and code-specific copy). Mutations go through `useApiMutation` (`src/hooks/use-api-mutation.ts`), which takes `successMessage` / `errorMessage` / `suppressErrorToast` / `invalidateQueries` — pass `trpc.<path>.queryFilter()` for invalidation. Don't add per-call `onError` toasts.

Paged lists pair `<DataTable>` with `<Pagination>` (`src/components/pagination.tsx`) and hold
their state in `usePagedFilters`, which keeps filters and the page number in **one** piece of
state so changing a filter always resets to page 1. Two `useState` calls would let a caller
forget the reset and strand the user on a page that no longer exists. `PAGE_SIZE` and the
offset math live in `src/lib/pagination.ts`.

**The dashboard reads top-down: figures, then charts, then the lists that need acting on.**
`dashboard.page.tsx` owns only the month control and the two global lists (statements, awaiting
payment); everything currency-scoped lives in `CurrencySection`, repeated per currency because
totals are never summed across them. Inside a section the order is fixed — stat tiles (`In
wallets`, `Income`, `Expenses`, `Net` with a sparkline; a second row of card figures when the
user has cards), then `CashFlowChart` beside `SpendingBreakdown`, then the per-account
breakdowns. The month control sits **above everything it scopes**, never inside a card, and a
refetch holds the previous render at reduced opacity instead of flashing skeletons, so changing
month never jumps the page. Spending, wallet and meter bars are plain HTML rather than recharts:
they carry long category names and their own value labels, which an SVG bar would clip.

**A column on a listing table gets a filter for it.** All four list pages follow this: wallets
(name, type, currency), categories (name, type), cards (name, currency, billing wallet) and
transactions (date range, description, account, category, kind, repeats, status). The controls
are ordered to match the columns, and the bar is **left-aligned** — `FilterBar`
(`src/components/filter-bar.tsx`) owns that alignment and the `Clear filters` button, so no
page positions its own. `FilterSelect` and `FilterSearch` are the two control shapes;
`FilterSearch` debounces, because a request per keystroke is not a filter. Each module keeps a
`XFiltersState` + `EMPTY_X_FILTERS` + `isXFiltered` trio in `types.ts` and one
`xQueryInput(filters?, page?)` builder that drops sentinel values — the route loaders call it
with no arguments, so it must always work bare.

**The transaction list is always scoped to a date range.** There is no all-time ledger: rows
accumulate forever, so an unscoped list is both unreadable and unbounded. The transaction module
therefore has no `EMPTY_TRANSACTION_FILTERS` — `defaultTransactionFilters()` builds the unset
state with the **current month** in it, `Clear filters` resets to that rather than to nothing,
and `isTransactionFiltered` compares the range against it so a different month still offers the
clear action. `transactionsQueryInput` sends `dateFrom`/`dateTo` on **every** request and falls
back to the current month if the state somehow carries none, which is what keeps the bare loader
call and the page's first query on the same key. Create dialogs default `occurrenceDate` to
today (`todayAsDateString`), so anything just recorded lands inside the default view. Anything
outside it — a series materialized months ahead, a seeded past row — needs the range widened
first, which is why the e2e suites reach for `pickDateRangePreset` and `dayThisMonth`.

**The bar has no visible labels; each control names its own column.** A `FilterSelect` trigger
reads as the column name (`Category`) while that column is unfiltered and switches to the
chosen row's label (`Uncategorized`) once it is not — `SelectValue` takes a formatter function
for exactly this, and the popup keeps its explicit `All categories` row so resetting one column
stays a visible choice (e2e clicks those by name). `FilterSearch` puts the column in the
placeholder (`Filter by description`). Neither renders a `FieldLabel`, so **both must carry an
`aria-label`** — that is the only thing labelling them, and it is also what
`getByLabel`/`getByLabelText` resolve in the tests. Dropping it silently breaks both
accessibility and every e2e that touches a filter. `FILTER_ALL`
(`packages/schemas/src/filters.ts`) is the shared unset sentinel the four `*_FILTER_ALL`
constants alias; `FilterSelect` compares against it to decide whether to show the column name,
so a module inventing its own string would render a stale label instead.

Three deliberate gaps in that rule. **Money columns have no range filter**: wallet
`balanceCents`, card `outstandingCents` and `availableCents` are derived in TypeScript after
the page is fetched, so filtering them would mean either duplicating the derivation in SQL
(which the balances note forbids) or moving pagination out of the repository; the real columns
(`openingBalanceCents`, `limitCents`, `amountCents`) are left out too, for symmetry. The card
**Cycle** column is a display-only composite of two config fields. And the statements dialog
(`credit-card-bills-dialog.tsx`) and the dashboard lists are outside it — the dialog is scoped
to one card and its most useful filter (`Status`) is derived by `deriveBillStatus`, and the
dashboard exists to show what needs acting on, which filtering would defeat.

Two filters span more than one column's worth of data. The transaction **Account** filter
covers both wallets and cards, because the Account column shows whichever owns the row; wallet
and card ids come from different tables, so the select value is prefixed (`walletAccountValue`
/ `cardAccountValue`) and `parseAccountValue` splits it into `walletId` or `creditCardId`
rather than leaving the server to guess. `FILTER_NONE` (`packages/schemas/src/filters.ts`) is
the shared sentinel for an empty column — `Uncategorized`, `No billing wallet` — which the
repositories turn into `IS NULL`. Search terms go through `containsPattern`
(`packages/api/src/search.ts`), which escapes `%` and `_` so a term containing them is matched
literally; every new search filter must use it rather than interpolating a pattern.

Forms use TanStack Form with the shared Zod schema as the **single** `onDynamic` validator
under `revalidateLogic({ mode: "change", modeAfterSubmission: "change" })`
(`use-wallet-form.ts` is the pattern); the same schema is the tRPC input validator, so client
and server validation cannot diverge.

**Never split the schema across `onChange`/`onBlur`.** TanStack keys errors by cause and only
the same cause clears them, so a blur-sourced error survives every later change. Base UI's
Select never fires blur, so picking a value could not clear the error it had just fixed —
`canSubmit` stayed false, and `form.handleSubmit()` silently returns on the first attempt when
`canSubmit` is false, which made the transfer dialog need two clicks to submit. One cause,
revalidated on change, is what keeps `canSubmit` honest. See
`use-transfer-form.test.tsx` for the regression test.

Because validation is eager, error *display* is gated on the field being touched:
`const showErrors = field.state.meta.isTouched && !field.state.meta.isValid`, and
`<FieldError errors={showErrors ? field.state.meta.errors : []} />`. Submitting marks every
field touched, so a failed submit reveals everything. Submit buttons disable on
`isSubmitting` only — never on `!canSubmit`, which hides *why* a form won't go through.

Import aliases: `@/*` → `apps/web/src/*`, `@budget-manager/ui/components/<name>` for primitives.

### Money

Amounts are integer **minor units** everywhere — DB column, tRPC payload, form state, React state (`openingBalanceCents`, `int4`, hence the `MONEY_MIN/MAX_MINOR_UNITS` bounds in `MoneyMinorUnitsSchema`). Never introduce floats. `packages/money` owns `minorUnitDigits` (zero- and three-decimal currencies), `formatMinorUnits`, `formatCompactMinorUnits`, and `parseMinorUnits`; `packages/ui/src/lib/currency.ts` just re-exports them. `CurrencyInput` reads/writes minor units directly.

`formatCompactMinorUnits` is for **axis ticks only**, where the full figure would collide with
its neighbours. It keeps anything under one thousand exact — a rounded tick the user cannot find
in the list below it is worse than a long one — and compacts the locale's own way (`R$ 12,3 mil`,
`¥1.2万`), so tests must compare on `\s`-flattened text: Intl separates with U+00A0.

### UI

Primitives in `packages/ui/src/components` are shadcn (`style: base-lyra`, `iconLibrary: remixicon`) on top of **@base-ui/react**, not Radix. Base UI composes via the `render` prop, not `asChild`: `<DialogTrigger render={<Button>Create</Button>} />`. Design tokens live in `packages/ui/src/styles/globals.css` (Tailwind v4, CSS-first).

Add shared primitives from the root: `npx shadcn@latest add <name> -c packages/ui`. Run the shadcn CLI from `apps/web` only for app-specific blocks.

**Charts are recharts behind the shadcn `chart.tsx` wrapper, and colour is a token, never a
literal.** `ChartContainer` publishes each config key as a `--color-<key>` variable under both
themes, so a series reads `fill="var(--color-income)"` while the palette itself lives in
`globals.css`. `--chart-1…8` are a validated eight-hue categorical set (blue, orange, aqua,
yellow, magenta, green, violet, red) with **light and dark steps of the same hue** — the slot
*order* is what keeps adjacent pairs colourblind-separable, so add a hue at the end rather than
re-ordering, and never generate a ninth. `--chart-income` (green) and `--chart-expense` (red)
alias slots 6 and 8: that pair sits in the colourblind-safety warn band, which is why the bars
are also positionally fixed (income always left) and legended. `--chart-track` is the meter
track, `--success`/`--warning` are status inks. The steps are not taste: they were run through a
colourblind-separation and contrast check against this app's own surfaces — light `#ffffff`
(`--card`) and dark `#171717`, **not** the page plane — and three light-mode hues (aqua, yellow,
magenta) sit below 3:1 there, so anything using them owes the reader a visible label or the table
view. Re-run that check before changing a step or a surface; a hue that "looks different enough"
routinely is not under deuteranopia.

`recharts` is declared in the root `workspaces.catalog` and pulled in as `"catalog:"` by both
`packages/ui` (for `chart.tsx`) and `apps/web` (for the chart compositions — the app imports
`recharts` directly, so it has to own the dependency, not borrow the UI package's). It is the
heaviest thing in the app by far: it lands in the lazily-loaded `dashboard` route chunk
(~114 kB gzip), which is the only reason it is affordable. Keep chart composition inside route
modules that are already lazy — importing recharts from a shared component would drag it into
the entry chunk for every page.

Five rules the dashboard follows and new charts should too: one series → **one** colour (never a
value-ramp on nominal categories); a legend whenever there are two or more series; hairline
**solid** grid lines (`stroke="var(--border)"`, never dashed) and no y-axis line; values as
**minor units** with `tickFormatter`/tooltip `formatter` doing the money formatting; and every
chart carries a table twin (`ChartDataTable`, `sr-only`) so no number is reachable only by
hovering. Stat-tile figures wear ink, not a series colour — only a negative amount takes
`text-destructive`, and a small swatch next to the label is what ties `Income`/`Expenses` to
their bars. `<Card>` inside a chart grid needs **`min-w-0`**: `ResponsiveContainer` starts at a
fixed width, and a `1fr` column with `min-width: auto` would size to it and push the page into a
horizontal scroll.

For a **navigation** target that should look like a button, use
`<Link className={buttonVariants()}>`, not `<Button render={<Link/>} />`. Base UI's Button
defaults `nativeButton` to `true` and logs a warning when handed a non-`<button>`; setting
`nativeButton={false}` silences it but stamps `role="button"` on the anchor, which is the
wrong semantics for something that navigates.

**Dates are picked with `DatePicker`, never `<Input type="date">`.** shadcn ships the date
picker as a recipe rather than a file, so `packages/ui/src/components/date-picker.tsx` is that
composition (Popover + Calendar, react-day-picker under the hood) with the app's contract
bolted on: it reads and writes `yyyy-MM-dd` **strings**, which is what every schema, form and
tRPC input already carries, and `clearable` is how an optional field gets back to empty (no
form uses it today — `date-picker.test.tsx` is what keeps it honest). Parse with date-fns
`parseISO`, never `new Date(value)` — the latter reads a date-only
string as UTC midnight, so west-of-UTC users see the previous day; `date-picker.test.tsx` pins
that. The trigger is a `<button>` carrying the field's `id`, so `FieldLabel htmlFor` and
Playwright's `getByLabel` both still resolve, and its popup has `role="dialog"` — a
`getByRole("dialog")` in e2e will match two elements while a picker is open. Both pickers carry
month and year dropdowns (`captionLayout="dropdown"`); `captionMonthRange` widens them to ±10
years, because react-day-picker's default stops at the end of the current year and would put
every future-dated row out of reach.

**A start-and-end pair is one `DateRangePicker`, not two `DatePicker`s.** It lives in the same
file and takes `{ from, to }` as the same ISO strings, with the presets (`This month`,
`Last month`, `Last 3 months`, `This year`, `Next 12 months`) in
`packages/ui/src/lib/date-range.ts` next to `currentMonthRange` — the transaction module reads
that same helper for its default filters, so the picker and the list cannot disagree about what
"this month" means. Two rules are load-bearing: every pick **starts a fresh range** (first click
the start, second the end, ordered if the second lands earlier), and only a *complete* range is
handed to `onValueChange`, so a caller that requires a range is never left holding half of one —
which is what lets the transaction filters treat it as mandatory. `date-range-picker.test.tsx`
pins both, plus the preset arithmetic across a leap February.

## Conventions

- `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, and `noUnusedLocals` are on; `@typescript-eslint/consistent-type-imports` and `no-floating-promises` are errors — use `import type` and `void` fire-and-forget promises.
- ESLint runs `recommendedTypeChecked`; new type-unsafe spots should be fixed rather than added to the per-file overrides at the bottom of `eslint.config.js`.
- Zod v4 (`z.uuid()`, `z.flattenError`, `.prefault()`).
- No explanatory code comments — the code is expected to read on its own; explain reasoning in the PR or chat instead.

## Deployment

Vercel Services (`vercel.json`): `web` (Vite SPA, built with `VITE_SERVER_URL=/api`) and `server` (Hono). `/api/*` rewrites to the server service and the path prefix is stripped — **except** `/api/auth/*`, which is preserved so better-auth's route matching and generated callback URLs use one public base. `packages/env/src/server.ts` derives `BETTER_AUTH_URL`/`CORS_ORIGIN` from Vercel env vars when unset; both `trpc.ts` and `auth-client.ts` resolve the relative `/api` back to an absolute origin at runtime.

Env vars are not uploaded with a deploy: `bun run deploy:setup` (vercel link), then `bun run env:preview` / `bun run env:production` before the first deploy. `bun run deploy` (preview), `bun run deploy:prod`, `bun run deploy:check` (dry run).
