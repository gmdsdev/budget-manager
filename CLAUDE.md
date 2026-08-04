# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Bun + Turborepo monorepo. Run everything from the repo root unless noted.

```bash
bun install
bun run dev                # web :3001 + server :3000 — deliberately not the native app
bun run dev:web            # web only
bun run dev:server         # server only
bun run dev:native         # Expo dev server (Metro); needs the server running too
bun run native:ios         # Expo + iOS simulator
bun run native:android     # Expo + Android emulator
bun run check-types        # tsc across every workspace
bun run lint               # single flat ESLint config at the root
bun run lint:fix
bun run test               # turbo test (apps/web + packages/api + packages/client + packages/i18n + packages/money + packages/schemas)
bun run build
```

`dev` stays web + server: Metro owns a terminal and a port of its own, and starting it inside
turbo's TUI alongside two other watchers is not what anyone wants from `bun run dev`. Run
`dev:native` in a second terminal.

### Single test

Tests are `bun:test`. Turbo wires `test` in `apps/web`, `packages/api`, `packages/client`, `packages/i18n`, `packages/money` and `packages/schemas`; run a single file from inside that workspace so `bunfig.toml` preloads happy-dom:

```bash
cd apps/web && bun test src/modules/wallet/components/currency-input.test.tsx
cd apps/web && bun test -t "reads typed digits"    # filter by test name
cd packages/api && bun test
cd packages/client && bun test
cd packages/i18n && bun test
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
bun run test:e2e          # 294 checks: API + browser
bun run test:e2e:api      # server only, ~2s
bun run test:e2e:ui       # Playwright flows
```

The API suite drives a real `createTRPCClient<AppRouter>`, so a renamed procedure or changed
input is a *compile* error in the tests, not a runtime surprise. Each test file signs up its
own user, so suites are order-independent and safe against a dev database with existing rows;
nothing is truncated. `requireServer()`/`requireWeb()` fail with "start it with…" instead of
letting every test time out. Chromium needs `bunx playwright install chromium` once.

Four hard-won details in `src/support/web.ts`:

- **A browser assertion about "today" anchors on the browser's clock**, via `todayInPage` /
  `todayIsoInPage`. `bun test` pins the test process to UTC while Chromium keeps the machine's
  own zone, so for the hours those two straddle a date boundary a row seeded from the test's
  clock lands on a different day than the page is showing — and on the last day of a month it
  lands in the *next* month, which empties the transaction list (always scoped to the browser's
  current month) and zeroes the dashboard. That is the same disagreement `shiftMonthKey` exists
  to dodge on the API side; here the consumer is the browser, so pass the result into
  `dayThisMonth`/`dayLastMonth` rather than letting them read `new Date()`. A suite that seeds
  "today" without it passes for twenty-one hours a day and fails for three.
- Assert on row *counts* via `waitForRowCount` rather than sleeping. Its selector is
  `[data-list-table] [data-list-row]`, and those two markers are what keep the helpers
  independent of the markup: `data-list-table` marks the listing whether it draws as a
  `DataTable`'s `<table>`, that table's card fallback, or the transaction ledger's row list, so a
  second table on the page (the transaction totals) can never inflate a count, and a
  `data-group-header` carries no row marker so a date heading is not a row.
- Read text through `rowTexts`/`bodyText`, which flatten the non-breaking spaces `Intl` money
  formatting emits (a plain `"R$ 300,00"` never matches raw `innerText`). `rowTexts` reads
  `[data-list-cell]`, not `<td>`, for the same reason — and the first cell is always the
  record's name, which the `cells[0]` assertions rely on.
- **The transaction list has no per-row menu**, so reach for `openTransaction(page, name)` and
  then act on the buttons inside the detail dialog. `openFromDetail` covers the actions that open
  a *second* dialog: the detail view closes as the next one opens, so waiting on `dialog(page)`
  alone can match either — it waits on the new dialog's heading instead.
- **One shared Chromium, a fresh context per suite** (`openApp`/`closeApp`). Launching a browser
  per suite file starved the machine badly enough that `page.goto` timed out at 60s; contexts
  give the same cookie isolation for a fraction of the cost. Teardown hooks also need an
  explicit timeout — bun's 5s default is not always enough to close a context, and a timed-out
  teardown leaks it into the next suite.

`src/ui/i18n.test.ts` is the language suite: it switches to Portuguese in the settings
form and then asserts the nav, a listing, an empty state and a shared Zod message against
the **catalog** rather than against copy pasted into the test, so a reworded translation
does not break it but a screen that stops reading from the catalog does. It folds case on
both sides — copy is sentence case now, but the eyebrow labels are still uppercased in CSS and
`innerText` reports that, so folding is what keeps the suite indifferent to which is which.

`apps/web/test-setup.ts` registers a global `afterEach(cleanup)`. Don't rely on
`@testing-library/react`'s built-in auto-cleanup: it registers its hook at import
time, which Bun scopes to whichever test file imports RTL *first*, so cleanup
silently becomes filename-order-dependent and unrelated suites start failing on
leftover DOM.

### Demo data

`apps/demo-seed` signs up a throwaway account and fills it with a year of history plus a year of
scheduled rows, against a live stack:

```bash
bun run db:start && bun run dev          # prerequisites
bun run seed:demo                        # prints the email, password and a summary
bun run seed:demo --seed 7               # same seed, same account
bun run seed:demo --past-months 3 --future-months 1
```

Like `apps/e2e`, it drives a real `createTRPCClient<AppRouter>` and **never writes SQL**: wallets,
cards, categories, series, transfers, purchases, budgets and bill payments all go through the same
routes the UI calls, so a renamed procedure breaks its `check-types` instead of quietly seeding garbage.
It declares no `test` script, so `turbo run test` stays hermetic.

Four things the ordering encodes, all of them consequences of rules documented further down:

- **Series first, bills last.** `recurring.create` materializes history *and* the next 12 months in
  one call, and a statement's total is summed from the purchases linked to it — so paying a bill
  before every purchase exists would settle the wrong figure.
- **Generated occurrences are always written as `waiting_payment`, even in the past**, so the script
  sweeps `transaction.getAll` for past pending rows and `markPaid`s them the way a user would. The
  deliberately overdue rows are written *after* that sweep, or it would settle them too.
- Statuses are never hand-picked: `calendar.statusFor(date)` settles anything already dated and
  leaves the rest waiting, which is what keeps the account readable on any day it is seeded.
- **Budgets are anchored at the oldest month of history**, so every seeded month already has a
  limit to read against rather than only the months ahead, and the limits in `BUDGETS` are tuned
  to leave a mix of green and over-budget meters — a demo where nothing is over budget shows none
  of what the screen is for. One is quarterly, so the account also has a budget that skips months.
- The catalog in `src/catalog.ts` is **balanced around `SALARY_MAJOR`**: monthly spending plus the
  transfers out of the checking wallet have to leave a small surplus, and the cash wallet needs its
  own transfer because the weekly market series is the only thing spending from it. Balances are
  derived, so the run prints every wallet and card — a change that pushes the account into the red
  shows up there.

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
apps/native      Expo + React Native + expo-router, the same app on a phone
apps/e2e         Live-stack end-to-end tests (API + Playwright), outside `turbo test`
packages/api     tRPC routers + business logic (routes → service → repository)
                 modules: wallet, category, transaction, credit-card, budget, dashboard
