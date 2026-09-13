# CLAUDE.md — E-commerce Insights

E-commerce consulting dashboard ("E-commerce Insights") for one fictional client, Loja Aurora.
React 19 + TanStack Start (SSR) + Tailwind 4 + Prisma 7 / PostgreSQL, **one repository for both
halves**: the server side is the `*Controller.ts` (server functions) and `*Service.ts` (Prisma)
files of each module, the client side is everything else. This file answers one question — how
to write code in this repo. Product behaviour lives in `specs/` (read the screen's spec before
touching it); architecture decisions in `specs/decisions/`; the rules below are the same ones
the Arko repos follow (`specs/reference/`), adapted to a single Start repo.

## Language rule (enforced)

- **Everything the user sees is Portuguese (pt-BR)**: rendered strings, labels, `aria-label`,
  `head()` meta, URLs (`/dinheiro`, `/metas`), CSV headers, copy stored in fixtures or the DB.
- **Everything else is English**: file and folder names, identifiers, types, props, data keys,
  commit messages, specs and READMEs. An accented identifier is a lint error.
- Route files are English (`src/routes/money.tsx`), URLs are Portuguese: the map is
  `src/routes.ts` (virtual file routes). Never rename a route file expecting the URL to follow.
- Closed-set values are English (`"ecommerce" | "marketplace"`, `"done" | "blocked"`); their
  Portuguese labels live in a `Record<Key, string>` next to the definition (`channelLabel`,
  `statusLabel`, `goalGroupLabel`).

## Commands

```sh
make ecom             # full setup + dev server (env, deps, postgres, migrate, seed, dev)
npm run dev           # dev server only, expects postgres up   http://localhost:8080
npm run typecheck     # tsc --noEmit (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes)
npm run lint          # ESLint flat config; CI runs it with --max-warnings <cap>
npm run check:cycles  # files inside import cycles; CI runs it with --max-files 0
npm test              # vitest, colocated *.test.ts next to the pure core
npm run format:check  # prettier (double quotes, width 100)
npm run build         # production build (Nitro output in .output/)
npm run db:migrate | db:seed | db:studio | db:reset
```

**Definition of done for any change:** `typecheck`, `lint` (at or under the warning cap),
`check:cycles -- --max-files 0`, `test`, `format:check` and `build`, all green. `build` catches
what `typecheck` misses (import protection, route tree), so it is not optional.

## Architecture

**The folder is the business domain. The layer is the file.** A file either belongs to a
domain (`src/modules/<domain>/`) or belongs to none (`src/shared/`). There is no third option;
the pre-migration folders (`features/`, `components/`, `lib/`, `hooks/`, `server/`,
`design-system/`, `layout/` at the root of `src/`) are `extinct` and the lint keeps them dead.

```
src/
├── routes.ts, routes/          # composition root: one thin file per URL + __root.tsx
├── modules/<domain>/           # flat, one folder per business capability
└── shared/                     # kernel: ui/, styles/, layout/, hooks/, utils/, models/types/, config/, dependencies/
prisma/                         # schema, migrations, seed.ts + seedAnalytics.ts
scripts/                        # checkCycles.ts, cyclicFiles.ts (+test), favicon generator
specs/                          # product specs, architecture.md (the full rulebook), decisions/
```

**A module is a business capability, not an entity.** `orders`, `customers`, `money`,
`marketing`, `products`, `logistics`, `goals`, `dashboard`, `connections`, `assistant`,
`management`, `consulting` (the engagement's sections, pillars, recommendations and
milestone, read from the DB), `alerts`, `analysis`, `influencers`. If describing the module in one sentence needs an "and", it is two modules — and
the split is a sibling top-level folder, never a subfolder (modules are flat,
`MAX_MODULE_DEPTH = 0`). Which files go along is decided by the direction of the dependency, not
by the name: **if moving a file forces the new module to import back from the origin, the file
was already in the right place.**

### The three invariants

1. **Every module has a public door — two files here, because one repo hosts both halves.**
   `contract.ts` is the isomorphic port (the page, pure functions, closed sets, types, server
   functions); `contract.server.ts` publishes the `*Service.ts` functions other modules'
   services may call. Both are hand-written `export { X } from "./x"` lists — never a barrel,
   never `export *`, never a speculative export: only what has a consumer today. Anything
   outside the module imports from these two files and from nothing else. A route or a
   component never imports `contract.server.ts` (Prisma would enter the client graph and the
   build fails).
2. **I/O only in the orchestrator.** Prisma, `fetch`, the clock and env are touched in
   `*Service.ts` (server) or in a `use*.ts` hook / route loader (client). Never in a component,
   never in a controller beyond validation, never in a pure core file.
