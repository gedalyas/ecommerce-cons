# Architecture — modules, contracts and cycle control

**Status: PROPOSAL, awaiting approval (2026-09-12).** Nothing has moved yet.
Once approved, this file becomes the living rulebook and the migration map at
the end is executed in the order given. The source of the rules is
`architecture-reference.md` (the `arko_frontend` + `arko_backend` dossier);
this document only adapts them to one repo running React 19 + TanStack Start
SSR + Prisma 7.

## 1. The rule

> **The folder is the business domain. The layer is the file.**
> A file either belongs to a domain (`src/modules/<domain>/`) or belongs to
> none (`src/shared/`). There is no third option.

Consequences, all enforced by ESLint unless marked otherwise:

1. No layer folders at the root (`components/`, `hooks/`, `lib/`, `server/`,
   `features/`, `layout/`, `design-system/` become `extinct`).
2. A module is **flat** (`MAX_MODULE_DEPTH = 0`) and exposes exactly one file,
   `contract.ts`, written by hand — never a barrel.
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
│   ├── contract.ts               #   the only importable file from outside
│   ├── <Domain>.tsx              #   ENTRY: the page (PascalCase = exports a component)
│   ├── <Widget>.tsx              #   other components of the module
│   ├── <domain>Controller.ts     #   TRANSPORT: createServerFn — validates input, calls the service. Isomorphic.
│   ├── <domain>Service.ts        #   ORCHESTRATOR: the only file that imports Prisma. Server-only.
│   ├── <domain>Schema.ts         #   zod schema for server-fn input
│   ├── <domain>.types.ts         #   exported types (never inside a component/service)
│   ├── <domain>Fixture.ts        #   prototype dataset (until Stage 4 retires fixtures)
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

| Role             | File                                | Knows                                                                                         | Ignores                                 |
| ---------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------- |
| Composition root | `routes/*.tsx`, `routes/__root.tsx` | every `modules/*/contract`, `shared`                                                          | any module internal                     |
| Entry            | `<Domain>.tsx`, other `.tsx`        | own module (relative), `shared/ui`, `shared/hooks`, other contracts                           | Prisma, `shared/dependencies`           |
| Transport        | `<domain>Controller.ts`             | `./<domain>Service`, `./<domain>Schema`, `shared/utils`                                       | React, Prisma directly                  |
| Orchestrator     | `<domain>Service.ts`                | `@/shared/dependencies/prismaClient`, `@/generated/prisma/client`, pure core, other contracts | React, the request                      |
| Pure core        | `<rule>.ts`                         | own types, `shared/utils`, `date-fns`, Prisma **enums** (`@/generated/prisma/enums`)          | Prisma client, fetch, React, clock, env |
| Kernel           | `shared/**`                         | `shared`, node_modules                                                                        | any module                              |

Direction: `routes → contract → (module internals) → shared → node_modules`.
Module ↔ module only through contracts; a cycle between two contracts is
allowed by the lint and **caught by the ratchet**.

## 4. Contracts

- `contract.ts` is a manual list of `export { X } from './x'` and
  `export type { T } from './x.types'`. No logic, no `export *`, no
  speculative exports: only what has a consumer today.
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
2. **Build** — `vite.config.ts` `importProtection.client.files` moves from
   `**/server/**` to `**/shared/dependencies/**` and `**/*Service.ts`. A
   `*Service.ts` that leaks into the client bundle fails the build.

Verified on 2026-09-12: a `createServerFn` file that **statically** imports the
Prisma-touching module builds fine — the Start compiler strips the handler and
its imports from the client graph. So controllers import services statically;
the `await import()` workaround in `features/orders/api.ts` goes away.

## 7. Naming

| Thing          | Rule                                                                                                             | Example                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Module folder  | `camelCase`, singular, English, business capability                                                              | `orders`, `assistant`              |
| Component file | `PascalCase.tsx`, one component, default export re-exported as named in the contract                             | `Orders.tsx`, `DataTable.tsx`      |
| Any other file | `camelCase.ts` — **no kebab-case**                                                                               | `usePeriod.ts`, `seedAnalytics.ts` |
| Role suffixes  | `*Controller.ts`, `*Service.ts`, `*Schema.ts`, `*.types.ts`, `*Fixture.ts`, `use*.ts`, `*.test.ts`               | `ordersService.ts`                 |
| Route files    | English `camelCase.tsx`; the URL stays Portuguese in `src/routes.ts`                                             | `devOrders.tsx` ↔ `/dev/pedidos`   |
| Identifiers    | English; accented identifiers are a lint error; UI strings and data keys may be Portuguese (matches `CLAUDE.md`) | —                                  |
| Exports        | named everywhere; default only for the component of a `.tsx`                                                     | —                                  |

