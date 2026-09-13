# Backend — task board

Checklist companion to `backend-plan.md`. Tick tasks as they land (`[x]`), add a short note
when something changed along the way. Keep this file and the plan in sync.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped

Status: **B3 done (2026-09-13)** — last updated 2026-09-13

---

## B0 — Plan

- [x] `specs/backend-plan.md`, this board, `decisions/2026-09-13-workspaces-api-contracts.md`

## B1 — Workspaces

- [x] Move the app to `apps/web` (src, public, vite/vitest/tsconfig/eslint/dependency-cruiser,
      routes; prisma stays at the root until B2); root `package.json` with `workspaces` and
      fan-out scripts; root `vitest.config.ts` with projects; root `eslint.config.js` for
      `prisma/` and `scripts/`
- [x] `concurrently` for `npm run dev`; the web loads the root `.env` from its Vite config
- [x] CI runs the root scripts (lint cap 31 → 24: the seed's long functions left the web
      config); Makefile targets follow; Prettier config at the root only
- [x] Docker: `apps/web/Dockerfile` with the repo as build context; compose `web` service
- [x] Every check green from the root: typecheck, lint, cycles 0, 128 tests, prettier, build

## B2 — `packages/database`

- [x] `prisma/` (schema, migrations, seed, seedAnalytics, `prisma.config.ts`) and the generated
      client move to `packages/database`; `@ecommerce/database/client` (prismaClient, Prisma)
      and `@ecommerce/database/enums` are the package's two doors
- [x] Fixtures move to `packages/database/prisma/fixtures/` with their own `fixture.types.ts`
      (the package imports nothing from an app); the web contracts no longer export them
- [x] Web imports `@ecommerce/database` (transient, removed in B7); lint and the Vite import
      protection name the package's client files; `db:*` scripts proxy to the package
- [x] `npm run db:seed` green from the root; every check green; smoke on 5 routes

## B3 — `packages/contracts`

- [x] `shared/`: `period.ts`, `periodWindow.ts`, `metric.types.ts`, `metricValue.ts`,
      `clock.ts` (`PROTOTYPE_TODAY`), `fidelity.ts` — with their tests
- [x] Per module: `*.types.ts`, `*Schema.ts`, labels/taxonomies, UI-facing rules with tests
      (`marketingRules`, `goalDerivations`, `driverTrees`, `connectionsSummary`); one
      hand-written `contract.ts` door per domain, `exports` map `./<domain>` and `./shared/*`
- [x] Closed sets as `as const` tuples + labels (`costSets.ts`, `adPlatforms`,
      `influencerStatuses`, `influencerRuleTypes`, `dataSourceStatuses`, `pillarStatuses`,
      `fidelities`); components use them instead of the Prisma enum objects; the parity
      tests land with the API (B6). `consulting.types.ts` owns the wire shapes of a section
      (the `shared/ui` prop types stay as the UI's own, structurally identical)
- [x] Web imports `@ecommerce/contracts/<domain>`; the package's lint forbids React, Prisma,
      TanStack and the `@/` alias; the web's `shared/` may only import `contracts/shared/*`

## B4 — `apps/api` foundation

- [ ] Express 4 app: `createApp()`, `index.ts`, zod-validated config, JSON error middleware
      (`{ message }` / `{ errors }`), `GET /api/v1/health`
- [ ] `User` + `RefreshToken` models (migration), seed user for Loja Aurora
- [ ] `auth` module: `POST /auth/login|refresh|logout`, `GET /me`, `requireAuth`, scrypt +
      JWT helpers (pure, tested), login rate limit
- [ ] Lint sections for the API (boundaries, `dependenciesOnlyInService`), cycles cap 0, vitest
- [ ] `apps/api/Dockerfile`; compose `api` service; `.env.example` updated

## B5 — Web session

- [ ] `shared/dependencies/session.ts` (sealed cookie) + `apiClient.ts` (bearer, refresh on 401)
- [ ] `/entrar` login page (`login.tsx` ↔ `/entrar`), root `beforeLoad` guard, logout in the sidebar
- [ ] Smoke: login → dashboard renders; expired session → `/entrar`

## B6 — API modules (services copied, endpoints live)

- [ ] consulting, connections, alerts (no dependencies)
- [ ] orders, products, marketing, money, customers (facts and screens)
- [ ] goals, influencers, analysis, logistics, management, dashboard
- [ ] Enum-parity tests; every endpoint smoke-tested with curl + bearer

## B7 — Web BFF

- [ ] Every web `*Controller.ts` handler calls `apiClient`; services, `contract.server.ts`,
      server rules and Prisma deps deleted from the web; import protection narrowed
- [ ] Smoke: every tab and write path through the web against the API

## B8 — Rulebook

- [ ] `CLAUDE.md` rewritten for the three workspaces; `specs/architecture.md`, `README.md`,
      `product-overview.md`, `conventions.md` updated; this board closed
