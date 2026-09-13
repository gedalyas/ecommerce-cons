# Backend — task board

Checklist companion to `backend-plan.md`. Tick tasks as they land (`[x]`), add a short note
when something changed along the way. Keep this file and the plan in sync.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped

Status: **B0–B8 done (2026-09-13)** — the backend plan is complete; the web runs entirely on the API — last updated 2026-09-13

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

- [x] Express 4 app: `createApp(env, now)`, `index.ts`, zod-validated env (`readEnv`), JSON
      error middleware (`{ message }` / `{ message, errors }`, 400 on bad JSON, 404 on unknown
      routes, 500 logged), `parseOrThrow` (zod → 422 keyed by field, tested),
      `GET /api/v1/health` (pings the DB)
- [x] `User` (role `CONSULTANT | CLIENT`, scrypt hash) + `RefreshToken` (sha256 of the token,
      rotation, revocation) — migration `20260913…_users_and_refresh_tokens`; the seed creates
      `consultor@lojaaurora.com.br` (password `SEED_USER_PASSWORD`, default `aurora2026`);
      `@ecommerce/database/passwordHash` (tested) so seed and API share the hash format
- [x] `auth` module: `POST /auth/login|refresh|logout`, `GET /me`, `createRequireAuth(secret)`
      (bearer JWT HS256, 15 min; refresh 30 days, rotated on use, reuse → 401), `tokens.ts`
      tested, login limited to 20 attempts / 15 min; `@ecommerce/contracts/auth` holds the
      schemas and the `AuthUser`/`AuthTokens` shapes; `contracts/shared/apiError.ts` the error
      shape every client parses
- [x] Lint for the API (module boundaries, `dependenciesOnlyInService` on the database
      client, no React), cycles cap 0, vitest; smoke with curl: health, login, me, refresh
      rotation, wrong password 401, validation 422, unknown route 404
- [x] `apps/api/Dockerfile` (esbuild bundle, `prisma migrate deploy` on start); compose `api`
      service and the web pointed at it; `npm run dev` starts api + web; `.env.example` gains
      `API_PORT`, `JWT_SECRET`, `CORS_ORIGINS`, `SEED_USER_PASSWORD`, `API_URL`, `SESSION_SECRET`

## B5 — Web session

- [x] `shared/dependencies/session.ts` (Start `useSession`, sealed httpOnly cookie
      `ecommerce_session`, 30 days) + `apiClient.ts` (`apiFetch`, bearer from the session,
      one refresh on 401 re-sealing the cookie, `redirect` to `/entrar` when no session,
      `ApiRequestError` carrying the API's `{ message, errors }`); `shared/utils/queryString.ts`
      serializes query objects (arrays repeated, nested bracketed; tested)
- [x] `modules/auth` in the web: `authService.ts` (sign in → session, sign out → API logout +
      clear, session user), `authController.ts` (`loginFn`, `logoutFn`, `getSessionUser`),
      `Login.tsx`; route `login.tsx` ↔ `/entrar` (redirects home when signed in); the root
      loader redirects to `/entrar` without a session and renders the login page without
      the shell; the sidebar shows the user and a "Sair" button
- [x] Lint: web `shared/` may import `contracts/auth`; `*Controller.ts` may import
      `shared/dependencies/*` (the BFF calls the API from the transport layer, B7)
- [x] End-to-end in a headless browser: unauthenticated → `/entrar`; wrong password shows
      "E-mail ou senha incorretos"; login lands on `/` with the sidebar; httpOnly cookie;
      `/entrar` while signed in → `/`; logout → `/entrar` and `/` redirects again

## B6 — API modules (services copied, endpoints live)

- [x] Services, screen services and server-only rules (with their tests) copied from the
      web into `apps/api/src/modules/<domain>/`; `clientSlug` parameters became `clientId`
      (the token carries it); each module's `contract.ts` exports its router factory and
      the service functions other API modules call
- [x] Controllers (`req.query` → `screenQuery` = period + the screen's zod schema after
      `coerceQuery`, tested; bodies through `parseOrThrow`) and router factories per module;
      `app.ts` mounts every router behind `requireAuth` and injects `marketingCostLines` and
      `retentionSummary` into the marketing router (the `/marketing?aba=visao` payload now
      carries `retention`)
- [x] `format.ts` and `metricFormat.ts` moved to `contracts/shared` (the alert, narrative
      and sync-label rules format text; the mobile app will need the same pt-BR formatters)
- [x] Enum-parity tests (money, marketing, influencers, connections, consulting, auth);
      smoke against the dev API with a bearer token: 29 GET endpoints 200 with the expected
      shapes, cost and influencer create/update/delete (201/200/204), invalid body 422,
      missing token 401

## B7 — Web BFF

- [x] Every web `*Controller.ts` handler calls `apiFetch` (same server-function names and
      signatures, so routes and components did not change); services, `contract.server.ts`,
      server rules, the `alerts` module and `PROTOTYPE_CLIENT_SLUG` deleted from the web;
      `@ecommerce/database` left `apps/web/package.json` and the lint forbids it there;
      import protection narrowed to `shared/dependencies/**`; lint cap 24 → 15
- [x] `/marketing` is one call: `MarketingVisao.retention` travels inside the visão payload
      (the API controller assembles it), the route's composition-root loader is gone
- [x] Headless-browser sweep signed in through `/entrar`: 26 screens render with no 5xx and
      no page error; a cost created from Dinheiro › Custos reaches the API (rows 14 → 15);
      client-side navigation (server functions from the browser → API) works

## B8 — Rulebook

- [x] `CLAUDE.md` rewritten for the four workspaces (layout, dependency direction, the API
      layers, the BFF, contracts and enum parity, per-workspace ratchets, git scopes);
      `README.md`, `specs/product-overview.md`, `conventions.md`, `architecture.md` (status
      note pointing at `CLAUDE.md`), `specs/README.md` and `data-layer-migration.md` updated

## Follow-ups (not scheduled)

- `apps/mobile` (React Native) importing `@ecommerce/contracts`; the API is ready for it
- Real ingestion: CSV import through Conexões, connectors, a worker sharing `packages/database`
- Multi-client onboarding (users, invitations), password reset, roles beyond the token claim
- OpenAPI generated from the zod schemas if a non-TypeScript client appears
- Drop the `alert`, `monthly_snapshot` and headline `metric` rows nothing reads anymore
