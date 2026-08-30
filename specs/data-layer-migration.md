# Data layer migration: fixtures → Prisma/PostgreSQL

**Status: infrastructure done, UI migration not started (by decision).** The
screens keep rendering the TypeScript fixtures in `src/features/*/data`; the
database is provisioned, migrated and seeded with the same dataset so the
migration can happen screen by screen without a big bang.

## What already exists

- `docker-compose.yml` — `postgres` service (Postgres 17, healthcheck, volume)
  and an `app` service under the `app` profile.
- `prisma/schema.prisma` — full domain model: `Client`, `Section`, `Pillar`,
  `Metric`, `Recommendation`, `Alert`, `MilestoneCriterion`, `DataSource`,
  `MonthlySnapshot`, `AssistantMessage`, plus enums (`Fidelity`,
  `DeltaDirection`, `PillarStatus`, `DataSourceStatus`, `MessageRole`).
- `prisma.config.ts` — Prisma 7 config (connection URL, migrations path, seed
  command). The client uses the `@prisma/adapter-pg` driver adapter.
- `prisma/migrations/` — initial migration applied by `make ecom`.
- `prisma/seed.ts` — imports the **same fixture modules the UI renders** and
  writes them to the DB. Idempotent (wipes and recreates `loja-aurora`).
  Because seed and UI share the fixture source, the DB cannot drift from the
  screens while both exist.
- Generated client in `src/generated/prisma` (gitignored; `npx prisma generate`).

## Migration plan

Do it one step at a time; each step ships independently and keeps
`npm run typecheck` + `npm run build` green.

### Step 0 — shared db module

Create `src/lib/db.ts` (server-only): instantiate `PrismaClient` with
`PrismaPg` from `DATABASE_URL`, memoized in dev to survive HMR. Guard with the
import-protection pattern already configured in `vite.config.ts`
(`**/server/**` / `server-only`), e.g. place it in `src/server/db.ts`.

### Step 1 — read APIs as server functions

For each screen, add a TanStack Start server function (or route loader) that
returns exactly the shape the screen consumes today (the types in
`src/design-system/patterns/*/types.ts` are the contract):

- `getDashboard(clientSlug)` → headline metrics, open alerts, milestone
  criteria, open recommendations, monthly series.
- `getSection(clientSlug, sectionKey)` → `Section` with pillars, KPIs,
  recommendations.
- `getConnections(clientSlug)` → data sources + the "5 de 7" summary counts
  (derive counts in the query, stop hardcoding them).
- `getAssistantThread(clientSlug)` → seeded messages.

Map Prisma enums back to the UI's lowercase unions (`DONE` → `done`) at this
boundary; screens never see Prisma types.

### Step 2 — swap screens one by one

Order (smallest blast radius first): Conexões → Dinheiro → Gestão → Logística
→ Marketing (has the extra block) → Dashboard (most blocks) → Assistente.
For each: route loader calls the server function, feature receives data via
props/`Route.useLoaderData()`, fixture import removed from the screen (the
fixture file stays until step 4 because the seed uses it).

### Step 3 — derive instead of hardcode

Once screens read the DB, replace duplicated literals with derived values:
sidebar maturity "2 de 4 critérios" (count of achieved criteria), the Conexões
orange dot (any source with status `ERROR`), the Marketing banner (Meta Ads
source stale), sync labels from `lastSyncedAt` via `formatDate`.

### Step 4 — retire the fixtures

Move the fixture content into `prisma/seed.ts` (or JSON it consumes), delete
`src/features/*/data`, and make the seed the single source of the demo dataset.

### Step 5 — writes (post-prototype)

Only when the product needs it: mark recommendation done, dismiss alert,
assistant message persistence, connection reconnect flows. Each becomes a
server function writing through Prisma; CSRF middleware is already in place.

## Rules

- The database stays optional for the UI until step 2 lands on a screen; never
  make a screen require the DB before its loader exists.
- User-facing copy in the DB is Portuguese; keys/enums are English
  (`specs/conventions.md`).
- Schema changes always go through `prisma migrate dev` — never edit applied
  migrations.
