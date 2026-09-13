# Backend — task board

Checklist companion to `backend-plan.md`. Tick tasks as they land (`[x]`), add a short note
when something changed along the way. Keep this file and the plan in sync.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped

Status: **B0 done (2026-09-13)** — last updated 2026-09-13

---

## B0 — Plan

- [x] `specs/backend-plan.md`, this board, `decisions/2026-09-13-workspaces-api-contracts.md`

## B1 — Workspaces

- [ ] Move the app to `apps/web` (src, public, vite/vitest/tsconfig/eslint/dependency-cruiser,
      routes, prisma stays for B2); root `package.json` with `workspaces` and fan-out scripts
- [ ] `concurrently` for `npm run dev`; ports web 8080 / api 3001 reserved
- [ ] CI runs the root scripts; Makefile targets follow; Prettier config at the root only
- [ ] Docker: `apps/web/Dockerfile`; compose `web` service
- [ ] Every check green from the root: typecheck, lint (cap 31), cycles 0, tests, prettier, build

## B2 — `packages/database`

- [ ] `prisma/` (schema, migrations, seed, seedAnalytics, `prisma.config.ts`) and the generated
      client move to `packages/database`; `prismaClient` factory exported from the package
- [ ] Fixtures move to `packages/database/prisma/fixtures/` (seed input only)
- [ ] Web imports `@ecommerce/database` (transient, removed in B7); `db:*` scripts proxy
- [ ] `npm run db:seed` green from the root

## B3 — `packages/contracts`

- [ ] `shared/`: `period.ts`, `periodWindow.ts`, `metric.types.ts`, `metricValue`, `PROTOTYPE_TODAY`
- [ ] Per module: `*.types.ts`, `*Schema.ts`, labels/taxonomies, UI-facing rules with their tests
- [ ] Closed sets as `as const` tuples + Portuguese labels; enum-parity tests on the API side (B6)
- [ ] Web imports `@ecommerce/contracts/<domain>`; no DOM/React/Prisma inside the package (lint)

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
