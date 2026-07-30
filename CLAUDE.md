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
bun run test               # turbo test (apps/web + packages/money)
bun run build
```

### Single test

Tests are `bun:test`. Turbo only wires `test` in `apps/web` and `packages/money`; run a single file from inside that workspace so `bunfig.toml` preloads happy-dom:

```bash
cd apps/web && bun test src/modules/wallet/components/currency-input.test.tsx
cd apps/web && bun test -t "reads typed digits"    # filter by test name
cd packages/money && bun test
```

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
packages/api     tRPC routers + business logic (routes → service → repository)
packages/db      Drizzle schema, migrations, the `db` singleton
packages/auth    better-auth instance (drizzle adapter)
packages/schemas Zod schemas + enums shared by client and server
packages/money   Minor-unit math and currency formatting (no deps)
packages/ui      shadcn primitives built on @base-ui/react
packages/env     @t3-oss/env-core validated env (`/server` and `/web` entries)
packages/config  shared tsconfig.base.json
```

Workspace packages export raw TypeScript from `src/` (no build step) — only `apps/server` bundles, via tsdown with `noExternal: [/@budget-manager\/.*/]`. Shared dependency versions live in the root `package.json` `workspaces.catalog`; declare them as `"catalog:"` in each package.

### Backend layering (packages/api)

`packages/api/src/index.ts` builds the tRPC instance and exports `publicProcedure` / `protectedProcedure`. Two middlewares matter:

- `requireSession` narrows `ctx.session` to non-null for `protectedProcedure`.
- `mapDomainErrors` translates the domain errors in `errors.ts` (`NotFoundError` → `NOT_FOUND`, `ConflictError` → `CONFLICT`). Services throw those; they never build `TRPCError`s. Unmapped errors become `INTERNAL_SERVER_ERROR` and the formatter replaces the message with a generic string, so internals never leak.

A feature is a directory under `src/modules/<feature>/` with `routes.ts` (thin — reads `ctx.session.user.id`, delegates), `service.ts` (rules, throws domain errors), `repository.ts` (Drizzle queries), `validators.ts` (tRPC inputs composed from `@budget-manager/schemas`), and a barrel `index.ts`. Services are instantiated once in `containers.ts` and reach handlers as `ctx.services` via `context.ts` — repositories take `Db` in their constructor, so nothing imports `db` directly.

Every repository method takes `userId` and filters on it (`and(eq(t.id, id), eq(t.userId, userId))`); a missing row returns `null` and the service turns that into `NotFoundError`. Repositories select through an explicit `*_PUBLIC_COLUMNS` map rather than `select()`, keeping internal columns (e.g. `currentBalanceCents`, `archivedAt`) out of API responses. Register new routers in `src/routers/index.ts`; `AppRouter` is what the web app types itself against.

Deletion is guarded, not cascading: `WalletService.delete` counts referencing rows via `countReferences` and throws `ConflictError` telling the user to archive instead. Archive/unarchive are soft-delete flags on the row.

### Frontend (apps/web)

Routes are file-based under `src/routes/` (`routeTree.gen.ts` is generated — never edit, it's gitignored and ESLint-ignored). The `_auth` layout route redirects to `/login` in `beforeLoad` using `getCachedSession()` from `src/lib/session.ts`, a 10s TTL + in-flight-dedupe cache around `authClient.getSession()`; call `invalidateSessionCache()` after sign-in/out. Route `loader`s prefetch with `context.queryClient.ensureQueryData(context.trpc.<path>.queryOptions())` — `trpc` and `queryClient` are injected as router context in `main.tsx`.

Feature code lives in `src/modules/<feature>/` split into `pages/`, `components/`, `hooks/`, `queries/`, `mutations/`, `types.ts`. Components never call tRPC directly — they use the module's query/mutation hooks.

Error handling is centralized: `src/utils/trpc.ts` configures a `QueryCache`/`MutationCache` that toasts `getErrorMessage(error)` (see `src/utils/error-message.ts`, which unwraps `zodError` and code-specific copy). Mutations go through `useApiMutation` (`src/hooks/use-api-mutation.ts`), which takes `successMessage` / `errorMessage` / `suppressErrorToast` / `invalidateQueries` — pass `trpc.<path>.queryFilter()` for invalidation. Don't add per-call `onError` toasts.

Forms use TanStack Form with the shared Zod schema on both `onBlur` and `onSubmit` (`use-wallet-form.ts` is the pattern); the same schema is the tRPC input validator, so client and server validation cannot diverge.

Import aliases: `@/*` → `apps/web/src/*`, `@budget-manager/ui/components/<name>` for primitives.

### Money

Amounts are integer **minor units** everywhere — DB column, tRPC payload, form state, React state (`openingBalanceCents`, `int4`, hence the `MONEY_MIN/MAX_MINOR_UNITS` bounds in `MoneyMinorUnitsSchema`). Never introduce floats. `packages/money` owns `minorUnitDigits` (zero- and three-decimal currencies), `formatMinorUnits`, and `parseMinorUnits`; `packages/ui/src/lib/currency.ts` just re-exports them. `CurrencyInput` reads/writes minor units directly.

### UI

Primitives in `packages/ui/src/components` are shadcn (`style: base-lyra`, `iconLibrary: remixicon`) on top of **@base-ui/react**, not Radix. Base UI composes via the `render` prop, not `asChild`: `<DialogTrigger render={<Button>Create</Button>} />`. Design tokens live in `packages/ui/src/styles/globals.css` (Tailwind v4, CSS-first).

Add shared primitives from the root: `npx shadcn@latest add <name> -c packages/ui`. Run the shadcn CLI from `apps/web` only for app-specific blocks.

## Conventions

- `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, and `noUnusedLocals` are on; `@typescript-eslint/consistent-type-imports` and `no-floating-promises` are errors — use `import type` and `void` fire-and-forget promises.
- ESLint runs `recommendedTypeChecked`; new type-unsafe spots should be fixed rather than added to the per-file overrides at the bottom of `eslint.config.js`.
- Zod v4 (`z.uuid()`, `z.flattenError`, `.prefault()`).
- No explanatory code comments — the code is expected to read on its own; explain reasoning in the PR or chat instead.

## Deployment

Vercel Services (`vercel.json`): `web` (Vite SPA, built with `VITE_SERVER_URL=/api`) and `server` (Hono). `/api/*` rewrites to the server service and the path prefix is stripped — **except** `/api/auth/*`, which is preserved so better-auth's route matching and generated callback URLs use one public base. `packages/env/src/server.ts` derives `BETTER_AUTH_URL`/`CORS_ORIGIN` from Vercel env vars when unset; both `trpc.ts` and `auth-client.ts` resolve the relative `/api` back to an absolute origin at runtime.

Env vars are not uploaded with a deploy: `bun run deploy:setup` (vercel link), then `bun run env:preview` / `bun run env:production` before the first deploy. `bun run deploy` (preview), `bun run deploy:prod`, `bun run deploy:check` (dry run).