## 8. Tooling to add

- `eslint.config.js`: the reference's boundary block (`MAX_MODULE_DEPTH = 0`,
  `EXTINCT = ['features','lib','hooks','components','design-system','layout','server']`),
  `eslint-plugin-unused-imports`, `no-console` (allow `error`), the
  English-identifier selector, `max-lines` 600. Not copied: `sort-imports`
  (would churn every file for no architectural gain).
- `dependency-cruiser` + `tsx` (already present) + `scripts/checkCycles.ts` +
  `scripts/cyclicFiles.ts` + `scripts/cyclicFiles.test.ts`, byte-copied from
  the reference; `npm run check:cycles`.
- `vitest`: `npm test`; first tests are the copied `cyclicFiles.test.ts` plus
  `period.test.ts` and `metricFormat.test.ts` for the pure core we already
  have. Coverage ratchet later, when there is coverage to protect.
- `.github/workflows/ci.yml`: lint `--max-warnings <measured>`, typecheck,
  `check:cycles --max-files 0`, test, `format:check`, build (after
  `prisma generate`). **Optional — only if the repo lives on GitHub.**
- `specs/decisions/` with the ADR format from the reference; the first ADR is
  this alignment.

## 9. Deliberate deviations from the reference, and why

| Reference                                                   | Here                                                                                  | Why                                                                                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts` / `App.tsx` as the single composition root   | `src/routes/*.tsx` (one file per URL) + `__root.tsx`                                  | TanStack Start file routes are the framework's route table; each route file plays the `App.tsx` role for its URL. `routes.ts` keeps the English-file ↔ Portuguese-URL map. |
| FE `xService.ts` = axios wrapper; BE `xService.ts` = Prisma | `xController.ts` = server functions (transport), `xService.ts` = Prisma (server-only) | One repo hosts both halves; the BE vocabulary keeps `dependenciesOnlyInService` literally reusable and marks the server-only file by name.                                 |
| `shared/ui` flat, tokens in `global.css` `@theme` only      | `shared/ui` flat; token `.ts` files in `shared/styles/` next to `global.css`          | Our design system exposes tokens to TS (`textClass`, `layout`, `radiusClass`); they mirror the CSS variables, so they live beside them.                                    |
| No tests folder, fixtures inline                            | `*Fixture.ts` files stay in modules until Stage 4                                     | The seed and the screens share the prototype dataset; retiring it is already planned.                                                                                      |
| `staticImportsOnly` (no `import()`)                         | not adopted                                                                           | SPA-deploy problem the reference itself says to reevaluate under SSR; Start's route splitting is the framework's job.                                                      |
| Prettier single quotes / width 80                           | keep double quotes / width 100                                                        | Formatting is not architecture; changing it would touch every file.                                                                                                        |
| `check:module-load-order`                                   | not adopted                                                                           | ESM fails loudly on real cycles.                                                                                                                                           |

## 10. Migration map (executed only after approval)

Order, per the reference rollout: `git mv` → write contracts → rewrite imports
→ turn the lint on already green → typecheck/lint/build/`/dev/pedidos` check →
update docs. Schema, migrations and seed content are untouched.

### 10.1 Delete

- `src/components/ui/*` except the six files in use (`button`, `calendar`,
  `input`, `popover`, `select`, `tooltip`) — 40 vendored shadcn files nothing
  imports. `src/hooks/use-mobile.tsx` goes with `sidebar.tsx`.
- All `index.ts` barrels under `src/design-system/**` and `src/layout/**`.

### 10.2 Move — shared kernel

| From                                                                   | To                                                                                                                                       |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/{button,calendar,input,popover,select,tooltip}.tsx` | `src/shared/ui/{Button,Calendar,Input,Popover,Select,Tooltip}.tsx` (the `design-system/primitives/*` re-export wrappers merge into them) |
| `src/design-system/primitives/{Badge,Card,Divider,Skeleton}/`          | `src/shared/ui/<Name>.tsx` (+ `<name>.types.ts` when the types are consumed outside)                                                     |
| `src/design-system/patterns/<Name>/` (17 patterns)                     | `src/shared/ui/<Name>.tsx` + `<name>.types.ts`; `KpiCard/metricToTile.ts` → `src/shared/ui/metricToTile.ts`                              |
| `src/design-system/tokens/*.ts`                                        | `src/shared/styles/*.ts`                                                                                                                 |
| `src/styles.css`                                                       | `src/shared/styles/global.css`                                                                                                           |
| `src/design-system/hooks/*` + `src/hooks/use-period.ts`                | `src/shared/hooks/{useBreakpoint,useScrollShadow,usePeriod}.ts`                                                                          |
| `src/lib/{format,utils,csv,period}.ts`                                 | `src/shared/utils/{format,cn,csv,period}.ts`                                                                                             |
| `src/lib/metrics.ts`                                                   | split: `src/shared/models/types/metric.types.ts` + `src/shared/utils/metricFormat.ts`                                                    |
| `src/lib/error-{capture,page,reporting}.ts`                            | `src/shared/utils/error{Capture,Page,Reporting}.ts`                                                                                      |
| `src/lib/client.ts` + `REFERENCE_TODAY`                                | `src/shared/config/prototype.ts`                                                                                                         |
| `src/server/db.ts`                                                     | `src/shared/dependencies/prismaClient.ts`                                                                                                |
| `src/server/analytics/period.ts`                                       | `src/shared/utils/periodWindow.ts`                                                                                                       |
| `src/layout/{AppShell,Sidebar,BottomNav}/`                             | `src/shared/layout/{AppShell,Sidebar,BottomNav}.tsx`; AppShell gains `assistant`/`assistantFab` slots                                    |

### 10.3 Move — modules

| From                                                                                                            | To                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/dashboard/index.tsx`, `data/dashboard.ts`                                                         | `src/modules/dashboard/Dashboard.tsx`, `dashboardFixture.ts`, `contract.ts`                                                                               |
| `src/features/money/…`                                                                                          | `src/modules/money/Money.tsx`, `moneyFixture.ts`, `contract.ts`                                                                                           |
| `src/features/marketing/…` (+ `components/CreativePresence.tsx`)                                                | `src/modules/marketing/Marketing.tsx`, `CreativePresence.tsx`, `marketingFixture.ts`, `contract.ts`                                                       |
| `src/features/logistics/…`, `src/features/management/…`                                                         | `src/modules/logistics/…`, `src/modules/management/…` (same shape)                                                                                        |
| `src/features/connections/…`                                                                                    | `src/modules/connections/Connections.tsx`, `connectionsFixture.ts`, `contract.ts`                                                                         |
| `src/features/assistant/components/AssistantPage.tsx`, `src/layout/AssistantPanel/*`, `src/layout/AssistantFab` | `src/modules/assistant/Assistant.tsx`, `AssistantPanel.tsx`, `assistantReplies.ts`, `contract.ts` (exports `Assistant`, `AssistantPanel`, `AssistantFab`) |
| `src/features/orders/api.ts`                                                                                    | `src/modules/orders/ordersController.ts` (static import of the service)                                                                                   |
| `src/server/analytics/orders.ts`                                                                                | `src/modules/orders/ordersService.ts` + `orders.types.ts` (`OrdersOverview` and friends)                                                                  |
| `src/features/orders/dev.tsx`                                                                                   | `src/modules/orders/OrdersDev.tsx` (still temporary)                                                                                                      |
| `src/routes/dev-orders.tsx`                                                                                     | `src/routes/devOrders.tsx`                                                                                                                                |
| `prisma/seed-analytics.ts`                                                                                      | `prisma/seedAnalytics.ts`; `seed.ts` imports fixtures via `../src/modules/<x>/contract.ts`                                                                |

### 10.4 Config

- `vite.config.ts`: import protection globs → `**/shared/dependencies/**`, `**/*Service.ts`.
- `tsconfig.json`: add `scripts/**/*.ts` to `include`; alias unchanged (`@/*`).
- `eslint.config.js`: rewrite per §8.
- `package.json`: `check:cycles`, `test`, `format:check`; devDeps
  `dependency-cruiser`, `eslint-plugin-unused-imports`, `vitest`.
- `CLAUDE.md` Architecture section, `specs/conventions.md` "Project
  structure", `src/design-system/README.md` → `src/shared/ui/README.md`,
  `data-layer-migration.md` and `data-module-plan.md` file references.

---

## Appendix — gap analysis against the reference (snapshot 2026-09-12)

Delete this appendix once the migration lands; the ADR keeps the history.

| #   | Reference rule                                                                         | Here today                                                                                                                                                                  | Verdict                                                 | Files affected                    |
| --- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------- |
| 1   | Folder = domain, layer = file; only `modules/` + `shared/` + bootstrap at root         | `features/` (domain-ish) **and** six layer folders: `components/`, `design-system/`, `hooks/`, `layout/`, `lib/`, `server/`                                                 | **different**                                           | whole `src/`                      |
| 2   | Modules flat (`MAX_MODULE_DEPTH = 0`)                                                  | `features/<x>/data/`, `features/<x>/components/`                                                                                                                            | different                                               | marketing, assistant, all `data/` |
| 3   | One `contract.ts` per module, manual list                                              | none; `features/assistant/index.tsx` is a barrel, `features/orders/api.ts` is imported directly by the route                                                                | **missing**                                             | every feature                     |
| 4   | `moduleExposesOnlyContract` / `insideModuleIsRelative` / `crossingUsesAlias` in ESLint | ESLint has no boundary rule at all (only `server-only` package ban)                                                                                                         | **missing**                                             | `eslint.config.js`                |
| 5   | `sharedKnowsNoDomain`                                                                  | `layout/AppShell` imports `AssistantPanel` (assistant domain with canned replies); `layout/Sidebar` hardcodes "2 de 4 critérios" (dashboard)                                | different                                               | AppShell, Sidebar                 |
| 6   | No barrels except contract                                                             | 40+ `index.ts` re-export files in `design-system/`, `layout/`; `design-system/index.ts` does `export *` four levels deep                                                    | **different** — main cycle risk in the repo             | design-system, layout             |
| 7   | I/O only in `*Service.ts`; SDK client only importable there                            | Prisma in `server/analytics/orders.ts`, guarded by folder glob in `vite.config.ts` only; no lint rule                                                                       | different (build guard yes, lint no)                    | server/, features/orders/api.ts   |
| 8   | Cycle ratchet (`check:cycles`, files-in-SCC)                                           | nothing; `madge`/depcruise absent                                                                                                                                           | **missing**                                             | scripts/, package.json            |
| 9   | Entry → orchestrator → pure core; `now` as parameter                                   | `period.ts` is pure and takes `today`; `orders.ts` mixes query + shaping (acceptable orchestrator); `REFERENCE_TODAY` read as a module constant inside `period.ts` defaults | mostly same; move the clock constant to `shared/config` | lib/period.ts                     |
| 10  | Colocated `.test.ts`, vitest, born tested                                              | no test runner                                                                                                                                                              | **missing**                                             | package.json                      |
| 11  | Enums from Prisma, never redeclared; UI mirrors when it can't see Prisma               | `statusLabel` map in `orders.ts` keys on raw strings (`PAID`…) instead of the enum; UI unions (`"up" \| "down"`) are fine (UI-only)                                         | different (minor)                                       | server/analytics/orders.ts        |
| 12  | `x.types.ts` for exported types                                                        | design-system uses `types.ts` per folder (same idea, different name); `OrdersOverview` type exported from the Prisma-touching file                                          | different (naming)                                      | patterns/*/types.ts, orders.ts    |
| 13  | camelCase files, PascalCase only components, no kebab                                  | kebab in `use-mobile.tsx`, `use-period.ts`, `error-*.ts`, `dev-orders.tsx`, `seed-analytics.ts`                                                                             | different                                               | 7 files                           |
| 14  | English identifiers enforced by lint                                                   | convention in `CLAUDE.md`, no rule                                                                                                                                          | missing (cheap to add)                                  | eslint                            |
| 15  | `unused-imports`, `no-console`, `max-lines`                                            | `no-unused-vars` off, nothing else                                                                                                                                          | missing (cheap)                                         | eslint                            |
| 16  | Three ratchets in CI, no pre-commit                                                    | no CI at all                                                                                                                                                                | missing (optional)                                      | .github/                          |
| 17  | `CLAUDE.md` / `REVIEW.md` / `docs/decisions`                                           | `CLAUDE.md` + `specs/`; no ADRs, no review checklist                                                                                                                        | partially same                                          | specs/decisions/                  |
| 18  | Composition root injects across modules (DIP)                                          | `__root.tsx` renders `AppShell` which reaches into the assistant itself                                                                                                     | different                                               | __root.tsx, AppShell              |
| 19  | Server-only physical separation                                                        | single repo; `importProtection` in vite on `**/server/**`                                                                                                                   | n/a → §6                                                | vite.config.ts                    |
| 20  | Prettier single-quote/80                                                               | double-quote/100                                                                                                                                                            | different — **not adopting**                            | —                                 |