3. **Pure core in its own file, with a colocated test.** Every calculation, classification,
   parser, validator or rule is a file that imports no infrastructure and is born with
   `foo.test.ts` beside it, tested with literal values: `costEngine.ts`, `rfmSegments.ts`,
   `marketingRules.ts`, `goalDerivations.ts`. Two pocket tests: if it needs `await` it is an
   orchestrator; if testing it needs a mock it is in the wrong place.

| Role             | File                              | May import                                                                                                    | Never                                    |
| ---------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Composition root | `routes/<name>.tsx`, `__root.tsx` | `@/modules/*/contract`, `@/shared/*`                                                                          | a module internal, `contract.server`     |
| Entry            | `<Domain>.tsx`, other `.tsx`      | own module (`./x`), `@/shared/ui`, `@/shared/hooks`, `@/shared/utils`, other modules' `contract`              | Prisma, `shared/dependencies`, the clock |
| Transport        | `<domain>Controller.ts`           | `./<domain>Service`, `./<domain>Schema`, `@/shared/utils/period`, `@/shared/config`                           | React, Prisma directly                   |
| Orchestrator     | `<domain>Service.ts`              | `@/shared/dependencies/prismaClient`, `@/generated/prisma/client`, own pure core, other `contract[.server]`   | React, the request, formatting           |
| Pure core        | `<rule>.ts` + `<rule>.test.ts`    | own `.types.ts`, `@/shared/utils`, `@/shared/models/types`, `date-fns`, enums from `@/generated/prisma/enums` | Prisma client, fetch, React, clock, env  |
| Kernel           | `shared/**`                       | `shared`, node_modules                                                                                        | any `modules/*`                          |

Direction: `routes → contract → module internals → shared → node_modules`. Module ↔ module only
through contracts.

### The `shared/` rule

> **Has a domain owner? It stays in the owning module and comes out through its contract.
> Has none? It goes to `shared/`.**

The test, file by file: _to explain what this file does, do I have to name a domain?_ "The RFM
segment of a customer" → `customers`, published by its contract. "Formats a number as R$" →
`shared/utils/format.ts`. A second consumer never moves a file up; a domain type in `shared/`
is the shared-folder anti-pattern (modules become shells, the spaghetti comes back with a nicer
folder name). `shared/` is small, stable and deliberately boring: nothing in it knows what an
order, a pillar or a coupon is. Health metric: a change that produces many new `shared/` files
has gone wrong.

### Cycles: forbidden by tooling, not by construction

Cross-module edges are allowed (through contracts); cycles are not. `npm run check:cycles`
builds the import graph with dependency-cruiser and counts the **files inside a cyclic
component** (Tarjan, `scripts/cyclicFiles.ts`); CI caps it at **0** and the cap only ever goes
down. How to break a cycle, in order:

1. `import type` — removes the edge from the build (and `consistent-type-imports` demands it),
   but not from the ratchet.
2. **The consumer declares the shape it needs and the composition root injects it.** This is the
   house pattern: `AppShell` (shared) takes `assistant`/`assistantFab` slots filled by
   `__root.tsx`; `/marketing` fetches `getMarketingCostLines` (money) and
   `getRetentionSummary` (customers) in its loader and hands them to `Marketing`, because money
   and customers already depend on marketing for the ad spend. The dependency never goes back.
3. Move the file to the module that owns it.
4. `shared/` — only if the file names no domain.

### Server-only guarantee

The browser can physically reach Prisma in a single repo, so two guards: lint
(`dependenciesOnlyInService`: `@/shared/dependencies/*` and `@/generated/prisma/client` only
from `src/modules/*/*Service.ts`; enums from `@/generated/prisma/enums` are browser-safe and
allowed anywhere) and build (`vite.config.ts` `importProtection` fails when a `*Service.ts`,
`contract.server.ts` or `shared/dependencies` file lands in the client bundle). A controller
imports its service statically — the Start compiler strips the handler from the client graph.

### Closed sets and magic strings

A domain value with a closed set (tab, channel, status, segment, cost category) is declared
**once**, as an `as const` tuple with its derived type and its Portuguese label map, in the
owning module (or `shared/utils/period.ts` for the global params), and published through the
contract; zod reads the same tuple (`z.enum(marketingTabs)`). Prisma enums come from
`@/generated/prisma/enums`, never redeclared. Compare against the typed value, so a stray
literal fails `tsc`; technical keys (sort columns, `"asc" | "desc"`, recharts props) stay as
literals. Do not add an ESLint rule for this — there is no reliable one; review is the backstop.

