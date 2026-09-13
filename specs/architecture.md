# Architecture — modules, contracts and cycle control

**Status: in force since 2026-09-12** (decision:
`decisions/2026-09-12-modules-contracts-cycle-ratchet.md`), **extended to
workspaces on 2026-09-13** (`decisions/2026-09-13-workspaces-api-contracts.md`).
This is the living rulebook; the boundaries are enforced by each workspace's
`eslint.config.js` and `scripts/checkCycles.ts`. The source of the rules is
`architecture-reference.md` (the `arko_frontend` + `arko_backend` dossier).

Since 2026-09-13 the repository has four workspaces — `apps/web` (TanStack
Start, the UI and its BFF server functions), `apps/api` (Express 4 + Zod +
Prisma 7, the backend the web and the mobile app share), `packages/contracts`
(the shapes, schemas and closed sets every client imports) and
`packages/database` (Prisma schema, migrations, seed, client). The rules
below were written for the single-app layout and still hold inside each
workspace; `CLAUDE.md` is the up-to-date statement of them, including the
dependency direction between workspaces (`web → contracts`;
`api → contracts, database`; packages import nothing from an app), the
`contract.server.ts` file that no longer exists (the API's `contract.ts`
publishes the service functions; the web has no services) and the API layers
(router factory → controller → service → rules). Read this document for the
why and the history; read `CLAUDE.md` for the how.

## 1. The rule

> **The folder is the business domain. The layer is the file.**
> A file either belongs to a domain (`src/modules/<domain>/`) or belongs to
> none (`src/shared/`). There is no third option.

Consequences, all enforced by ESLint unless marked otherwise:

1. No layer folders at the root (`components/`, `hooks/`, `lib/`, `server/`,
   `features/`, `layout/`, `design-system/` become `extinct`).
2. A module is **flat** (`MAX_MODULE_DEPTH = 0`) and exposes two hand-written
   files, never a barrel: `contract.ts` (isomorphic: pages, pure functions,
   types) and `contract.server.ts` (server-only: the `*Service.ts` functions).
3. Inside a module, imports are relative (`./x`). Crossing a boundary uses the
   alias: `@/modules/<other>/contract` or `@/shared/...`.
4. `shared/` never imports `modules/`.
5. I/O (Prisma) only in `*Service.ts`; those files never reach the client bundle.
6. Import cycles are measured (files inside a strongly connected component) and
   capped by a ratchet that only goes down. Starting cap: **0**.
7. Entry → orchestrator → pure core; pure core takes `now`/data as parameters
   and ships with a colocated `.test.ts` (convention + review).

## 2. Target tree

```
src/
├── router.tsx, start.ts, server.ts, routes.ts, routeTree.gen.ts   # bootstrap (framework)
├── routes/                       # COMPOSITION ROOT: one thin file per URL
│   ├── __root.tsx                #   shell + global search params; injects domain widgets into AppShell
│   └── <name>.tsx                #   head() + loader + component — imports ONLY @/modules/*/contract and @/shared
├── modules/<domain>/             # flat; one contract.ts per module
│   ├── contract.ts               #   isomorphic port: components, pure functions, types
│   ├── contract.server.ts        #   server-only port: *Service.ts functions (other services import it)
│   ├── <Domain>.tsx              #   ENTRY: the page (PascalCase = exports a component)
│   ├── <Widget>.tsx              #   other components of the module
│   ├── <domain>Controller.ts     #   TRANSPORT: createServerFn — validates input, calls the service. Isomorphic.
│   ├── <domain>Service.ts        #   ORCHESTRATOR: the only file that imports Prisma. Server-only.
│   ├── <domain>Schema.ts         #   zod schema for server-fn input
│   ├── <domain>.types.ts         #   exported types (never inside a component/service)
│   ├── <domain>Fixture.ts        #   seed input, exported through the contract; never imported by a screen
│   ├── <rule>.ts + <rule>.test.ts#   PURE CORE: calculates/decides, no I/O
│   └── use<X>.ts                 #   client-side orchestration when a loader is not enough
└── shared/                       # KERNEL: nothing here knows what an order or a pillar is
    ├── dependencies/prismaClient.ts   # only *Service.ts may import it (lint) + never in client bundle (build)
    ├── ui/                       #   design system, flat: Button.tsx, DataTable.tsx, dataTable.types.ts …
    ├── layout/                   #   AppShell, Sidebar, BottomNav, navItems (routes/labels/icons only)
    ├── hooks/                    #   useBreakpoint, useScrollShadow, useIsMobile, usePeriod
    ├── utils/                    #   format, cn, csv, period, periodWindow, metricFormat, error*
    ├── models/types/             #   metric.types.ts (MetricValue, Envelope, Series …)
    ├── config/prototype.ts       #   PROTOTYPE_CLIENT_SLUG, PROTOTYPE_TODAY (the demo clock)
    └── styles/                   #   global.css (Tailwind @theme) + the token .ts files
prisma/                           # schema, migrations, seed.ts, seedAnalytics.ts (imports modules only via contract)
scripts/                          # checkCycles.ts, cyclicFiles.ts (+test), generate-favicon.mjs, make-helpers.mjs
specs/                            # product specs + this file + decisions/ (ADRs)
```

