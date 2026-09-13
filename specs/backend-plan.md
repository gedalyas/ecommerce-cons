# Backend plan — workspaces, `apps/api` and `packages/contracts`

Status: **approved 2026-09-13, in execution** — board in `backend-tasks.md`.

## Why

A React Native app is coming and it will use the same backend as the web. TanStack Start
server functions are an internal RPC (TanStack serialization, no public contract, no auth), so
they cannot be the app's door. The product needs an HTTP/JSON API with authentication, consumed
by the web and by the app, over the same `*Service.ts` and the same pure rules. Decisions taken
with Davi on 2026-09-13:

| Decision                | Choice                                                                     |
| ----------------------- | -------------------------------------------------------------------------- |
| Where the backend lives | npm workspaces in this repository (`apps/*`, `packages/*`), not a new repo |
| Backend framework       | Express 4 + Zod + Prisma 7, the `arko_backend` stack                       |
| Mobile                  | React Native (later); TypeScript, so it imports `packages/contracts`       |
| Web ↔ API               | The web keeps SSR and calls the API server-side (BFF), never Prisma        |

## Target layout

```
ecommerce-cons/
├── package.json                 # workspaces: apps/*, packages/*; scripts fan out (--workspaces)
├── apps/
│   ├── web/                     # TanStack Start (today's app, moved as-is): routes, modules (UI + BFF controllers), shared/ui
│   ├── api/                     # Express 4 + Zod: modules (routers, controllers, services, server rules), shared (auth, errors)
│   └── mobile/                  # React Native, when it arrives (not in this plan)
├── packages/
│   ├── contracts/               # what crosses the wire: *.types.ts, *Schema.ts, closed sets + labels, period, MetricValue; no DOM, no React, no Prisma
│   └── database/                # prisma/ (schema, migrations, seed, fixtures), generated client, prismaClient factory
├── scripts/                     # checkCycles.ts + cyclicFiles.ts (shared tooling), make-helpers, favicon
├── specs/, CLAUDE.md, Makefile, docker-compose.yml, .github/
```

Dependency direction between workspaces (enforced by lint, `no-restricted-imports`):

```
apps/web    → packages/contracts
apps/api    → packages/contracts, packages/database
apps/mobile → packages/contracts
packages/*  → node_modules only (contracts never imports database; database never imports contracts)
```

`apps/web` never imports `@ecommerce/database`, `@prisma/*` or anything from `apps/api`. The
`vite.config.ts` import protection keeps `shared/dependencies/**` (the API client, the session)
out of the client bundle.

## What goes where, file by file

| File role (today, in `src/modules/<d>/`)                                 | Destination                                                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `<d>.types.ts`, `<d>Schema.ts`, `<d>Labels.ts`, closed sets, taxonomies  | `packages/contracts/src/<d>/`                                                        |
| Pure rules the UI also needs (`marketingRules`, `goalDerivations` …)     | `packages/contracts/src/<d>/` (+ test)                                               |
| `<d>Service.ts`, `<d>ScreenService.ts`, `contract.server.ts`             | `apps/api/src/modules/<d>/`                                                          |
| Pure rules only the server needs (`costEngine`, `rfmSegments`, …)        | `apps/api/src/modules/<d>/` (+ test)                                                 |
| `<d>Fixture.ts` (seed input)                                             | `packages/database/prisma/fixtures/<d>Fixture.ts`                                    |
| `<d>Controller.ts` (server function)                                     | stays in `apps/web`; the handler calls the API                                       |
| `<Domain>.tsx`, other `.tsx`, `use*.ts`, `contract.ts`                   | stays in `apps/web`                                                                  |
| `shared/utils/period.ts`, `periodWindow.ts`, `models/types/metric.types` | `packages/contracts/src/shared/`                                                     |
| `shared/utils/metricFormat.ts`                                           | `metricValue` → contracts; `formatMetric` stays web                                  |
| `shared/dependencies/prismaClient.ts`, `prisma/`, `src/generated/`       | `packages/database`                                                                  |
| `shared/config/prototype.ts`                                             | `PROTOTYPE_TODAY` → contracts (demo clock); slug → api config until auth replaces it |

The module folders keep the same names on both sides: `apps/web/src/modules/orders` (UI + BFF)
and `apps/api/src/modules/orders` (HTTP + service). The contract of a web module stays
`contract.ts`; the contract of an API module is `contract.ts` (router factory + the service
functions other API modules may call — the Arko shape, one file, because the API has no client
bundle to protect).

## The API

- **Base path** `/api/v1`. One endpoint per screen payload, mirroring today's server functions
  so the app gets one call per screen and the web BFF is a passthrough:

  | Method              | Path                                                      | Today                        |
  | ------------------- | --------------------------------------------------------- | ---------------------------- |
  | GET                 | `/dashboard`                                              | `getDashboardOverview`       |
  | GET                 | `/orders`, `/orders/export`                               | `getOrdersScreen`, export    |
  | GET                 | `/products`                                               | `getProductsScreen`          |
  | GET                 | `/customers`, `/customers/export`                         | `getCustomersScreen`, export |
  | POST                | `/customers/segments/refresh`                             | `refreshSegments`            |
  | GET                 | `/money`, `/money/marketing-cost-lines`                   | `getMoneyScreen`, cost lines |
  | POST/PUT/DELETE     | `/money/costs[/:id]`                                      | cost rule writes             |
  | GET                 | `/marketing`                                              | `getMarketingScreen`         |
  | GET                 | `/logistics`, `/management`                               | section screens              |
  | GET                 | `/goals`, `/goals/suggestion`; PUT `/goals/plan`          | goals                        |
  | GET                 | `/analysis`                                               | `getAnalysisScreen`          |
  | GET/POST/PUT/DELETE | `/influencers[/:id]`                                      | influencer CRUD              |
  | GET                 | `/connections`, `/connections/health`                     | connections                  |
  | GET                 | `/consulting/milestone`                                   | `getMilestoneSummary`        |
  | POST                | `/auth/login`, `/auth/refresh`, `/auth/logout`; GET `/me` | new                          |

  Query strings carry the same params as today's search (`inicio, fim, por, comparar, canal`
  plus the screen's own), validated by the same zod schemas from `packages/contracts`.