## Server side (controllers and services)

- **Controller = transport.** `createServerFn({ method })` with `.validator()` that parses the
  input (global params through `parsePeriodSearch`, the screen's own through its
  `<domain>Schema.ts` zod schema) and `.handler()` that calls the service with
  `PROTOTYPE_CLIENT_SLUG`. Reads are `GET`, writes are `POST`. Nothing else lives there.
- **Service = orchestrator.** Resolves the client, fetches through Prisma or through other
  modules' `contract.server`, hands the facts to the pure core, maps rows to the shapes declared
  in `<domain>.types.ts`. Prisma types never cross the boundary; Portuguese labels are produced
  here, formatting (R$, %, dates) is not — the component formats with `shared/utils/format`.
- **Raw SQL** goes through `prismaClient.$queryRaw` with `Prisma.sql` / `Prisma.join` /
  `Prisma.empty`; windows are half-open (`>= start and < end`, `toWindow`), sums are cast
  (`::float8`, `::int`) and default with `coalesce`. One screen payload per tab, as a
  discriminated union on `aba`.
- **The clock is `PROTOTYPE_TODAY`** (`shared/config/prototype.ts`) and a pure function takes
  `today`/`now` as a parameter; `new Date()` inside a rule is the canonical violation.
- **Schema changes only through `prisma migrate dev`** — never a hand-written migration, never
  data in a migration. Models and fields are English camelCase mapped with `@map`/`@@map` to
  snake_case; enums SCREAMING_CASE. The seed (`prisma/seed.ts`, `seedAnalytics.ts`) imports
  fixtures only through contracts and stays deterministic (seeded RNG).
- `console.error` is the only console call allowed; use it for unexpected errors only.

## Client side (routes, components, hooks)

- **Route file = head() + loader + component.** `validateSearch` with the module's schema,
  `stripSearchParams(defaults)` so defaults leave the URL, `loaderDeps: ({ search }) => search`,
  `loader: ({ deps }) => getXScreen({ data: deps })`, `errorComponent` rendering
  `RequestError` with `router.invalidate()`. The root route owns the global period params and
  `retainSearchParams` them across navigation.
- **Search params are the state.** Tabs, filters, metric pickers and pages live in the URL; a
  module ships a `use<Domain>Search()` hook that reads them and patches with `navigate({ search:
(prev) => ({ ...prev, ...next }), replace: true })`. Component state is for what is not
  shareable: an open dialog, a draft being typed, a hovered row.
- **Writes** go through `useServerFn(postFn)` and end with `router.invalidate()`. A form with
  unsaved changes guards navigation with `useBlocker` + the confirm `Dialog` (see `CostForm`,
  `GoalsPlan`); a POST that mutates a table shows a Portuguese error string on failure.
- **Components render; hooks and loaders orchestrate; pure files compute.** A component may
  derive presentation (filter, sort, pick a label) but never owns business math; a rule found
  inline in a `.tsx` is moved to a `.ts` with a test.
- **Nothing at import time** in logic files: no env capture, no client construction, no
  `Date.now()` in a module-level constant. `shared/dependencies/` and `shared/config/` are the
  only places that read the environment.
- No `React.lazy` decisions are needed: Start splits routes itself. Never edit
  `src/routeTree.gen.ts` or `src/generated/`; keep `<Outlet />` in `AppShell`; do not simplify
  `src/server.ts` / `src/start.ts` — they wrap SSR errors deliberately.

## Testability

Enforced by ESLint — `max-lines` 600 (error), `max-lines-per-function` 50 in `.ts` / 150 in
`.tsx` (warn), `max-params` 5 (warn), `max-depth` 4 (warn) — plus these rules:

1. **Warning ratchet.** CI runs `lint --max-warnings <cap>`; the cap is today's count and only
   goes down. A change never adds a warning; when it removes one, lower the cap in the same
   commit. Never write a new function above the limit: extract the piece that has a name of its
   own (a validation, a filter builder, a row mapper) into a pure file with its test. Splitting a
   cohesive function only to quiet the linter is worse than the warning. Exempt: `*.test.ts`
   suites and route files (a table).
2. **Functional core, imperative shell.** Orchestrator fetches → pure function computes →
   orchestrator persists or renders. Business math never sits between two queries or inside
   JSX.
3. **Dependencies enter as parameters.** Data, `today`, cost rules, viewport values arrive
   through the signature; nothing is reached from inside via singleton, import or global.
4. **No hidden mutable module state.** No module-level caches or counters; state lives in the
   hook, the component or the request.