Modules after the move: `dashboard`, `money`, `marketing`, `logistics`,
`management`, `connections`, `assistant`, `orders`. Stages 1–6 add
`products`, `customers` and extend `money`/`marketing` — always as flat
modules with a contract.

## 3. Roles by file (what each may import)

| Role             | File                                | Knows                                                                                                                         | Ignores                                 |
| ---------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Composition root | `routes/*.tsx`, `routes/__root.tsx` | every `modules/*/contract`, `shared`                                                                                          | any module internal, `contract.server`  |
| Entry            | `<Domain>.tsx`, other `.tsx`        | own module (relative), `shared/ui`, `shared/hooks`, other contracts                                                           | Prisma, `shared/dependencies`           |
| Transport        | `<domain>Controller.ts`             | `./<domain>Service`, `./<domain>Schema`, `shared/utils`                                                                       | React, Prisma directly                  |
| Orchestrator     | `<domain>Service.ts`                | `@/shared/dependencies/prismaClient`, `@/generated/prisma/client`, pure core, other modules' `contract` and `contract.server` | React, the request                      |
| Pure core        | `<rule>.ts`                         | own types, `shared/utils`, `date-fns`, Prisma **enums** (`@/generated/prisma/enums`)                                          | Prisma client, fetch, React, clock, env |
| Kernel           | `shared/**`                         | `shared`, node_modules                                                                                                        | any module                              |

Direction: `routes → contract → (module internals) → shared → node_modules`.
Module ↔ module only through contracts; a cycle between two contracts is
allowed by the lint and **caught by the ratchet**.

## 4. Contracts

- `contract.ts` is a manual list of `export { X } from './x'` and
  `export type { T } from './x.types'`. No logic, no `export *`, no
  speculative exports: only what has a consumer today.
- `contract.server.ts` lists the `*Service.ts` functions other modules'
  services may call. It exists because a route importing a page from a
  contract that also re-exported a service would pull Prisma into the client
  graph (import protection fails the build). Client code never imports it.
- Owner = producer. A type with a domain owner lives in that module and comes
  out through its contract; a second consumer does not move it to `shared/`.
- When publishing through the producer would close a cycle, the **consumer
  declares the shape it needs** (structural typing) and the composition root
  injects the implementation (reference §3.4). First real case here: `AppShell`
  (shared) needs the assistant panel (domain) → `AppShell` takes
  `assistant`/`assistantFab` slots and `__root.tsx` fills them from
  `@/modules/assistant/contract`.
- Client/server boundary: the server function in `<domain>Controller.ts`
  validates input with `<domain>Schema.ts` (zod) and returns the type declared
  in `<domain>.types.ts`; the page reads it through the route loader. Prisma
  types never cross: the service maps rows to `<domain>.types.ts` shapes
  (labels in Portuguese are produced here).
- Prisma **enums** are the single source of truth. Import them from
  `@/generated/prisma/enums` (browser-safe, no runtime) anywhere; the client
  (`@/generated/prisma/client`) only in `*Service.ts`.

## 5. Cycle prevention

Copied from the reference, not reinvented:

| Layer           | Mechanism                                                                                                                                                                    | Enforced                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Module boundary | `no-restricted-imports` with `extinct`, `sharedKnowsNoDomain`, `moduleExposesOnlyContract`, `insideModuleIsRelative`, `crossingUsesAlias(0)`, `dependenciesOnlyInService`    | lint, `error`                           |
| Import cycles   | `dependency-cruiser` builds the graph (`.dependency-cruiser.cjs`, no rules); `scripts/checkCycles.ts` runs Tarjan (`scripts/cyclicFiles.ts`) and fails above `--max-files N` | `npm run check:cycles -- --max-files 0` |
| Barrels         | `index.ts` re-exports forbidden; `contract.ts` is the one exception                                                                                                          | convention + review                     |
| Runtime         | ESM here: a real cycle throws a TDZ error at load instead of silently yielding `undefined`; no `check:module-load-order` needed                                              | —                                       |

How to break a cycle, in order: `import type` (fixes runtime, not the ratchet)
→ consumer-declared port + injection in `routes/` → move the file to the
owning module → `shared/` only if the file names no domain.

## 6. Server-only guarantee (the one thing the reference does not have)

The reference has two repos, so the browser physically cannot reach Prisma.
Here it can, so two guards:

1. **Lint** — `dependenciesOnlyInService`: `@/shared/dependencies/*` and
   `@/generated/prisma/client` only importable from `src/modules/*/*Service.ts`.