- **Response** is the `*.types.ts` shape verbatim (`MetricValue`, `Series`, the union by `aba`).
  Numbers, never formatted strings; Portuguese labels where today's services already produce
  them. Errors: `{ message }` (Portuguese) or `{ errors: { field: [msg] } }` for validation,
  with 400/401/403/404/422/500 — the `arko_backend` format.
- **Auth.** `User` (clientId, email, passwordHash with Node `crypto.scrypt`, name, role
  `CONSULTANT | CLIENT`) and `RefreshToken` (userId, tokenHash, expiresAt, revokedAt). JWT
  access token (15 min, HS256, `JWT_SECRET`) + rotating refresh token (30 days). `requireAuth`
  sets `req.auth = { userId, clientId, role }`; every service receives `clientId` from there —
  `PROTOTYPE_CLIENT_SLUG` disappears from the request path. Login is rate-limited.
- **Layers** (same invariants as today): `<d>Router.ts` factory (`createOrdersRouter()`) →
  `<d>Controller.ts` (parse with zod, call the service, send JSON) → `<d>Service.ts` (Prisma,
  other modules' `contract.ts`) → pure rules. Routers are factories so module load order cannot
  form a runtime cycle; `check:cycles` runs on the API graph too, cap 0.
- **Config** validated at boot with zod (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGINS`);
  nothing reads `process.env` elsewhere. `PROTOTYPE_TODAY` stays the demo clock until real
  ingestion exists.

## The web after the move

- Route files, components, hooks and `contract.ts` do not change. The `*Controller.ts` server
  functions keep their signatures; the handler calls `apiClient.get("/orders", deps)` instead of
  a service. The client bundle never sees the API URL or a token.
- **Session**: a sealed cookie (TanStack Start `useSession`, `SESSION_SECRET`) holding the
  access and refresh tokens. `apiClient` (server-only, `shared/dependencies/apiClient.ts`) reads
  it, sends `Authorization: Bearer`, refreshes once on 401 and re-seals the cookie. The root
  route's `beforeLoad` redirects to `/entrar` when there is no session; `/entrar` is the login
  page (email + password, Portuguese errors).
- `@prisma/*`, `pg` and `src/generated` leave the web workspace; the lint forbids
  `@ecommerce/database` there.

## Closed sets and Prisma enums

The web loses `@/generated/prisma/enums`. `packages/contracts` declares every closed set the
UI needs as an `as const` tuple with its Portuguese label map (`dataSourceStatuses`,
`influencerStatuses`, `costFrequencies` …); the API keeps importing the Prisma enum and a
colocated test asserts `Object.values(PrismaEnum)` equals the contracts tuple, so the two cannot
drift silently. Recorded in `decisions/2026-09-13-workspaces-api-contracts.md`.

## Tooling

- Root `package.json`: `npm run <script> --workspaces --if-present` for `typecheck`, `lint`,
  `test`, `check:cycles`, `build`; `dev` starts api + web with `concurrently`; `format:check`
  at the root (one Prettier config); `db:*` proxies to `packages/database`.
- One `eslint.config.js` per workspace (the boundary rules are relative to the workspace) plus
  a root one for `prisma/` and `scripts/`; `npm run lint` fans out and CI keeps a single
  `--max-warnings` cap that every workspace must respect. Each workspace has its own
  `tsconfig.json`, `vitest.config.ts` (the root config lists them as projects) and
  `.dependency-cruiser.cjs`.
- Docker: `apps/api/Dockerfile` (Node runtime, `prisma migrate deploy` on start) and
  `apps/web/Dockerfile` (Nitro output); compose services `postgres`, `api`, `web`.
- Ports: web `8080`, api `3001`; `API_URL` in the web's env.

## Stages

Each stage is one or two commits, checks green before each. The server side moves in two
consecutive green commits instead of one per module: the service graph is connected
(`dashboard` needs `orders`, `money` needs `marketing`, …), so a module cannot leave the web
before its dependents do. B6 copies the services into the API (the web still runs on its own),
B7 switches the web to the API and deletes the copies. The duplication lives for exactly one
commit and the plan says so.

| Stage | What                                                                                          |
| ----- | --------------------------------------------------------------------------------------------- |
| B0    | This plan, the board and the decision record                                                  |
| B1    | Workspaces: the app moves to `apps/web`; root scripts, CI, Makefile, Docker, Prettier adapt   |
| B2    | `packages/database`: prisma dir, generated client, `prismaClient`; web imports it (transient) |
| B3    | `packages/contracts`: shared period/metric + every module's types, schemas, labels, UI rules  |
| B4    | `apps/api` foundation: Express app, config, error format, health, auth (users, JWT, refresh)  |
| B5    | Web session + `apiClient` + `/entrar`; the root guard; data still local                       |
| B6    | API modules: routers, controllers and the services copied from the web, all endpoints live    |
| B7    | Web BFF: controllers call the API; web services, rules, fixtures and Prisma deps deleted      |
| B8    | Rulebook: `CLAUDE.md` for three workspaces, `specs/architecture.md`, README, board closed     |

## Out of scope (next plans)

Real ingestion (connectors, CSV import, a worker), the mobile app itself, multi-client
onboarding UI, the assistant behind an LLM, OpenAPI generation (only if a non-TypeScript client
appears).
