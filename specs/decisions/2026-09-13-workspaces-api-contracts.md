# 2026-09-13 — Workspaces: `apps/api` (Express) + `packages/contracts`

## Contexto

A React Native app is planned and must use the same backend as the web. The prototype's
backend was the TanStack Start server functions of a single app: internal RPC, no public
contract, no auth, unreachable from a mobile client.

## Decisão

One repository with npm workspaces: `apps/web` (TanStack Start, SSR, calls the API
server-side), `apps/api` (Express 4 + Zod + Prisma 7, `/api/v1`, JWT), `packages/contracts`
(types, zod schemas, closed sets, labels, period helpers — pure TypeScript) and
`packages/database` (Prisma schema, migrations, seed, client factory). The web keeps its
`*Controller.ts` server functions as a BFF over the API; it never imports Prisma again.
Closed sets the UI needs are declared in `contracts` as `as const` tuples; the API asserts
parity with the Prisma enums in tests.

## Por quê

- The app and the web must receive the same JSON: one API, one set of `*.types.ts`, imported
  by both TypeScript clients instead of duplicated or published.
- Express 4 + Zod + Prisma is the `arko_backend` stack: the team's rules (router factories,
  `contract.ts`, error format, testability list) apply without translation.
- Workspaces give one PR per feature across API, contracts and screens, one CI, one clone —
  and a future `apps/mobile` is one more folder.
- BFF instead of browser → API: SSR loaders already run on the server; tokens and the API URL
  stay out of the client bundle; the existing routes and components do not change.
- `packages/database` apart from `apps/api` so a future worker (ingestion, nightly RFM) can
  share the schema without importing an HTTP app.

## Alternativas descartadas

- **Separate `ecommerce-backend` repo (Arko model).** Two clones, contracts duplicated or
  published as a package, two CIs to keep in step. Nothing here needs independent ownership.
- **API routes inside the Start app (Nitro server routes).** Would have worked for the web,
  but couples the API's deploy and lifecycle to SSR and leaves the mobile app calling a
  website's process; auth and rate limiting would be bolted onto Nitro.
- **Web calling the API from the browser (SPA style).** CORS + cookie forwarding in SSR
  loaders, tokens in the client, every existing loader rewritten. The BFF keeps the current
  screens untouched.
- **Redeclaring Prisma enums by hand in the web.** Replaced by the tuple in `contracts` plus a
  parity test, so a new enum value fails a test instead of drifting.