5. **One responsibility per function.** If describing it needs "and", it is several functions.
6. **Pure helpers are exported**, never closures inside a component or an unexported function
   that carries a rule.
7. **Mocking is a smell of shape.** More than one mock means the pure part was not extracted.
8. **Born tested.** Every new pure function ships with a colocated vitest file in the same
   commit. Orchestrators and components do not get unit tests of pure delegation; what covers
   them is the smoke test against the dev server (every tab and filter combination answers 200
   with sensible numbers) until an integration suite exists — so a decision found in an
   orchestrator is extracted, not left there.

## Code quality

1. **No comments in `src/`.** Names carry the what; the why that does not fit in a name goes to
   `specs/decisions/` or the commit body. The only comments that stay are the ones a tool reads
   (`eslint-disable`, `@ts-expect-error`, `prettier-ignore`). Existing docblocks are legacy:
   remove them from a file you touch, never add new ones.
2. **No `console.log` / `console.warn`** (lint error); `console.error` for unexpected errors.
3. **No `any`** — explicit types or `unknown` with a type guard (`err instanceof Error`).
4. **No barrel files** — direct imports everywhere; `contract.ts` / `contract.server.ts` are
   the one named exception, and they are hand-curated, not a sweep.
5. **Descriptive names**; boolean props and variables read as predicates (`includeFee`,
   `isFilled`).
6. **No magic strings** — see _Closed sets_ above.
7. Prefer `null` over `undefined` for an absent value (Prisma, JSON and the API agree); `as`
   only when inference is provably insufficient; `Partial` / `Pick` / `Omit` instead of a
   duplicated interface.

## Types and naming

- Exported types never live inside a component, controller or service: `<domain>.types.ts` in
  the module; `shared/models/types/` only when no domain owns them (`metric.types.ts`).
- Request schemas are `<domain>Schema.ts` (zod); the search-param type is inferred from it.
- Files: `PascalCase.tsx` only when the file's main export is a React component of that name;
  `camelCase` for everything else, including `.tsx` files that export column definitions
  (`adsColumns.tsx`, `productsColumns.tsx`). **Never kebab-case in our own code** — the only
  kebab names are the ones a tool fixed (`routeTree.gen.ts` is generated; markdown specs).
- Role suffixes: `*Controller.ts`, `*Service.ts`, `*ScreenService.ts` (the per-tab assembler
  when the service grows), `*Schema.ts`, `*.types.ts`, `*Fixture.ts`, `*Labels.ts`, `use*.ts`,
  `*.test.ts`; `contract.ts`, `contract.server.ts`.
- Named exports everywhere; a component's `Props` type stays in the component file.

## Design system (`src/shared/ui`, tokens in `src/shared/styles`)

Flat: one `Component.tsx` per component and a `component.types.ts` beside it when its types are
consumed elsewhere. The Dashboard is the canonical layout reference. Language: clean financial
analysis — light background, white cards with subtle borders, **one accent** (dark green
`--primary`), orange (`--warning`) only for warnings, `--destructive` for negatives, Manrope, big
legible numbers.

**Tokens are the law.** Every color, size, spacing, radius, shadow and breakpoint is declared
once and consumed as a utility or a TS token — a screen never declares one:

| What        | Where                                       | Use as                                                                                                                                         |
| ----------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Colors      | `global.css` `@theme` (`--color-*`)         | `bg-primary`, `text-muted-foreground`, `border-border`, `bg-warning-soft`, `bg-chart-1`; in recharts props `"var(--chart-1)"`, `"var(--grid)"` |
| Type scale  | 6 sizes, weights 400/600                    | `textClass.label/meta/body/cardTitle/sectionTitle/kpi` from `shared/styles/typography`, `textClass.numeric` on numbers                         |
| Spacing     | 4/8/12/16/24/32/48                          | Tailwind spacing utilities; screen rhythm via `layout.page/headerGap/blockStack/groupStack/cardPadding` from `shared/styles/spacing`           |
| Radius      | 8 card / 6 control / 4 badge                | `radiusClass.card/control/badge`                                                                                                               |
| Shadow      | sm rest / md hover / lg drawer              | `shadowClass.*`                                                                                                                                |
| Breakpoints | `sm 640 md 768 lg 1024 xl 1280 2xl 1536`    | never a new one                                                                                                                                |
| Formatting  | `shared/utils/format.ts`, `metricFormat.ts` | the only place numbers, currency, percent and dates are formatted (pt-BR, NBSP in `R$ 1.234`)                                                  |

Rules, in the order they bite:

- **No inline hex, no local size.** `bg-[#0f6e56]`, `text-[13px]` and a hand-picked breakpoint
  are forbidden in new code. Triage when you meet one: the token exists (grep `--color-` in
  `global.css`) → use it; the value repeats → promote it to a token in the same commit; a real
  one-off → keep it inline and say why in the commit.
- **Promote on duplication.** Before adding a `className` override, grep the codebase for the
  same value; a match means a variant or token, not a second override.
- **Fork ≠ override.** Duplicating a design-system component file is forbidden; passing
  `className` to tweak one instance is fine — every component accepts it for that.
- **Domain widget is not design system.** A chart, table or form only one module uses belongs
  to that module (`CreativePresence`, `RfmFilters`, `CostForm`). It moves to `shared/ui` the day
  a second module imports it — not before. `shared/ui` never imports `modules/` (lint).
- **Compose, do not bypass.** Screens are built from `PageHeader`, `PeriodSelector`,
  `ChannelToggle`, `TabBar`, `SegmentedControl`, `SectionBlock`, `MetricTileGroup` +
  `metricToTile`, `DataTable` (local or `remote` mode, CSV built in), the chart family
  (`TimeSeriesChart`, `DualSeriesChart`, `ComboChart`, `MultiSeriesChart`, `BarBreakdownChart`,
  `DonutBreakdown`, `TreemapChart`), `Badge`, `ProgressBar`, `Dialog`, `Button`, `Input`,
  `Select`, `MultiSelect`. Inline markup with tokens is allowed only where no component can wrap
  the design (a clickable card, a custom grid such as the goals planning table).
- **Icons: `lucide-react` only.** SVG for logos and illustrations; no other icon library.
- **Tooltips reveal what is not visible**: mandatory on an icon-only button (label = the
  `aria-label`), never on a button with visible text, never on a decorative icon.
- **Fidelity seal on every KPI** (`A`/`B`/`C` with a Portuguese note): a live metric says where
  its number comes from; see `specs/kpi-fidelity.md`.
- **Mobile.** Desktop is the reference. Below `sm` use `max-sm:` classes or mobile-first with a
  `sm:` that restores the desktop value; tables wider than the screen sit in `overflow-x-auto`
  or become cards below `md`; focusable fields keep a 16px font (Safari zoom); `100svh`, never
  `100vh`. Never edit a primitive for a one-screen adjustment.
- Every page starts with `layout.page`; blocks are separated by `layout.blockStack`; the header
  gap is `layout.headerGap`. Width is not configurable per page.

## File input

There is no upload in the product today (only CSV export). The day one appears, the seven
rules are the Arko ones, in this order and never inverted: rate limit → byte ceiling on both
ends (the front's never larger than the server's) → declared extension and mime → magic byte of
the content → parser contained (worker, memory and time cap). Nobody unzips a user's archive;
a size or type error answers JSON with 413/415/400 and a Portuguese message; limits are measured
(largest legitimate payload × 10), never guessed; when in doubt be permissive — an absent
`File.type` passes.

## Git

Commits are English, imperative, `<type>: <short description>` with `feat`, `fix`, `chore`,
`docs`, `style`, `refactor`, `test`; the body explains the why and the numbers that justified a
choice. One commit per finished task, checks green before each. Never mix a file move with a
logic change in the same commit. `main` is the working branch of this prototype; no force-push.

## Decision log

`specs/decisions/YYYY-MM-DD-short-title.md` with **Contexto / Decisão / Por quê / Alternativas
descartadas**. Record only when all four hold: it changes business, architecture, data or
security; a real alternative lost; the why is not visible in code + commit; someone would
re-open it in six months. Any "no" → do not record.

## Where to look

| Need                                    | File                                                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| The full architecture rulebook          | `specs/architecture.md`; the Arko dossier in `specs/reference/`                                          |
| A screen's behaviour and formulas       | `specs/<screen>.md` (`dashboard`, `orders`, `finance`, `products`, `customers`, `marketing`, `sections`) |
| The data-module roadmap and board       | `specs/data-module-plan.md`, `specs/data-module-tasks.md`                                                |
| Global period params and windows        | `src/shared/utils/period.ts`, `periodWindow.ts`                                                          |
| Metric shapes (`MetricValue`, `Series`) | `src/shared/models/types/metric.types.ts`, `shared/utils/metricFormat.ts`                                |
| The demo clock and client               | `src/shared/config/prototype.ts` (`PROTOTYPE_TODAY = 2026-09-10`)                                        |
| Design-system day-to-day rules          | `src/shared/ui/README.md`, `specs/design-system.md`                                                      |