2. **Build** — `vite.config.ts` `importProtection.client.files` covers
   `**/shared/dependencies/**`, `**/modules/*/*Service.ts` and
   `**/modules/*/contract.server.ts`. Anything server-only that leaks into the
   client bundle fails the build.

Verified on 2026-09-12: a `createServerFn` file that **statically** imports the
Prisma-touching module builds fine — the Start compiler strips the handler and
its imports from the client graph. So controllers import services statically;
the `await import()` workaround in `features/orders/api.ts` goes away.

## 7. Naming

| Thing          | Rule                                                                                                                                     | Example                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Module folder  | `camelCase`, singular, English, business capability                                                                                      | `orders`, `assistant`              |
| Component file | `PascalCase.tsx`, one component, default export re-exported as named in the contract                                                     | `Orders.tsx`, `DataTable.tsx`      |
| Any other file | `camelCase.ts` — **no kebab-case**                                                                                                       | `usePeriod.ts`, `seedAnalytics.ts` |
| Role suffixes  | `*Controller.ts`, `*Service.ts`, `*Schema.ts`, `*.types.ts`, `*Fixture.ts`, `use*.ts`, `*.test.ts`; `contract.ts` / `contract.server.ts` | `ordersService.ts`                 |
| Route files    | English `camelCase.tsx`; the URL stays Portuguese in `src/routes.ts`                                                                     | `devOrders.tsx` ↔ `/dev/pedidos`   |
| Identifiers    | English; accented identifiers are a lint error; UI strings and data keys may be Portuguese (matches `CLAUDE.md`)                         | —                                  |
| Exports        | named everywhere; default only for the component of a `.tsx`                                                                             | —                                  |

## 8. Tooling (what enforces what)

| Rule                                                                                                                           | Enforced by                                                                                         | Level               |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------- |
| Extinct folders, contract-only imports, relative inside / alias across, `shared` knows no domain, Prisma only in `*Service.ts` | `eslint.config.js` (`no-restricted-imports`)                                                        | lint error          |
| Files inside import cycles                                                                                                     | `scripts/checkCycles.ts` over the dependency-cruiser graph, `npm run check:cycles -- --max-files 0` | CI, ratchet         |
| `*Service.ts` and `shared/dependencies` never in the client bundle                                                             | `vite.config.ts` `importProtection`                                                                 | build error         |
| Unused imports, `console.log`, accented identifiers, files over 600 lines                                                      | `eslint.config.js`                                                                                  | lint error          |
| Prettier                                                                                                                       | `npm run format:check`                                                                              | CI                  |
| Pure core born tested                                                                                                          | `vitest` (`npm test`), colocated `*.test.ts`                                                        | convention + review |
| No `index.ts` barrels; contract exports only what has a consumer today                                                         | —                                                                                                   | convention + review |
| Entry → orchestrator → pure core; `now` and data as parameters                                                                 | —                                                                                                   | convention + review |
| Module named by capability, not by entity or audience                                                                          | —                                                                                                   | convention + review |

`.github/workflows/ci.yml` runs typecheck, `lint --max-warnings 31` (function-size
warnings: `max-lines-per-function` 50/150, `max-params` 5, `max-depth` 4, measured 2026-09-13),
`check:cycles --max-files 0`, tests, prettier and build. The two numeric caps
only go down; whoever lowers a count lowers the cap in the same PR.

## 9. Deliberate deviations from the reference, and why

| Reference                                                   | Here                                                                                  | Why                                                                                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts` / `App.tsx` as the single composition root   | `src/routes/*.tsx` (one file per URL) + `__root.tsx`                                  | TanStack Start file routes are the framework's route table; each route file plays the `App.tsx` role for its URL. `routes.ts` keeps the English-file ↔ Portuguese-URL map. |
| FE `xService.ts` = axios wrapper; BE `xService.ts` = Prisma | `xController.ts` = server functions (transport), `xService.ts` = Prisma (server-only) | One repo hosts both halves; the BE vocabulary keeps `dependenciesOnlyInService` literally reusable and marks the server-only file by name.                                 |
| `shared/ui` flat, tokens in `global.css` `@theme` only      | `shared/ui` flat; token `.ts` files in `shared/styles/` next to `global.css`          | Our design system exposes tokens to TS (`textClass`, `layout`, `radiusClass`); they mirror the CSS variables, so they live beside them.                                    |
| No tests folder, fixtures inline                            | `*Fixture.ts` files stay in modules as seed input                                     | The seed imports them through the contracts; screens read loader payloads.                                                                                                 |
| `staticImportsOnly` (no `import()`)                         | not adopted                                                                           | SPA-deploy problem the reference itself says to reevaluate under SSR; Start's route splitting is the framework's job.                                                      |
| Prettier single quotes / width 80                           | keep double quotes / width 100                                                        | Formatting is not architecture; changing it would touch every file.                                                                                                        |
| `check:module-load-order`                                   | not adopted                                                                           | ESM fails loudly on real cycles.                                                                                                                                           |
