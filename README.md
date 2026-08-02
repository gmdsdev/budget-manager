# budget-manager

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Router, Hono, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **React Native** - The same app on a phone, in `apps/native` (Expo + expo-router)
- **Shared client package** - the whole client layer both apps read (row shapes, filters, query
  inputs, query/mutation hooks, form hooks), in `packages/client`
- **Hono** - Lightweight, performant server framework
- **tRPC** - End-to-end type-safe APIs
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Husky** - Git hooks for code quality
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
bun run db:migrate
```

### Migrations, not push

Schema changes go through generated migrations in `packages/db/drizzle`:

```bash
# after editing packages/db/src/schema/*
bun run db:generate   # writes the next drizzle/NNNN_*.sql
# review the generated SQL, then
bun run db:migrate
```

`bun run db:generate` should report **no changes** immediately after a migrate —
that is the check that the snapshot and the database agree.

`bun run db:push` is kept for throwaway/scratch databases only. Do not run it
against a database that holds data: `push` applies a diff without recording it in
`drizzle/meta/_journal.json`, so the snapshot silently drifts out of step with
reality and later migrations are generated against the wrong baseline.

Review generated SQL before applying it. Drizzle-kit's `text` → enum diffs in
particular are sometimes emitted as `DROP COLUMN` + `ADD COLUMN`, which would
discard the column's data instead of casting it.

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## Mobile app

`apps/native` is the same product as a React Native app. It needs the server running, then:

```bash
bun run dev:native        # Expo dev server (Metro)
bun run native:ios        # …and open the iOS simulator
bun run native:android    # …and open the Android emulator
```

`bun run dev` deliberately starts only web + server: Metro owns a terminal of its own, so run
`dev:native` beside it.

On a simulator the API is found automatically. On a **physical device**, set
`EXPO_PUBLIC_SERVER_URL` in `apps/native/.env` to an address the phone can reach (your machine's
LAN address, e.g. `http://192.168.0.10:3000`) — otherwise the app falls back to the Metro host,
which is usually right but cannot be if you are tunnelling.

To check the app still bundles without a simulator:

```bash
cd apps/native && bunx expo export --platform ios
```

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`. React Native
renders none of it, so `apps/native` has its own primitives in `src/components/ui/` and mirrors
the same tokens in `src/theme/tokens.ts` — change a token in `globals.css` and change it there
too.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@budget-manager/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Deployment

### Vercel Services

- Target: web + server
- Config: `vercel.json`
- Link the project first: bun run deploy:setup
- Local Vercel dev: bun run dev:vercel
- Sync preview env: bun run env:preview
- Sync production env: bun run env:production
- Dry-run check (no upload): bun run deploy:check
- Preview deploy: bun run deploy
- Production deploy: bun run deploy:prod
- Web requests under `/api/*` route to the server service and are rewritten before reaching the backend.
  Vercel Services share project environment variables, but deploys do not upload local `.env` files automatically. Link the project with `vercel link`, then run the env sync command before your first deploy (otherwise the deployment starts with no env vars), or pass one-off envs with `vercel deploy -e KEY=value`.
  Pass Vercel CLI flags to the env sync command directly, for example: `bun run env:production --scope your-team`.

For more details, see the guide on [Deploying to Vercel](https://www.better-t-stack.dev/docs/guides/vercel).

## Git Hooks and Formatting

- Initialize hooks: `bun run prepare`

## Project Structure

```
budget-manager/
├── apps/
│   ├── web/         # Web application (React + TanStack Router)
│   ├── native/      # Mobile application (Expo + React Native + expo-router)
│   └── server/      # Backend API (Hono, TRPC)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles (web only)
│   ├── client/      # Client layer shared by web and native (data, forms, filters)
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start only the server
- `bun run dev:native`: Start the Expo dev server for the mobile app
- `bun run native:ios` / `bun run native:android`: Start Expo and open a simulator
- `bun run check-types`: Check TypeScript types across all packages
- `bun run lint`: Lint the whole workspace (ESLint, one flat config at the root)
- `bun run lint:fix`: Lint and auto-fix
- `bun run test`: Run tests across all packages
- `bun run db:generate`: Generate a migration from schema changes
- `bun run db:migrate`: Apply pending migrations
- `bun run db:push`: Diff the schema straight onto the database — scratch databases only, see Database Setup
- `bun run db:studio`: Open database studio UI
- `bun run deploy:setup`: Link this repo to a Vercel project (first-time setup)
- `bun run dev:vercel`: Run the Vercel Services dev environment locally
- `bun run env:preview`: Sync local env files to the Vercel preview environment
- `bun run env:production`: Sync local env files to the Vercel production environment
- `bun run deploy`: Create a Vercel preview deployment
- `bun run deploy:prod`: Deploy to Vercel production
- `bun run deploy:check`: Dry-run a deploy to preview framework detection and included files without uploading