packages/db      Drizzle schema, migrations, the `db` singleton
packages/auth    better-auth instance (drizzle adapter)
packages/schemas Zod schemas + enums shared by client and server
packages/client  Platform-agnostic client layer both apps read (rows, filters, query inputs)
packages/i18n    Message catalogs, `translate`, locale-aware date formatting (no deps but React, on a subpath)
packages/money   Minor-unit math and currency formatting (no deps)
packages/ui      shadcn primitives built on @base-ui/react (web only)
packages/env     @t3-oss/env-core validated env (`/server`, `/web` and `/native` entries)
packages/config  shared tsconfig.base.json
```

**Two apps, one client layer.** `packages/client` is everything a screen needs that is not a
screen. Three entries, and the split between them is the point:

- **`.`** — no DOM, no renderer, no network: row shapes, the `XFiltersState` trio per module, the
  query-input builders that drop the filter sentinels, pagination and `yyyy-MM` arithmetic, the
  date-range presets, the repeats labels, and `getErrorMessage`/`runAuthAction`. This is the entry
  a test with no renderer can import.
- **`./runtime`** — `createClientRuntime`, which builds the `QueryClient` (retry rule, cache error
  toasts) and the tRPC client and options proxy, and holds them module-scoped. Each app calls it
  **once**, before rendering, passing the four things only it can answer: where the API is, how the
  session cookie travels, what a toast looks like, and its better-auth client's `updateUser` /
  `changePassword` / `useSession`.
- **`./react`** — every query and mutation hook, every form hook, `useEnumLabels`,
  `usePagedFilters`, `usePreferredCurrency` and `useApiMutation`. They reach the proxy through
  `api()`, which is why they need no `trpc` argument threaded through a dozen signatures.

The rules this exists to enforce, all of which were previously a copy per app:

- **A filter that exists on the web and not on the phone is a bug in a screen**, not a difference
  in what the two clients know how to ask for.
- **Invalidation follows the join** — and the lists that encode which joins a mutation moves are
  written once. Two copies are two chances for a rename to linger in one screen.
- **One validation cause, revalidated on change**, because `FORM_VALIDATION_LOGIC` and every
  `useXForm` are shared; a form cannot invent its own logic on one platform.

What stays per app: the tRPC/auth *configuration*, the toast rendering, the session cache (web
only), and everything that draws.

**New accounts start with a default set of categories.** `DEFAULT_CATEGORIES` in
`packages/schemas/src/category/default-categories.ts` is the one list (8 income, 20 expense,
each with a palette colour so a fresh account's charts are already colour-coded),
and better-auth's `databaseHooks.user.create.after` inserts it via `ensureDefaultCategories`
(`packages/db/src/defaults/categories.ts`). Not a migration and not a seed script: categories
are per-user rows, so a migration could only ever cover accounts that already exist. The insert
is idempotent — `missingDefaultCategories` matches on trimmed, case-insensitive `(name, type)`
and treats archived rows as existing, so re-running never duplicates or resurrects anything —
and a failure is logged rather than thrown, because a missing convenience category must not
fail a sign-up whose `user` row is already committed. Accounts created before this hook keep
whatever they have; nothing backfills them.

Migration `0006` is the exception that proves the rule: adding `categories.color` had to give
existing rows something, and `DEFAULT 'blue'` alone would have left a user with twenty
indistinguishable bars. It ships a hand-added `UPDATE` that deals the palette out by
`row_number() OVER (PARTITION BY user_id, type ORDER BY name, id)`, so every account already had
a spread of hues the first time it loaded. A generated migration is fine to extend this way —
the snapshot only tracks DDL, so `db:generate` still reports no changes afterwards.

**User settings are better-auth's, not a tRPC module.** `/settings/user` edits the name through
`authClient.updateUser` and the password through `authClient.changePassword` — there is no
`user` router, service or repository, because better-auth already owns password verification,
session revocation and the `user` row. `preferredCurrency` rides along as the one
`user.additionalFields` entry, declared **once** in `USER_ADDITIONAL_FIELDS`
(`packages/schemas/src/user/user.schema.ts`) and spread into both the server instance and the
client's `inferAdditionalFields`, so the field's name, optionality and default cannot drift
between the two. Its `validator.input` is the same Zod enum the form uses, so an unsupported
code is rejected server-side. Read it through `usePreferredCurrency`, never off the session
directly: `toPreferredCurrency` falls back to `DEFAULT_PREFERRED_CURRENCY` for a stored code
that is no longer in `WalletCurrency`, which is what keeps a dropped currency from reaching a
`<Select>` as a value with no matching item. It is a *default*, not a scope — the create
dialogs preselect it and the dashboard opens on it, but both still fall back (the dashboard to
the first currency the API returned), so it can never hide data. Because those dialogs read it
from the session, they `form.reset()` on **open** as well as close.

That is the general rule, not a currency one: **a create dialog whose defaults are read from
outside the form resets on open as well as close**, because anything read from outside can move
while the dialog is shut. Every transaction create dialog defaults `occurrenceDate` to
`todayAsDateString()`, so a tab left open across midnight offered yesterday until they did the
same — and the plain one preselects the first wallet, which a wallet created in the meantime
should win.

**All four create dialogs default `status` to `paid`.** Recording something is nearly always
recording something that already happened, so `waiting_payment` is what a reader opts *into* for
a bill still ahead of them. Generated occurrences are the deliberate exception and are still
written as `waiting_payment` even in the past (see the demo-seed notes above), because a series
lays down rows nobody has confirmed yet.

Every mutation on that screen goes through `runAuthAction` (`@budget-manager/client`),
which turns better-auth's `{ data, error }` into a thrown `AuthActionError` so the shared
`MutationCache` toast fires; `getErrorMessage` special-cases it to surface the library's own
copy (`Invalid password`) instead of the generic string. Anything calling better-auth from a
mutation must go through it rather than reading `error` inline. The colour scheme is the one
setting that is **not** server state — it stays in next-themes' `kivo-theme` localStorage, so
the mode in state is the mode on screen and the logo artwork ternary has nothing to guess.

Workspace packages export raw TypeScript from `src/` (no build step) — only `apps/server` bundles, via tsdown with `noExternal: [/@budget-manager\/.*/]`. Shared dependency versions live in the root `package.json` `workspaces.catalog`; declare them as `"catalog:"` in each package.

### Backend layering (packages/api)

`packages/api/src/index.ts` builds the tRPC instance and exports `publicProcedure` / `protectedProcedure`. Two middlewares matter:

- `requireSession` narrows `ctx.session` to non-null for `protectedProcedure`.
- `mapDomainErrors` translates the domain errors in `errors.ts` (`NotFoundError` → `NOT_FOUND`, `ConflictError` → `CONFLICT`). Services throw those; they never build `TRPCError`s. Unmapped errors become `INTERNAL_SERVER_ERROR` and the formatter replaces the message with a generic string, so internals never leak.

A feature is a directory under `src/modules/<feature>/` with `routes.ts` (thin — reads `ctx.session.user.id`, delegates), `service.ts` (rules, throws domain errors), `repository.ts` (Drizzle queries), `validators.ts` (tRPC inputs composed from `@budget-manager/schemas`), and a barrel `index.ts`. Services are instantiated once in `containers.ts` and reach handlers as `ctx.services` via `context.ts` — repositories take `Db` in their constructor, so nothing imports `db` directly.

Every repository method takes `userId` and filters on it (`and(eq(t.id, id), eq(t.userId, userId))`); a missing row returns `null` and the service turns that into `NotFoundError`. Repositories select through an explicit `*_PUBLIC_COLUMNS` map rather than `select()`, keeping internal columns (e.g. `currentBalanceCents`, `archivedAt`) out of API responses. Register new routers in `src/routers/index.ts`; `AppRouter` is what the web app types itself against.

Deletion is guarded, not cascading: `WalletService.delete` counts referencing rows via `countReferences` and throws `ConflictError` telling the user to archive instead. Archive/unarchive are soft-delete flags on the row.

**`countReferences` has to name every table with an FK to the row, including the cascading
ones.** `budgets.category_id` and `budget_periods.category_id` are `ON DELETE CASCADE`, so
while the category count left them out, deleting a category nothing else referenced quietly
took its budget and every month that budget had already laid down — including months already
lived through, which the `ON DELETE SET NULL` on `budget_id` exists to preserve. A cascade the
guard cannot see is the one that does the damage.

**Three fields are settled at creation and held from the first row that references them:** a
category's `type`, a wallet's `currencyCode` and a card's `currencyCode`. Every other rule
reads the entity through them — a transaction may only carry a category of its own type, only
an expense category may carry a budget, both legs of a transfer share a currency, and a card
payment's wallet has to match the card — so flipping one under existing rows leaves them in a
state the create paths refuse to produce, and silently reprices history besides. Each `update`
compares against the stored row and throws a `ConflictError` naming the reference count when it
changed, reusing the same `countReferences` the delete guard does. Everything else on those
rows (name, type, limit, opening balance, cycle days, colour) stays editable.

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

**Invalidation follows the join, not the module.** A list row carries names and colours joined
from other tables — the ledger names the wallet or card a row sits in and paints its category,
the card list names its billing wallet, the budget list paints its category — and every one of
those is a figure some *other* module's mutation moves. So each module's `X_INVALIDATIONS`
covers what its rows are read through, not just its own queries: category and wallet mutations
reach the transaction list, wallet mutations reach the card list, card mutations reach the
transaction list and its totals, and transaction and series mutations reach `budget.getMonth` /
`budget.periods`, since a budget is a reading of spending and a row is exactly what moves it.
The dashboard is on all of them. The rule of thumb: if a query's payload would come back
different, it belongs in the list — a rename that lingers in one screen reads as a lost edit.

**The transaction list has a third shape, `summary`, and it is not a page of anything.** It takes
the *same* filters as `getAll` minus `limit`/`offset` — both are built from one
`TRANSACTION_FILTER_FIELDS` object, so a filter cannot exist on the list and not on its totals —
and returns one row per currency: settled and projected wallet balances, income, expenses and
net. Dropping pagination is the point: the figures describe every matching row, so paging must
neither change them nor refetch them. Three plain `GROUP BY` queries feed the unit-tested
`buildTransactionSummary`, which reuses `computeWalletBalances` so the totals can never disagree
with the wallet page, and `periodRole` (`packages/schemas`) so income/expense means exactly what
the dashboard means by it — transfers and card payments count as neither, a card purchase is the
expense. Two scopes deliberately meet in that payload, which is what the caption on screen
states: **balances cover every active wallet up to `dateTo`** (an opening balance cannot be scoped
to a category or a search term without becoming nonsense), while income and expenses cover
exactly the rows the filters matched. `getWalletMovementTotals` takes that `dateTo` so a balance
reads "as of the end of the range in view" rather than always meaning today.

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
`transaction.create`. One-offs and generated rows live in one list, which states a row's
repeats (`One-off` vs `Monthly` / `6× monthly`) on its meta line and offers series actions —
edit / pause / delete series — in the detail dialog of any row that carries a `templateId`.
Don't reintroduce a separate screen for them.

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
`TransactionDetailDialog` routes each kind to the matching dialog.

**Recording something is one primary action, not four peers.** `CreateTransactionMenu` is a split
button — `Create Transaction` on the left half, and a caret opening card purchase / pay card /
transfer. Nearly every visit is an ordinary income or expense, and four equal-weight CTAs made
that common case as hard to find as the rare ones (and took a 2×2 grid of a phone's first
screen). The four create dialogs are **controlled from that component and stay mounted**, which
is what keeps their reset-on-open behaviour — the date defaults to today and the wallet to the
first one, both read from outside the form. In e2e, `openCreateDialog(page, item)` goes through
the caret; only `Create Transaction` is still a button of its own.

**The ledger has no row menu: the row opens the record, and every action lives inside it.**
`TransactionDetailDialog` (`modules/transaction/components/`) is what a row click opens — the
transaction in full, then Mark as paid / the kind's own editor / the series actions / Delete, as
buttons. A dropdown in a list of hundreds of rows puts an irreversible action one mis-tap from a
reversible one, which is exactly how `Delete series` used to sit directly under `Pause series`.

Two things about it are load-bearing:

- **A nested dialog replaces the detail view rather than stacking on it** (two modals deep,
  Escape becomes ambiguous and the scrim doubles up), so the detail view's own `open` is
  *derived* from `dialog === null`. It must not be a prop the page drives: the page dropping
  `selected` unmounts the component that holds the nested dialog it just opened, and the edit
  form never appears.
- **Every destructive action is still confirmed through an `AlertDialog`, series included.**
  Pause/resume stays unconfirmed on purpose — it is reversible from the same place.

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

### Budgets

A budget is a **spending limit on one category, in one currency, for one month**, and it is
built the way recurring transactions are: `budgets` is the template (the recurring limit) and
`budget_periods` is the ledger of months it laid down. `budget_id` on a period is provenance
only and is `ON DELETE SET NULL`, so a month already lived through survives its series being
deleted — exactly like a settled occurrence does.

**A budget period is a calendar month, so the schedule only speaks in months.**
`BUDGET_RECURRENCE_TYPES` is the `fixed | monthly | yearly` subset of `RecurrenceType`:
`weekly` is deliberately excluded, because a weekly limit cannot be laid over months without
either splitting a week across two of them or inventing a period the spending query cannot
group by. `budgetMonths` is the `occurrenceDates` twin — a `fixed` budget produces exactly
`installments` months and ignores the horizon, everything else runs to `endsOn` or the
12-month `HORIZON_MONTHS`, whichever comes first — and it steps in month keys, so there is no
day-of-month clamping to get wrong. Nobody is asked when a budget ends: `budgetEndsOn` derives
it from the start, same `RECURRENCE_YEARS` bargain.

**`is_override` is the whole editing model.** A month is either *inherited* (the series wrote
it) or *the user's own* (they set that month by hand). Editing, pausing or deleting a series
re-lays only inherited months dated **this month or later** — the month in progress counts as
still ahead, since a budget you are living through is the one an edit usually means to change.
Past months and overridden months always survive. That is what makes the two things the
feature asks for one mechanism: "a new limit for all future months" is an edit to the series,
and "a different limit on a specific month" is an override. `insertPeriods` resolves the
unique `(user, category, currency, month)` index with `onConflictDoUpdate ... setWhere
is_override = false`, so a new series adopts an orphaned month but can never overwrite a
deliberate one.

**One budget per category per currency**, enforced in the service with a `ConflictError` that
tells the user to edit the existing one. Only expense categories may carry a limit, and an
archived category can only stay on a budget it already had.

**Spending is matched on both the category and the currency**, because two wallets in two
currencies charging the same category are two different budgets and there are no FX rates to
reconcile them with. The query is a plain `GROUP BY (currency, category, status)` over
`MONTH_EXPENSE_KINDS` with the dashboard's own `ownerCurrency`/`ownerNotArchived` joins — so a
card purchase spends its category's budget and a mis-tagged row cannot — and every rule lives
in the unit-tested `progress.ts`. Two figures come out of it: `spentCents` (settled) and
`projectedSpentCents` (settled **plus** still-scheduled). **`remainingCents` is measured
against the projected figure**, which is what keeps a budget from disagreeing with the
dashboard's Expenses tile — that tile counts everything not cancelled. It is allowed to go
negative rather than clamp, so overspending is visible. `deriveBudgetStatus` is derived like a
statement's status, never stored.

The dashboard composes this rather than re-deriving it: its repository adds one
`listBudgetPeriods` query and its summary calls the budget module's own `buildBudgetProgress`
with the `categoryMovements` the spending breakdown already fetched, so the widget and the
budget page cannot report different spending. `CurrencySummary` carries `budgets` and
`budgetTotals`, per currency, never summed across them.

On the page, the month card leads and the list of limits follows — the card answers "is there
money left", the list is what set it. Both the month and the currency controls sit above
everything they scope, the same grammar the dashboard uses. The route loader prefetches
`getMonth` with an **explicit** `currentMonth()`, not a bare call: the page asks for that key,
and a bare prefetch would sit under a different one and leave the card loading on every visit.
`BudgetMeter` is shared by the page and the dashboard widget, so one bar renders both.

### Frontend (apps/web)

Routes are file-based under `src/routes/` (`routeTree.gen.ts` is generated — never edit, it's gitignored and ESLint-ignored). The `_auth` layout route redirects to `/login` in `beforeLoad` using `getCachedSession()` from `src/lib/session.ts`, a 10s TTL + in-flight-dedupe cache around `authClient.getSession()`; call `invalidateSessionCache()` after sign-in/out. Route `loader`s prefetch with `context.queryClient.ensureQueryData(context.trpc.<path>.queryOptions())` — `trpc` and `queryClient` are injected as router context in `main.tsx`.

Feature code lives in `src/modules/<feature>/` split into `pages/` and `components/`. There are no
`queries/`, `mutations/`, `hooks/` or `types.ts` directories any more: those are
`@budget-manager/client`, shared with the native app. Components never call tRPC directly — they
use the shared query/mutation hooks, and a route loader reads the shared query-input builder.

**A helper two screens both need lives in `packages/client`, not copied into each** — and
now that a second app reads it, "two screens" usually means two *apps*. `month.ts` is the
`yyyy-MM` key arithmetic the dashboard and the budget screen step through, `date-range.ts`
is what "this month" means to both a picker and a list, and the module files carry the row
shapes and the query inputs. What stays in `apps/web/src/lib/` is what only the web can
answer: `server-url.ts` resolves `VITE_SERVER_URL` for both the tRPC link and better-auth —
two copies of that one could drift into pointing the API and the auth cookie at different
origins, which is exactly the split a session does not survive. Tests for a `packages/ui`
primitive, or for a shared hook that needs a renderer, live in `apps/web/src/` beside the
other component tests, since `apps/web`'s `bunfig.toml` is what preloads happy-dom.

Error handling is centralized, and shared: `createClientRuntime` configures the
`QueryCache`/`MutationCache` that toast `getErrorMessage(error)` (which unwraps `zodError` and
code-specific copy), and `src/utils/trpc.ts` only tells it what a sonner toast looks like.
Mutations go through `useApiMutation` (`@budget-manager/client/react`), which takes
`successMessage` / `errorMessage` / `suppressErrorToast` / `invalidateQueries`. Don't add
per-call `onError` toasts.

Paged lists pair `<DataTable>` (or, on transactions, `<TransactionRows>`) with `<Pagination>`
(`src/components/pagination.tsx`) and hold
their state in `usePagedFilters`, which keeps filters and the page number in **one** piece of
state so changing a filter always resets to page 1. Two `useState` calls would let a caller
forget the reset and strand the user on a page that no longer exists. `PAGE_SIZE`, the offset
math and that hook are all in `@budget-manager/client`.

**`PAGE_SIZE` is 100, which is the server's own `limit` ceiling** — every module's validator caps
it at `max(100)`, so raising it further is a `BAD_REQUEST` rather than a bigger page. `apps/e2e`
reads the constant rather than restating it: a suite about paging has to seed *more* than a page,
and one that hardcoded the old 20 would have quietly stopped having a second page to test.

**Every screen opens with `<PageHeader>`** (`src/components/page-header.tsx`): title, an optional
line of context, and the actions or scoping controls opposite, stacking below `sm`. All seven
pages used to spell that markup out themselves, which was seven chances for one heading to drift
out of step with the rest.

**The dashboard reads top-down: figures, then charts, then the lists that need acting on.**
`dashboard.page.tsx` owns only the two controls and the statements / awaiting-payment lists;
everything else lives in `CurrencySection`. Inside a section the order is fixed — stat tiles (`In
wallets`, `Income`, `Expenses`, `Net` with a sparkline; a second row of card figures when the
user has cards), then `CashFlowChart` beside `SpendingBreakdown`, then the per-account
breakdowns. Both controls sit **above everything they scope**, never inside a card, and a
refetch holds the previous render at reduced opacity instead of flashing skeletons, so changing
month never jumps the page.

**One currency is in view at a time, chosen next to the month.** Totals are never summed across
currencies, but stacking a section per currency read as one long page of near-identical figures,
so the header carries a currency select and the page renders that one `CurrencySection` — and
the two lists below are filtered to it as well, since a control above them scopes them like the
month does. The select only appears once there is a second currency, and the query still returns
every currency in one payload: switching is client-side, so it costs no refetch. The stored code
is a preference, not a source of truth — the page falls back to the first currency the API
returned (they arrive sorted by code), which is what covers the first render and a currency that
stops existing. Spending, wallet and meter bars are plain HTML rather than recharts:
they carry long category names and their own value labels, which an SVG bar would clip.

**The transaction list closes with a totals table, between the rows and the pagination.**
`transaction-summary.tsx` is a plain shadcn `<Table>` rather than a `DataTable`: its rows are the
*figures* (`In wallets`, `Income`, `Expenses`, `Net`) and its columns are `Effective` /
`Projected` per currency, under a two-level header naming each currency. That way the common case
— one currency — is three columns wide and needs no card fallback, and a second currency costs two
columns instead of doubling the rows. Totals are still never summed across currencies. It has its
own query hook keyed on the filters alone (`useTransactionSummaryQuery`), with
`keepPreviousData` so a new filter holds the previous figures at reduced opacity instead of
dropping the table out and shoving the pagination around; the route loader prefetches it beside
the list. Two details are load-bearing: the explanatory note lives in a `<p>` *outside* the
`<Table>`, because with two currencies the table scrolls sideways in its own container and would
carry the note off-screen; and the row-label column is `sticky left-0` with `bg-card`, since a
figure whose row label has scrolled away is unreadable (its `group-hover` is what keeps the row
highlight whole). Mutations on transactions, series and wallets all invalidate
`trpc.transaction.summary` — every figure is derived.

**Every field a listing shows gets a filter for it.** All five list pages follow this: wallets
(name, type, currency), categories (name, type), cards (name, currency, billing wallet),
budgets (category, currency, status) and transactions (description, account, category, kind,
repeats, status, plus the date range) — the transaction ledger has no columns any more, but the
rule is about what a row *states*, not how it is laid out. The date range is the one filter that
does **not** live in the bar: on the web it sits in the `PageHeader` beside the create action, the
same slot the budget month occupies, because a control that scopes the summary and the pagination
as well as the rows belongs above all three rather than inside the row-narrowing bar. It is still
part of `TransactionFiltersState`, so `Clear filters` resets the period to the current month along
with everything else — which is why that button can appear while every chip in the bar still reads
as its own column name. The controls
are ordered to match the row, and the bar is **left-aligned** — `FilterBar`
(`src/components/filter-bar.tsx`) owns that alignment and the `Clear filters` button, so no
page positions its own. `FilterSelect` and `FilterSearch` are the two control shapes, both
`rounded-full` chips; a `FilterSelect` whose column is actually filtered switches from outlined
to the pale-green filled state, so the bar shows at a glance which columns are narrowing the
list. `FilterSearch` debounces, because a request per keystroke is not a filter. Each module keeps a
`XFiltersState` + `EMPTY_X_FILTERS` + `isXFiltered` trio in `@budget-manager/client` and one
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
outside it — a series materialized months ahead, a seeded past row — needs the range **moved**
rather than widened, which is what the stepper arrows are for and why the e2e suites reach for
`pickDateRangePreset`, the `Previous period` / `Next period` labels, and `dayThisMonth`.

**Rows are listed oldest first**, and the day grouping in `transaction-rows.tsx` is a sequential
sweep that never reorders, so the order is the repository's `orderBy` alone (`asc(occurrenceDate)`
with `asc(id)` breaking ties, which is what keeps a page boundary from repeating or dropping a
row). The consequence worth knowing: in a month with more than `PAGE_SIZE` rows, what was just
recorded is on the *last* page, not the first.

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

A category's **colour rides in its Name cell rather than owning a column**, which is why the
category listing owes no colour filter: it is how a category reads in every other list, and a
column of its own would demand a filter for a value nobody searches by. `FilterItem.color` is a
CSS colour rather than a palette name, so `FilterSelect` stays domain-free; it distinguishes
three states, since a column with no swatch at all (wallet type) is not the same as a row whose
swatch is empty (`Uncategorized`).

Three deliberate gaps in that rule. **Money columns have no range filter**: wallet
`balanceCents`, card `outstandingCents` and `availableCents` are derived in TypeScript after
the page is fetched, so filtering them would mean either duplicating the derivation in SQL
(which the balances note forbids) or moving pagination out of the repository; the real columns
(`openingBalanceCents`, `limitCents`, `amountCents`) are left out too, for symmetry. The card
**Cycle** column is a display-only composite of two config fields. And the statements dialog
(`credit-card-bills-dialog.tsx`), the budget month card, the budget months dialog and the
dashboard lists are outside it — each is already scoped by controls of its own — the dialog is scoped
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

Forms use TanStack Form with the shared Zod schema as the **single** `onDynamic` validator under
`revalidateLogic({ mode: "change", modeAfterSubmission: "change" })`; the same schema is the tRPC
input validator, so client and server validation cannot diverge. Both apps build their forms with
the `useXForm` hooks in `@budget-manager/client/react`, so that logic is stated once —
`packages/client/src/forms.ts` is the pattern.

**That includes the auth forms**, even though they are the two that validate `onSubmit` only
(nothing to revalidate before the one submit that matters). `SignInFormSchema` and
`SignUpFormSchema` are composed in `packages/schemas` from the same `UserNameSchema` /
`NewPasswordSchema` the settings screen writes through — sign-up and `/settings/user` both write
`user.name` and both write a password, so a rule either screen invents locally is a rule the
other one disagrees with. They had: sign-up took a name of any length that the profile form then
refused to save, and a password past better-auth's own ceiling.

**Never split the schema across `onChange`/`onBlur`.** TanStack keys errors by cause and only
the same cause clears them, so a blur-sourced error survives every later change. Base UI's
Select never fires blur, so picking a value could not clear the error it had just fixed —
`canSubmit` stayed false, and `form.handleSubmit()` silently returns on the first attempt when
`canSubmit` is false, which made the transfer dialog need two clicks to submit. One cause,
revalidated on change, is what keeps `canSubmit` honest — which is why
`FORM_VALIDATION_LOGIC` is shared and no form spells it out. See
`packages/client/src/forms.test.tsx` for the regression test.

**A dependent select empties itself; don't reset it by hand.** Where one field narrows another —
the card payment's statement list is its card's, and its wallet list is filtered to that card's
currency — Base UI's Select drops a value that is no longer among its own `items` and reports
the change, so switching the card clears both. The forms that *do* reset a dependant explicitly
(kind → category on the transaction form, kind → wallet/card/category on the recurring one) are
the cases where the old value is still a legal option and only the *meaning* changed, which the
primitive cannot see. Adding a redundant reset to the first kind reads as though the primitive
could not be trusted; the trigger renders the placeholder either way, so only a submit tells the
two apart — `credit-card.test.ts` is what pins it.

Because validation is eager, error *display* is gated on the field being touched:
`const showErrors = field.state.meta.isTouched && !field.state.meta.isValid`, and
`<FieldError errors={showErrors ? field.state.meta.errors : []} />`. Submitting marks every
field touched, so a failed submit reveals everything. Submit buttons disable on
`isSubmitting` only — never on `!canSubmit`, which hides *why* a form won't go through.

Import aliases: `@/*` → `apps/web/src/*`, `@budget-manager/ui/components/<name>` for primitives.

### Mobile

**`md` is the one breakpoint that matters, and below it the page is touch-first.** Phone layouts
are not a coat of paint here: a listing has up to eight nowrap columns, which wants ~1000px.

Two structural rules keep the page from ever scrolling sideways, and both are easy to undo by
accident:

- The root layout in `__root.tsx` is `grid-cols-1`, i.e. `minmax(0, 1fr)`. An `auto` track sizes
  to its **max-content**, so a single wide table used to widen the whole document and every page
  scrolled horizontally. `AuthLayout` (`routes/_auth/route.tsx`) adds the desktop shell inside it:
  `md:grid-cols-[15rem_minmax(0,1fr)]` with the nav `Sidebar` in the first track and the content
  column carrying `min-w-0` — drop that `minmax(0,…)`/`min-w-0` pair and every page scrolls
  sideways again. Below `md` the sidebar is gone and a top bar (`Header`) with the sheet nav
  takes over.
- `container` has no padding of its own in Tailwind v4, so the two call sites add `px-4 sm:px-6`.
  Without it, text sits flush against the screen edge on a phone.
- `sr-only` does **not** hide a `<table>`: `width: 1px` is a *minimum* for a table box, so it grows
  to its cells and widens the page. `ChartDataTable` puts the class on a wrapping `<div>`, whose
  overflow clip actually contains it.

**A listing renders as a table at md+ and as one card per row below it**, from the same
`ColumnDef`s. `ColumnMeta` (augmented in `data-table.tsx`) names the slots: `primary` heads the
card, `trailing` sits opposite it, `actions` is the row menu, `hidden` drops out, and anything
unset becomes a labelled line — so a new column joins the card layout automatically, and `label`
is only needed when `header` is a function. `credit-card-bills-dialog.tsx` hand-rolls the same
shape for its six-column statement table, since it is not a `DataTable`.

**The transaction ledger is the one listing that is not a `DataTable` at any width.**
`transaction-rows.tsx` renders one row per movement — category-tinted kind glyph, description
over a `category · account · kind · repeats` meta line, a status pill, the amount opposite —
grouped under a date heading, at every breakpoint. Eight nowrap columns wanted about 1000px and
put the figure a reader is scanning for at the far edge; a row is one thing that happened, so it
reads as a block. Below `sm` the kind and repeats drop out of the meta line (it already wraps to
two rows without them) and the status pill hides, since both are restated in the detail dialog
the row opens. It carries the same `data-list-*` markers a `DataTable` does, so the e2e row
helpers do not care which one they are looking at.

The one `ColumnMeta` flag the **table** layout reads is `grow`, and each listing marks exactly
one column with it — Name on wallets, cards and categories. A
`w-full` on that column's cells is what makes an auto-layout table hand it every pixel the
others do not need, instead of spreading the slack evenly and leaving the column that carries
free text as narrow as `Currency`. It is also the only column allowed to wrap: the rest keep the
`whitespace-nowrap` that sizes them to their own content, so nothing but the growing column can
ever be squeezed.

That swap branches in **JS**, via `useIsCompact` (`packages/ui/src/hooks/use-media-query.ts`),
not `md:hidden`. Rendering both would duplicate every cell for screen readers and make
`getByTestId`/`tbody tr` match twice — the unit tests and every browser e2e read the table, and
they keep doing so because `useIsCompact` is false when `matchMedia` is missing and at the 1280px
viewport the suites use. It is `useSyncExternalStore`, so there is no setState-in-effect. The
date **range** picker uses it too, dropping to one month: two side by side is wider than a phone.

**One control scale, and it does not change with the viewport.** Wise's everyday control is
**48px** — `13px 24px` of padding around 16px/1.2 text — and `Button` `size="default"`, `Input`,
`SelectTrigger` and the calendar's `--cell-size` (40px) are all built to it. That already clears
the touch minimum, so there is no dense desktop variant and no `md:` override to get wrong; the
whole `max-md:h-10` / `md:data-[size=default]:h-8` dance the old scale needed is gone, along with
its two traps. 16px field text is still what stops iOS Safari zooming a focused input.

Below the default sit **`sm` at 36px** — Wise's `9px 16px` chip, which is what the filter bar,
the month steppers and the row-action triggers wear (`size="sm"` / `size="icon-sm"`, and
`DateRangePicker` takes a `size` prop so one picker serves both) — and `xs` at 28px for dense
compositions. `lg` is 56px, for a form's own primary action. A caller passing
`className="h-8"` still silently defeats the variant, so reach for a size rather than a class.

Above the lists: page headers stack (`flex-col sm:flex-row`) and `FilterBar` lays its controls
out two per column on a phone — half a dozen stacked full-width controls would push the list
itself off the first screen. `FilterSearch` takes a whole row anyway, since its placeholder is the
only thing naming the column. The transaction page's create actions are one split button rather
than four peers, so they need no grid of their own. A stepper group in a page header takes
`flex-1 sm:flex-none`, so on a phone it owns its row and the create action wraps below it rather
than the two of them squeezing together — the budget month and the transaction period both do
this.

### Native (apps/native)

Expo SDK 57 + expo-router, with the same features as the web app and the same design language.
Routes are file-based under `src/app/`: `login.tsx`, a `(tabs)` group, and four screens pushed
from the account menu; a route file is one line that re-exports a screen, so navigation config and
rendering never mix.

**The module layout mirrors the web's, name for name**, with `screens/` where the web has
`pages/`: `modules/<feature>/components/` holds the form fields, the create/edit/archive sheets,
the detail sheet and a `<feature>-list/` with the rows and the filter bar, and
`modules/<feature>/screens/` holds the one screen that composes them. A developer who knows where
`modules/budget/components/budget-list/budget-filters.tsx` is on the web finds it in the same
place here. There are no `queries.ts` or `mutations.ts` under a native module — that layer is
`packages/client`.

**Three tabs and an app bar, not seven tabs.** Dashboard, Transactions and Budgets are what the app
is opened for and earn one each. Wallets, credit cards, categories and settings are things you visit
to set something up, so they are pushed from the **account menu** and keep a native header, because
a pushed screen needs the back affordance the system already draws.

`components/app-bar.tsx` is the tab group's `header`, not something a screen renders: the account
mark on the left opens `account-menu-sheet.tsx`, and `CreateTransactionMenu` sits on the right. Both
are therefore fixed on every tab rather than scrolling away with the page — the primary action of a
finance app should not be a scroll position — and it is `AppBar` that pays the status-bar inset, so
`sceneStyle` must not pay it again. The bar deliberately carries **no title**: the tab bar already
says which screen this is.

Two things that used to be in the bar are gone for the same reason — a tab is for a destination you
return to, not for reaching other destinations. A **More** tab spent a fifth of the bar on
navigation about navigation, and five tabs left each one too narrow to tell apart by its icon.

`AccountAvatar` is a **neutral** disc (`muted` fill, `contentSecondary` initials), not a branded one:
it sits a thumb's width from the bright-green create action, and two saturated greens that close
together read as two peers when only one of them is the action. On native the dashboard hero is
therefore the only branded surface. The web's own avatar in `user-menu.tsx` is still bright blue —
the two apps disagree here, and if that is settled it should be settled in both.

**The tokens are mirrored, not imported.** `src/theme/tokens.ts` carries the same palette,
spacing, radius, control and type steps as `packages/ui/src/styles/globals.css` — React Native
reads neither CSS custom properties nor `oklch()`, and since the web file is plain sRGB hex this
is now a transcription rather than a conversion. Change a token there and change it here; that
duplication is the price of one design language across two renderers, and it is the *only*
duplication of the design that is accepted. `BRAND` is Wise's own palette, which does **not** flip
with the mode: bright green with forest-green ink is the brand, not a light-mode reading of it.
Inter is loaded through `@expo-google-fonts/inter` and nothing renders until it is in hand.

Elevation reads the same as on the web: **nothing casts a hard shadow.** `components/ui/surface.tsx`
is the plane every card, sheet, popup and listing sits on — a hairline border in light mode, and in
dark mode it **drops that border** and is separated by its lighter `card` fill instead, which is
the native reading of `dark:border-transparent`. `floating` is the only elevation left, for things
that genuinely sit over the page (a picker popup, a toast). `Button` presses with a plain
background wash rather than sliding into its own ink.

**One control scale, and it does not change with the viewport.** `CONTROL_HEIGHT` is Wise's:
**48pt** for the everyday control (input, select, button), `sm` 36 for the chips the filter bar,
the month steppers and the row actions wear, `xs` 28, and `lg` 56 for a form's own primary action.
Button variants match the web's, `destructive` outlined rather than a filled red block, plus
`onBrand`/`ghostOnBrand` for the dashboard hero where the page's own primary is the background.

**A dialog is a sheet.** Everything the web puts in a `Dialog` — a create form, a picker, a
confirmation, a detail view — rises from the bottom edge, where a thumb is, through `ui/sheet.tsx`.
`FormSheet` and `ConfirmSheet` are the two shapes above it, and `components/detail-sheet.tsx` is
the third, so a form's submit/cancel pair, a destructive action's confirmation and a record's
detail layout are each described once. **Every destructive action is still confirmed**, series
included; pause/resume stays unconfirmed because it is reversible from the same place.

The primitives keep the invariants their web counterparts have:

- **`Select` empties itself** when the current value leaves `items`, so a dependent picker (the
  card payment's statement list, its same-currency wallet list) needs no reset by hand — and the
  forms that *do* reset a dependant are the ones where the old value stays legal and only its
  meaning changed (kind → category, currency → billing wallet).
- **One validation cause, revalidated on change.** `FORM_VALIDATION_LOGIC` in `components/form.tsx`
  is the single `revalidateLogic` every form passes, and `isFieldInvalid`/`fieldErrors` gate error
  *display* on the field being touched. Submit disables on `isSubmitting` only.
- **A create sheet whose defaults are read from outside the form resets on open as well as close**
  — the date is today, the wallet is the first one, the currency is the account's preference, and
  all three can move while the sheet is shut.
- `CurrencyInput` reads and writes **minor units**, digits shifting in from the right.

**A listing is a list of records, and no listing carries a row menu.** `components/record-row.tsx`
is the native twin of the web's own — `RecordList` / `RecordRow` / `RecordGlyph` / `RecordTag` — a
rounded, borderless item that only shows its edges on press: a leading glyph, the name over a
dot-separated meta line, an optional status tag, the figure opposite. **The row opens the record
and every action lives in its detail sheet**, because a menu in a list of hundreds of rows puts an
irreversible action one mis-tap from a reversible one. The one adaptation to a phone is that the
tag sits *under* the figure rather than beside it, where there is room for it.

Two things about a detail sheet are load-bearing, and missing either costs a debugging pass:

- **Its `open` is derived** (`open={nested === null}`), never a prop the screen owns. The screen
  renders `{selected && <XDetailSheet key={selected.id} … />}`, and when an action opens a nested
  sheet the detail component must **stay mounted** — a screen that drops `selected` at that moment
  unmounts the component holding the nested sheet, and the nested sheet never appears.
- **A nested sheet replaces the detail view rather than stacking on it.** Two modals deep, the back
  gesture becomes ambiguous and the scrim doubles up.

The exception is the budget month card, which carries two direct icon affordances per meter rather
than a menu: there are at most two actions, and a menu would put them one tap further away while
reintroducing the thing the listings dropped.

**Recording something is one action on the bar.** `create-transaction-actions.tsx` is a hook
returning the header's `Create transaction` item *and* the sheets, because the header can only hand
back a callback and the state has to live with something that renders. It is a **native bar button
item** with `variant: 'prominent'` — a React view placed in an iOS 26 header is wrapped in the grey
glass capsule that groups bar items, so a green pill of our own drew as a green rectangle inside a
grey one. Its sheets are controlled from there and **stay mounted**, which is what keeps their
reset-on-open behaviour. Card purchase, pay card and transfer still have sheets in that hook but
**no affordance opens them** — the ellipsis `UIMenu` that used to sit beside the button is gone, and
nothing has replaced it yet.

**The native dashboard is not the web one made narrow — it answers four questions and stops.** How
much have I got, what did this month do, what needs paying, and where did it go, in that order: the
two that can be *acted* on come before the two that can only be read. `currency-section.tsx` is
where that order lives, and the two lists arrive as its `children` because the screen owns them (the
payload carries them at the top level, filtered to the currency in view).

- `balance-hero.tsx` — the bright-green plane: the balance, a `currency · accounts · month` line,
  the settled-or-projected line, and **two** card splits (`Net position`, `On cards`). Splits take an
  even share of the row rather than a `flexBasis`, which is what made a third one wrap to a line of
  its own; `Credit available` was that third one and is a reading of the two beside it.
- `month-summary.tsx` — Income / Expenses / Net as **rows in one card**, label left and figure right,
  under the month as the card's title. Three full-width stat tiles spent most of the first scroll on
  three numbers, and three tiles *across* is worse: at ~110pt `R$ 121.293,98` has nowhere to go but
  a second line. A label-and-figure row never runs out of room, in any currency or language.
- Then the statements and awaiting-payment lists, then spending, then the cash-flow chart.

**Four sections were cut rather than shrunk**, each because it was a *second* place to read
something the phone already has a first place for: the budget widget (the Budgets tab is one tap
below it), wallet balances and card utilisation (a meter per account, behind their own screens, for a
figure the hero already states), and the stat tiles. The screen went from about eight scrolls to a
screen and a half. **There is no page title either** — the tab bar names the screen and the hero
states the currency and month.

**Charts are plain views, and `react-native-svg` is only there for the logo.** Recharts is a DOM
library, so the cash-flow chart is a pair of bars per month. Every chart rule
holds: one series one colour, a legend when there are two, income always on the left, a hairline
solid baseline, and no number reachable only by looking at a bar — **each month's column reads its
own figures out** through `dashboard.cashFlow.monthSummary`, which is what the web's `sr-only`
`ChartDataTable` does there. Those figures used to be a *visible* table of four money columns under
the bars; at phone width every row wrapped, so the one part of the chart that existed to make the
numbers legible was the least legible thing on the screen. The pair is Wise's own —
`chartIncome`/`chartExpense`, bright green against forest green in light and against bright blue in
dark, since forest green disappears on the dark plane. A budget meter's fill states the **reading**
(green on track, yellow close, red overspent) while the category's own ink stays in the swatch
beside its name.

**Auth is cookie-based, through `@better-auth/expo`.** The plugin keeps better-auth's cookie in
the OS keychain and replays it, and identifies the app with an `expo-origin` header — which is why
`packages/auth` trusts `kivo://` and the Hono CORS config allows that header. The tRPC client is a
separate `fetch`, so `utils/trpc.ts` sends `authClient.getCookie()` itself, per request, alongside
`x-locale`. The plugin's published types narrow `getActions` in a way the plugin contract rejects,
so `lib/auth-client.ts` declares the one action the app calls; left uncast it poisons the whole
plugin tuple and with it the session's `preferredCurrency`/`preferredLocale`.

**Where the API is.** `EXPO_PUBLIC_SERVER_URL` when set, otherwise the Metro host in development
(`lib/server-url.ts`) — a device on the LAN reaches the API at the machine running the bundler,
which `localhost` would resolve to the phone itself.

`metro.config.js` watches the repo root and keeps **hierarchical lookup on**, against the usual
monorepo recipe: bun installs isolated, so a package's dependencies live in a nested
`node_modules` beside it and disabling the walk makes Metro fail to resolve them. It also hands
`.svg` to `react-native-svg-transformer`, so the logo is the web app's own artwork imported as
components — a pair of files per shape, picked by a ternary on the theme, which is again why there
is no `system` mode. `src/assets/logo/svg/` mirrors the web path and holds the four files this app
draws; the rest of the kit (the PNGs, the README) stays in `apps/web`. Both `KivoLogo` and
`KivoMark` take a **height** and derive the width from the artwork's own ratio — the K stands
taller than it is wide, so passing one `size` to both axes would stretch it. The app icon is
`assets/icon.png` (the kit's unrounded square, since iOS and the stores apply their own mask) with
an Android `adaptiveIcon` over `#163300`; its foreground is padded so the K clears the safe circle,
which the kit's own square icon does not.

There is no `test` script, so `turbo run test` stays hermetic and fast: the logic worth
unit-testing lives in `packages/client`, and its tests live there too — that package registers its
own happy-dom preload rather than borrowing an app's, because a test belongs beside the code it
pins. `check-types` runs in CI like every other workspace. The bundle is the other check worth
running by hand — `bunx expo export --platform ios` fails on an unresolved import or a broken
transform without needing a simulator.

#### The iOS home-screen widget

**Parked, and deliberately inert.** The code is complete and the Swift compiles, but nothing runs
it today: a widget is a native extension, so it needs a local build, and a locally-built Expo app
**cannot launch under the Xcode 27 SDK** — iOS 27 makes the missing UIKit scene lifecycle fatal,
and neither `expo@57` nor `react-native@0.86` has adopted it (`grep` for `UIScene` in either finds
nothing; the generated `AppDelegate` still does `window = UIWindow(frame: UIScreen.main.bounds)`).
That is upstream — [expo#46664](https://github.com/expo/expo/issues/46664), labelled *Upstream:
React Native* — not something this repo can fix from `app.json`. So `apps/native/ios` stays
unbuilt, `bun run native:ios` stays `expo start --ios` (Expo Go), and the feature waits.

Two things keep it harmless while parked, and both are worth not "tidying away": the JS reaches
native through `requireOptionalNativeModule`, which returns **null** rather than throwing when the
module is absent, so every call is an `await undefined`; and `@bacons/apple-targets` only ever
writes the *widget* target's Info.plist, so its presence in `plugins` changes nothing about the
app. Unparking is `npx expo prebuild -p ios` once upstream lands scene support — at which point
the run scripts flip back to `expo run:ios`, which is what prebuild rewrites them to.

`apps/native/targets/widget/` is a **WidgetKit extension in Swift**, linked into the generated
Xcode project by `@bacons/apple-targets` on every `npx expo prebuild`. That is the whole reason it
can exist without `ios/` being checked in: the target's source lives outside the generated
directory and the plugin re-attaches it each time. Two consequences: the widget does not exist in
Expo Go (there is no native extension in that client), and editing the target config or `app.json`
means re-running prebuild.

**The snapshot is the only channel, and it carries words rather than keys.** The app writes one
JSON blob into the shared app group (`group.dev.gmds.kivo`) and asks WidgetKit to reload; the
widget reads it and lays it out. Every string in that blob is **already translated and already
formatted** — a widget extension cannot import `@budget-manager/i18n`, and a `NumberFormatter`
written beside `formatMinorUnits` would be a second money implementation for the one currency it
disagrees about. So a reworded message or a new locale reaches the widget with no Swift change at
all, and `cents` rides alongside each formatted figure only because *sign* is a layout decision
(which way the net arrow points) that must not be parsed back out of a localized string. The shape
is declared twice on purpose — `src/modules/widget/snapshot.ts` and `targets/widget/Snapshot.swift`
— and `version` is what makes a drift show up as the placeholder rather than as a misread payload.

Four rules the feature turns on:

- **Only the current month is ever published.** `useWidgetSync` hangs off the dashboard screen, so
  it costs no extra request — React Query is already holding exactly that payload — but it is gated
  on the month in view being the current one. A widget quoting March on a home screen in August is
  worse than one that has not moved, so stepping back through history leaves the last good snapshot
  in place instead of overwriting it.
- **Sign-out clears it.** `useSignOut` drops the snapshot alongside the query cache, for a sharper
  version of the same reason: the home screen is readable by anyone holding the phone, so a balance
  must not outlive the session it belongs to.
- **The widget is a reading of the dashboard, not a second source.** It is built from the same
  `CurrencySummary` the screen draws, so it cannot disagree with the app behind it.
- **The timeline policy is `.never`.** These figures move when a transaction does, not when the
  clock does, and the app reloads the timeline itself on every write. Scheduling refreshes ahead
  would spend the widget's reload budget re-reading a file that had not changed. The flip side is
  the honest limitation stated on the widget itself: `updatedAtLabel` says when the reading was
  taken, because a pushed figure is only as fresh as the last time the app ran.

`apps/native/modules/widget-bridge/` is the local Expo module that does the writing — Swift only,
autolinked, `platforms: ["apple"]`. Its JS half is `src/modules/widget/bridge.ts` rather than an
`index.ts` beside the Swift, so the feature reads as one directory and nothing imports across the
`src` boundary; it reaches the native side through `requireOptionalNativeModule`, which is what
makes the whole thing a no-op on Android and in any client built before the widget existed.

Type in the widget is **SF, not Inter**: an extension has its own bundle and its own font
registration, and a home-screen widget set in the system face reads as part of iOS. The brand pair
is the only palette that reaches it, generated as colorsets from `expo-target.config.js` — so this
target is a *third* place a token is written down, after `globals.css` and `theme/tokens.ts`. The
gallery name, the parameter labels and the "nothing synced yet" placeholder are the one set of
user-visible strings not in `packages/i18n`: iOS draws them before any JavaScript has run, so they
live in `targets/widget/Localizable.xcstrings`, and unlike the snapshot they follow the *device*
language rather than the account's `preferredLocale`.

`ios.appleTeamId` is unset in `app.json`, so prebuild warns and a **device** build will fail
signing until it is added — an app group needs a provisioning profile that declares it. Simulator
builds do not care.

### Language

**The app ships English and Portuguese, and no user-visible string is written at
its call site.** `packages/i18n` owns the words. It has no dependencies but
React, and that only on the `./react` subpath, so `packages/schemas` and
`packages/api` can import the root entry without dragging React onto the server.

The catalog is **one file per namespace holding every language side by side**:

```ts
"wallet.empty.title": { en: "No wallets yet", "pt-BR": "Nenhuma carteira ainda" },
```

Two files, one per locale, drift the moment a key is added to one of them. Here
a missing translation is a *compile* error on the line that added the key —
`as const satisfies MessageTable` — the same bargain the repo makes with
`AppRouter` and the e2e client. `translate` reads a message's placeholders off
its **English literal** (`Placeholders<S>`), so `t("pagination.wallets.summary")`
without `{from,to,total}` does not compile, and neither does passing a name the
message never declares. What the types cannot see is a *translation* that drops
or renames a placeholder, so `i18n.test.ts` checks that every locale declares
the same set — and that no key is left blank.

**English is the default and its copy is verbatim what it was before i18n.** The
e2e browser suites assert on that copy; rewording an English message means
updating `apps/e2e`.

Three consumers, three ways in, and they are not interchangeable:

- **React** uses `useI18n()` / `useTranslate()` from `@budget-manager/i18n/react`.
  It must, not merely should: `I18nProvider` passes `children` through, so React
  bails out of re-rendering a subtree whose element identity has not changed. A
  component calling the module-scoped `t()` keeps its old words until something
  else re-renders it. `i18n.test.tsx` pins that.
- **Outside React** — the `QueryCache`/`MutationCache` toasts, `getErrorMessage`,
  `useApiMutation`'s `successMessage`, the router's `head` — uses the
  module-scoped `t()`, which reads the active locale `AppI18nProvider` keeps
  current.
- **The server** never sets an active locale. It translates with the locale on
  the *request*, which is what keeps two concurrent requests in two languages
  from reading each other's.

**Zod messages resolve at parse time, not at definition time.** Every message in
`packages/schemas` is `{ error: () => t("validation.…") }` rather than a string,
so the shared schema a form validates with speaks the reader's language without
a single form, `FieldError` or validator signature changing. This is the whole
reason a language switch needs nothing rebuilt. The deliberate exception is the
server: it does *not* set the module-scoped locale (a process global would race
across concurrent requests), so a `zodError` payload is always English — and it
only reaches a caller who bypassed the client-side validator, since the web app
validates with the same schema first.

**Domain errors carry a key, not a sentence.** `NotFoundError` and
`ConflictError` take a `MessageKey` plus its params (generic over the key, so
placeholders are checked at the `throw`); `mapDomainErrors` translates with
`ctx.locale` on the way out. The tRPC client sends `x-locale` on every request,
`createContext` reads it — falling back to `Accept-Language` for a caller with
no preference of its own, like the e2e API suite — and the server's CORS config
has to allow that header or the preflight fails. A sentence embedding a domain
word ("A {categoryType} category cannot be used…") passes `ref("enum.…")` rather
than the raw enum, so the embedded word is translated too.

**Enum labels are derived from the value, not kept in a second map.** The
`XLabelMap` constants that used to live in `packages/schemas` are gone; the
enums stayed (both sides of the wire read them) and the words became catalog
entries keyed `enum.<enum>.<value>`. `useEnumLabels()` (`@budget-manager/client/react`) is
how the app reads one — TypeScript resolves the template literal to a real key,
so a new enum member is a compile error until it is translated. The two that
take a plain `string` (currency, transaction kind) are fed by `text` columns and
echo a code they do not recognise.

**A row count is keyed per resource, not built from a noun.** `Pagination` takes
`resource="wallets"`, not `label="wallets"`: "No {label}" needs an article in
Portuguese and the article follows the noun's gender — *Nenhuma carteira* but
*Nenhum cartão* — so one parameterised sentence cannot be written correctly for
both. The same reasoning is why `FilterSearch` builds its placeholder from
`common.filterBy` instead of lowercasing the column name.

**Where the locale comes from.** `preferredLocale` is a better-auth
`additionalField` beside `preferredCurrency`, declared once in
`USER_ADDITIONAL_FIELDS` and backed by `user.preferred_locale` (migration
`0008`) — a language belongs to the person, so a second device, or the phone
rather than the browser, must not put the app back into English. `AppI18nProvider` (`lib/i18n.tsx`) derives it from the
session during render and mirrors it to `kivo-locale` in localStorage; that
mirror is what the login screen and the first paint read, before any session
exists, and it seeds from `navigator.language` when nothing is stored. The
active locale is applied at module load, before React mounts, because the Zod
messages and the tRPC header both read it. Read it through `toPreferredLocale`,
never off the session directly — it falls back for a stored code that is no
longer in `Locale`, and matches on the language subtag, so `pt` and `pt-PT` both
land on the Brazilian catalog. Unlike the theme, this one is server state, so
the settings form goes through `runAuthAction` like the rest of that screen.

**Dates are formatted by the app's locale; money is formatted by its currency.**
`packages/i18n` owns
`formatDate`/`formatDateString`/`formatDateRange`/`formatDateStringRange`/`formatMonthString`
over a closed set of named `DATE_STYLES` — a `{ month: "short" }` written out four
times drifts into four slightly different dates on screen. `toLocaleDateString(undefined, …)`
is gone: it read the *browser's* language, not the app's. Money deliberately did
**not** change: `formatMinorUnits` keys its locale off the currency, so BRL
always reads `R$ 1.234,56` whoever is looking, which is what keeps an amount
recognisable and every money assertion in the suites stable.

Two layout traps a second language exposes, both already fixed and both worth
remembering: a control sized to English clips (the transaction date-range
trigger is `sm:w-auto sm:min-w-44`, not a fixed width, and it leans on
`formatDateStringRange` to state a range's shared parts once — spelling both ends
out gave *1 de jul. – 31 de jul. de 2026*, which does not fit beside the stepper
arrows on a phone), and a chart's axis gutter has to hold the longest tick across
locales, not the English one.

The language selector lives on `/settings/user`, and its options are the one
thing on that screen that is **not** translated: each language names itself
(`LocaleLabelMap`), so a reader looking for their own language in a list they
cannot read finds *Português*, never *Portuguese*.

`apps/native` reads the same catalogs the same three ways, with one substitution
per platform primitive: the pre-session mirror is `AsyncStorage` under the same
`kivo-locale` key rather than localStorage, and the first guess comes from
`expo-localization`'s `getLocales()` instead of `navigator.language`. Nothing
about the catalogs is native-aware, which is the point — a key added for a phone
screen is a key the web can render, and a reworded message moves both.

Default category names are **data, not copy**: they are per-user rows written at
sign-up by `ensureDefaultCategories`, in English, and the user can rename them.
Nothing translates existing rows, and nothing should — renaming a category the
user may already have edited would be worse than leaving it.

### Money

Amounts are integer **minor units** everywhere — DB column, tRPC payload, form state, React state (`openingBalanceCents`, `int4`, hence the `MONEY_MIN/MAX_MINOR_UNITS` bounds in `MoneyMinorUnitsSchema`). Never introduce floats. `packages/money` owns `minorUnitDigits` (zero- and three-decimal currencies), `formatMinorUnits`, `formatCompactMinorUnits`, and `parseMinorUnits`; `packages/ui/src/lib/currency.ts` just re-exports them, and `apps/native` imports the package directly. Both apps' `CurrencyInput` reads/writes minor units directly.

`formatCompactMinorUnits` is for **axis ticks only**, where the full figure would collide with
its neighbours. It keeps anything under one thousand exact — a rounded tick the user cannot find
in the list below it is worse than a long one — and compacts the locale's own way (`R$ 12,3 mil`,
`¥1.2万`), so tests must compare on `\s`-flattened text: Intl separates with U+00A0.

### UI

Primitives in `packages/ui/src/components` are shadcn (`style: base-lyra`, `iconLibrary: remixicon`) on top of **@base-ui/react**, not Radix. The package is **web only** — React Native renders none of it, so `apps/native` has its own primitives under `src/components/ui/` speaking the same design language (see Native, above). Base UI composes via the `render` prop, not `asChild`: `<DialogTrigger render={<Button>Create</Button>} />`. Design tokens live in `packages/ui/src/styles/globals.css` (Tailwind v4, CSS-first).

**The design language is Wise's Neptune, and it is carried by tokens plus a handful of
recurring classes.** The palette is Wise's own, mapped onto the shadcn variable names so no
primitive had to learn new ones: `--primary` is **Bright Green `#9fe870` with a Forest Green
`#163300` label, in both themes** — it is the brand surface, not a themed one, which is the one
place a literal colour is correct. `--secondary` is the pale-green pill the active nav and an
applied filter wear. Surfaces are plain white over `#121511`/`#1e211d`, `--border` is a hairline
(`#e3e4e1` / `#33372f`) rather than ink, and `--ring` is `--foreground`, because Wise focus is a
dark ring not a glow.

Four rules follow from that and are easy to undo by accident:

- **Nothing is square and nothing casts a hard shadow.** The radius scale is Wise's — `--radius-md`
  10px (inputs, select triggers), `--radius-lg` 16px (menus, popovers, tooltips), `--radius-xl`
  24px (cards, dialogs, sheets, listings), `--radius-2xl` 32px (the dashboard hero) — and
  **buttons, chips, nav pills, swatches, meters and glyphs are `rounded-full`**. `--shadow-brutal-*`
  is gone; elevation is `--shadow-menu` on things that float over the page and nothing at all on
  a card, which reads as elevated by its border alone. In dark mode a card drops its border
  (`dark:border-transparent`) and is separated by its lighter fill instead.
- **Type is Inter, sentence case, on Wise's own scale.** `@fontsource-variable/inter` backs both
  `--font-sans` and `--font-heading`. The `uppercase` + `tracking-wide` treatment that used to sit
  on every heading, button, label and table header is gone; what survives is the **eyebrow** —
  `text-xs font-semibold tracking-[0.02em] uppercase text-muted-foreground` — used only for a
  small label over a figure (stat tiles, hero splits, nav group headings). Everything else is
  sized off the reference: page title 32px/-0.04em, dialog title 24px/-0.03em, card title
  18px/-0.015em, body and controls 16px, meta and captions 14px, eyebrows and tags 12px. Figures
  get their own steps — 60px on the hero, 32px on a stat tile, 18px on a ledger row's amount —
  and headings take negative tracking rather than extra weight.
- **`text-primary` is not a text colour.** Bright green on white is unreadable, so links and the
  button `link` variant read `--link` (Forest Green in light, Bright Green in dark) and
  `--content-secondary` is the softer body ink. A destructive action is outlined
  (`border-destructive/40 text-destructive`), never a filled red block.
- **A swatch carries no ink outline any more** — it is a plain round fill, so a category dot is
  paired with its name (see the category-colour note below) and a chart bar leans on its legend
  and table twin for relief rather than on a border.

`--wise-bright-green/-forest-green/-bright-blue/-bright-yellow/-bright-orange/-bright-pink` are
the brand palette itself, for surfaces that are deliberately branded rather than themed: the
dashboard hero and the account avatar. Reach for a semantic token first; these are the exception.

New components should speak this grammar rather than invent a parallel one.

`apps/native` speaks the same grammar, mirrored by hand into `src/theme/tokens.ts` — so the
"change a token there and change it here" rule under **Native** is a live obligation, not a debt.

**The app is Kivo, and the logo is a pair of files per shape, not a `currentColor` SVG.**
`apps/web/src/assets/logo/` is the brand kit — `svg/` and `png/` beside a
`KIVO-LOGO-README.md` that states the geometry and the two on-brand colourways — and
`components/logo.tsx` imports four of those SVGs as URLs and picks one with a ternary on
`useThemeMode()`. **Only forest-on-light and green-on-dark are legal**: bright green on white
fails contrast, which is why `KivoLogo` reads `kivo-logo-forest` / `kivo-logo-green` and
`KivoMark` reads `kivo-mark-forest` / `kivo-mark-green` rather than tinting one file.
That ternary is why **there is no system theme**: `ThemeProvider` runs
next-themes with `enableSystem={false}` over `THEME_MODES` (`light | dark`) under the
`kivo-theme` key, so the mode in state is always the mode on screen — a `system` setting would
mean guessing which artwork the OS is showing. `useThemeMode` is the only theme hook the app
uses; it narrows to `ThemeMode` so a stale stored value can never reach a `src`.
**There is no mark-plus-wordmark lockup, and there is no tagline.** The K *is* the wordmark's
capital letter, so setting the mark beside "Kivo" would read as "Kkivo" — `KivoLogo` (the
wordmark) is the brand everywhere it fits (sidebar, sheet nav, auth cards) and `KivoMark` is
for the tight spots (the phone top bar), where the narrow K is centred in a fixed 48px box so
the tap target does not shrink with it. `svg/kivo-app-icon.svg` is the favicon and
`png/kivo-app-icon-180.png` the apple-touch icon, both wired up in `index.html`, so it is Vite
that hashes them and there is no `public/` copy to drift; those two carry their own forest
tile and so are deliberately *not* theme-aware.
Both components render an `<img>` with `w-fit`, not `w-auto`: a flex
column stretches an `auto` cross size, and an `<img>` obeys the stretch while the SVG's own
`preserveAspectRatio` re-centres the artwork inside it — the logo silently drifts to the middle
of a `SheetHeader`.

Add shared primitives from the root: `npx shadcn@latest add <name> -c packages/ui`. Run the shadcn CLI from `apps/web` only for app-specific blocks. **`packages/ui` carries what the app
uses and nothing else** — the `base-lyra` style ships a chat kit (`attachment`, `bubble`,
`message`, `message-scroller`, `marker`, `input-group`, `navigation-menu`) that a budget app has
no use for, and ~950 lines of it sat there accruing lint suppressions for interactions nothing
rendered. A primitive pulled in speculatively is a maintenance surface, not an asset; delete it
and re-add it from the CLI when a screen actually wants it.

**A primitive that renders words takes them from `packages/i18n` like everything else.** `ui`
already depends on it (the calendar maps the app's locale to a date-fns one), so a `sr-only`
"Close" baked into `dialog.tsx`/`sheet.tsx` was simply an English string the language switch
could not reach — every dialog and sheet in the app announced it.

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
colourblind-separation and contrast check against this app's own surfaces — light `#fcfaf4`
(`--card`) and dark `#25221d`, **not** the page plane. The steps are deliberately pastel
(OKLCH C ≈ 0.10–0.13), so several light-mode fills sit below 3:1 there; the ink stroke every
bar and swatch carries, the legend, and the chart's table twin are the mandated relief — a
pastel fill may never be the only way to read a value. Re-run that check before changing a step
or a surface; a hue that "looks different enough" routinely is not under deuteranopia.

**A category owns a colour, and that colour is the same ink everywhere the category appears.**
`CategoryColor` (`packages/schemas/src/category/category-color.ts`) is a closed twelve-hue
palette — declaration order is the hue wheel, which is the order the picker renders — stored as
the `category_color` pg enum. Not a hex column: the swatch, the table cell, the select row and
the chart bar all have to resolve to one token, and only a closed set can carry light and dark
steps. `--category-*` in `globals.css` holds them, eight aliasing `--chart-1…8` (so a category
bar and a chart series of the same hue cannot drift apart) plus four filling the gaps the chart
ring leaves — cyan, lime, purple and a neutral slate. Those four were run through the same
colourblind-and-contrast check as the chart steps, tuned so picker-order neighbours stay apart
(worst adjacent pair ΔE ≥ ~6.5 OKLab under normal vision, both modes).

The whole ring was **re-saturated for the Wise redesign**: the old steps were tuned pastel for a
muted page and read washed-out beside bright green, and the ink outline that used to carry their
contrast relief is gone. Lightness was held and only chroma raised, then the check was re-run —
every hue now clears **3:1** against its own card surface (`#ffffff` light, `#1e211d` dark), which
the pastel ramp deliberately did not, and worst adjacent separation is **6.7 ΔE light / 7.1 dark**.
Cyan, lime and yellow had to be darkened rather than merely saturated to clear 3:1. Dichromacy
separation is still imperfect and always will be at twelve hues — which is exactly why the swatch
is never the message.
Twelve hues **cannot** all stay separable under dichromacy — pastel steps make that harder, not
easier — so the swatch is never the message: `CategoryLabel`
(`apps/web/src/modules/category/components/category-dot.tsx`) always pairs it with the name, and
the dot is `aria-hidden` and contributes no text, which is what keeps the label-based filter and
select assertions in e2e honest. Read a colour through `categoryColorVar`, never
`bg-category-<name>`: a per-row hue cannot be a static class. A row with no category gets a
hollow ring rather than a thirteenth hue. Append to the palette rather than re-ordering it — a
stored value is a category's identity, so shifting a slot would recolour every existing row.

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
`Last month`, `This week`, `Last week`, `Today`) in
`@budget-manager/client` next to `currentMonthRange` — the transaction module reads
that same helper for its default filters, so the picker and the list cannot disagree about what
"this month" means. Two rules are load-bearing: every pick **starts a fresh range** (first click
the start, second the end, ordered if the second lands earlier), and only a *complete* range is
handed to `onValueChange`, so a caller that requires a range is never left holding half of one —
which is what lets the transaction filters treat it as mandatory. `date-range-picker.test.tsx`
pins both; the arithmetic itself is pinned in `packages/client/src/date-range.test.ts`, across a
leap February.

`Custom` is a sixth option that **applies no range**: it marks a range the presets cannot
express, and clicking it leaves the popup open on the calendar instead of committing anything.
It is the only part of the control that needs state — which preset is active is otherwise
*derived* by comparing the value, so a range arrived at any other way lights `Custom` up on its
own. That state lasts as long as the popup.

**A range is navigated as well as picked: `shiftDateRange` is one click of the arrows beside
it.** What counts as one step comes from the range itself rather than from a remembered preset —
a range covering whole calendar months moves by that many months, and everything else by its own
length in days — so a month never drifts by the 28-to-31 days it happens to have, a week moves a
week, `Today` moves a day, and a hand-drawn 13-day range advances 13 days. Nothing has to be
stored for that, which is why the filter state gained no field and the arrows are plain buttons
flanking the picker rather than a mode inside it — in the web's page header
(`transaction-period-filter.tsx`) and still in the native filter bar. Neither arrow is ever
disabled: the ledger reaches into the future a series has already been written into, which since
the long presets went away is how that future is reached.

Because the arrows have to fit beside it, the trigger **names the period instead of reciting
it**: a whole calendar month reads `August 2026` (`isWholeMonthRange` decides), and anything else
goes through `formatDateStringRange`, which is `Intl`'s own `formatRange` and states what the two
ends share only once — `Aug 2 – 8, 2026`, `2 – 8 de ago. de 2026`, and a single day as just that
day. Two `formatDate` calls joined by a dash cannot do that in two languages, since the day sits
before the month in one and after it in the other.

## Conventions

- `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, and `noUnusedLocals` are on; `@typescript-eslint/consistent-type-imports` and `no-floating-promises` are errors — use `import type` and `void` fire-and-forget promises.
- ESLint runs `recommendedTypeChecked`; new type-unsafe spots should be fixed rather than added to the per-file overrides at the bottom of `eslint.config.js`.
- Zod v4 (`z.uuid()`, `z.flattenError`, `.prefault()`).
- No explanatory code comments — the code is expected to read on its own; explain reasoning in the PR or chat instead.
- **No user-visible string literals.** Every word on screen — including `aria-label`,
  `placeholder`, `title`, a toast's `successMessage` and a Zod message — comes from
  `packages/i18n`. Adding a key means adding both languages, which the types enforce.

## Deployment

Vercel Services (`vercel.json`): `web` (Vite SPA, built with `VITE_SERVER_URL=/api`) and `server` (Hono). `/api/*` rewrites to the server service and the path prefix is stripped — **except** `/api/auth/*`, which is preserved so better-auth's route matching and generated callback URLs use one public base. `packages/env/src/server.ts` derives `BETTER_AUTH_URL`/`CORS_ORIGIN` from Vercel env vars when unset; both `trpc.ts` and `auth-client.ts` resolve the relative `/api` back to an absolute origin at runtime.

Env vars are not uploaded with a deploy: `bun run deploy:setup` (vercel link), then `bun run env:preview` / `bun run env:production` before the first deploy. `bun run deploy` (preview), `bun run deploy:prod`, `bun run deploy:check` (dry run).
