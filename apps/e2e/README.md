# @budget-manager/e2e

End-to-end tests that run against a **live** stack: Postgres, the Hono server, and (for the
UI suite) the Vite dev server. They are the only tests that execute real SQL — the
`packages/api` unit tests deliberately cover pure logic only, because there is no test
database.

Deliberately **not** wired into `turbo run test`, so `bun run test` and the pre-push hook
stay hermetic and fast. Run these explicitly.

## Running

```bash
bun run db:start                      # Postgres
bun run db:migrate                    # schema must be current
bun run dev                           # server :3000 + web :3001

bun run test:e2e                      # everything
bun run test:e2e:api                  # API only, no browser needed
bun run test:e2e:ui                   # browser flows only
```

The API suite needs only the server; the UI suite needs both. Each suite fails with an
explicit "is it running?" message rather than a timeout if a service is missing.

The UI suite needs a Chromium build once:

```bash
cd apps/e2e && bunx playwright install chromium
```

## Isolation

Every test file signs up a fresh user and asserts only on that user's data, so suites are
order-independent and safe to run against a database that already has rows. Nothing is
truncated or cleaned up — sign-ups accumulate in the dev database, which is fine.

## Overrides

`E2E_SERVER_URL` and `E2E_WEB_URL` point the suites at a different stack (defaults
`http://localhost:3000` and `http://localhost:3001`).
