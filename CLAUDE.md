# CLAUDE.md — E-commerce Insights

E-commerce consulting SaaS ("E-commerce Insights"): many stores (tenants), three roles
(`ADMIN`, `CONSULTANT`, `CLIENT`), access by invitation — `specs/saas.md`.
**One repository, npm workspaces, four of them:**

| Workspace            | Package                | What it is                                                                                   |
| -------------------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| `apps/web`           | `@ecommerce/web`       | React 19 + TanStack Start (SSR) + Tailwind 4. Calls the API from its server functions (BFF). |
| `apps/api`           | `@ecommerce/api`       | Express 4 + Zod + Prisma 7. `/api/v1`, JWT. The backend the web and the mobile app share.    |
| `packages/contracts` | `@ecommerce/contracts` | Types, zod schemas, closed sets, labels, period and formatting helpers. Pure TypeScript.     |
| `packages/database`  | `@ecommerce/database`  | Prisma schema, migrations, seed + fixtures, generated client, `prismaClient` factory.        |

A React Native app (`apps/mobile`) will join later and import `packages/contracts`. This file
answers one question — how to write code in this repo. Product behaviour lives in `specs/`
(read the screen's spec before touching it); the backend plan in `specs/backend-plan.md`;
architecture decisions in `specs/decisions/`; the rules below derive from the Arko repos
(`specs/reference/`).

## Language rule (enforced)

- **Everything the user sees is Portuguese (pt-BR)**: rendered strings, labels, `aria-label`,
  `head()` meta, URLs (`/dinheiro`, `/metas`, `/entrar`), CSV headers, API error messages,
  copy stored in fixtures or the DB.
- **Everything else is English**: file and folder names, identifiers, types, props, data keys,
  API paths (`/api/v1/orders`), commit messages, specs and READMEs. An accented identifier is a
  lint error.
- Route files are English (`src/routes/money.tsx`), URLs are Portuguese: the map is
  `apps/web/src/routes.ts` (virtual file routes). Never rename a route file expecting the URL
  to follow.
- Closed-set values are English (`"ecommerce" | "marketplace"`, `"CONNECTED" | "ERROR"`);
  their Portuguese labels live in a `Record<Key, string>` next to the definition in
  `packages/contracts` (`channelLabel`, `costFrequencyLabel`, `influencerStatusLabel`).

## Commands (run at the root)

```sh
make ecom             # full setup + dev servers (env, deps, postgres, migrate, seed, dev)
npm run dev           # api on :3001 and web on :8080 (concurrently); one .env at the root
npm run typecheck     # every workspace
npm run lint          # root (scripts/) + every workspace; CI adds --max-warnings <cap>
npm run check:cycles  # web, api and contracts; CI adds --max-files 0
npm test              # vitest projects: web, api, contracts, database, scripts
npm run format:check  # prettier, one config at the root
npm run build         # web (Nitro output) + api (esbuild bundle in apps/api/dist)
npm run dev:worker -w apps/api   # the pg-boss worker alone (root `npm run dev` starts api + worker + web)
npm run db:migrate | db:seed | db:seed:dev | db:generate | db:studio | db:reset   # proxies to packages/database
# db:seed creates the admin only (ADMIN_EMAIL / ADMIN_PASSWORD); db:seed:dev adds "Loja Exemplo" for local work
```

**Definition of done for any change:** `typecheck`, `lint` (at or under the warning cap, per
workspace), `check:cycles -- --max-files 0`, `test`, `format:check` and `build`, all green,
plus a smoke test against the dev servers (the API with a bearer token, the web signed in).
`build` catches what `typecheck` misses (import protection, route tree, bundle), so it is not
optional.

## Architecture

**The folder is the business domain. The layer is the file.** The same module names exist on
both sides — `apps/web/src/modules/orders` (UI and BFF) and `apps/api/src/modules/orders`
(HTTP and service) — and the shapes they exchange live once, in `packages/contracts/src/orders`.

```
apps/web/src/
├── routes.ts, routes/          # composition root: one thin file per URL + __root.tsx (session guard)
├── modules/<domain>/           # <Domain>.tsx, other .tsx, use*.ts, <domain>Controller.ts (BFF), contract.ts
└── shared/                     # kernel: ui/, styles/, layout/, hooks/, utils/, dependencies/ (apiClient, session)
apps/api/src/
├── index.ts, app.ts            # boot + composition root: mounts every router behind requireAuth
├── modules/<domain>/           # <domain>Router.ts, <domain>Controller.ts, <domain>Service.ts, rules + tests, contract.ts
└── shared/                     # config/env.ts (zod), http/ (errors, validate, coerceQuery, asyncHandler, auth context)
packages/contracts/src/
├── <domain>/                   # <domain>.types.ts, <domain>Schema.ts, labels, closed sets, UI-facing rules + tests, contract.ts
└── shared/                     # period, periodWindow, metric.types, metricValue, format, metricFormat, clock, fidelity, apiError
packages/database/
├── prisma/                     # schema.prisma, migrations/, seed.ts, seedAnalytics.ts, fixtures/
└── src/                        # client.ts (prismaClient, Prisma), passwordHash.ts; generated/ (gitignored)
```

**Dependency direction between workspaces (lint-enforced):**

```
apps/web    → @ecommerce/contracts                       (never @ecommerce/database, never @prisma/*)
apps/api    → @ecommerce/contracts, @ecommerce/database
apps/mobile → @ecommerce/contracts
packages/*  → node_modules only; contracts has no React, no Prisma, no TanStack, no `@/` alias
```

**A module is a business capability, not an entity.** `orders`, `customers`, `money`,
`marketing`, `products`, `logistics`, `goals`, `dashboard`, `connections`, `assistant`,
`management`, `consulting`, `alerts` (API only), `analysis`, `influencers`, `auth`, `health`
(API only), `imports` (CSV ingestion), `store` (onboarding and settings), `admin` (staff
panel). If describing the module needs an "and", it is two modules — a sibling top-level
folder, never a subfolder (`MAX_MODULE_DEPTH = 0`). Which files go along is decided by the
direction of the dependency, not by the name.

### The three invariants

1. **Every module has a public door: `contract.ts`.** Hand-written `export { X } from "./x"`
   lists — never a barrel, never `export *`, never a speculative export. Anything outside the
   module imports from it and from nothing else (lint). In the web it publishes the page and
   the server functions; in the API the router factory and the service functions other API
   modules may call; in `contracts` the types, schemas, closed sets, labels and rules of the
   domain (`@ecommerce/contracts/<domain>` resolves to it).
2. **I/O only in the orchestrator.** Prisma is touched in `apps/api/**/*Service.ts` only. In
   the web, the API and the session are touched in `*Controller.ts` (the BFF) and in
   `shared/dependencies/`; never in a component, never in a pure core file. The clock is a
   parameter (`todayIso()` from `contracts/shared/clock`; the API reads `currentDay()` from
   `shared/config/clock`, which honours `DEMO_TODAY`; `now()` is injected into routers).
3. **Pure core in its own file, with a colocated test.** Every calculation, classification,
   parser or rule is a file that imports no infrastructure and is born with `foo.test.ts`
   beside it. Server-only rules live in the API module (`costEngine`, `rfmSegments`,
   `alertRules`); rules the UI also needs live in `contracts` (`marketingRules`,
   `goalDerivations`, `driverTrees`, `connectionsSummary`). Two pocket tests: if it needs
   `await` it is an orchestrator; if testing it needs a mock it is in the wrong place.

| Role (API)       | File                    | May import                                                                                      |
| ---------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| Composition root | `app.ts`, `index.ts`    | `@/modules/*/contract`, `@/shared/*`                                                            |
| Router           | `<domain>Router.ts`     | `./<domain>Controller`, `@/shared/http/*` (a factory: `createOrdersRouter(deps?)`)              |
| Controller       | `<domain>Controller.ts` | `./<domain>Service`, `@ecommerce/contracts/*`, `@/shared/http/*` (parse → call → `res.json`)    |
| Orchestrator     | `<domain>Service.ts`    | `@ecommerce/database/client`, `@ecommerce/database/enums`, own rules, other modules' `contract` |
| Pure core        | `<rule>.ts` + test      | `@ecommerce/contracts/*`, `@ecommerce/database/enums`, `date-fns`                               |

| Role (web)       | File                              | May import                                                                                      |
| ---------------- | --------------------------------- | ----------------------------------------------------------------------------------------------- |
| Composition root | `routes/<name>.tsx`, `__root.tsx` | `@/modules/*/contract`, `@ecommerce/contracts/*`, `@/shared/*`                                  |
| Entry            | `<Domain>.tsx`, other `.tsx`      | own module (`./x`), `@ecommerce/contracts/*`, `@/shared/ui`, `@/shared/hooks`, `@/shared/utils` |
| BFF              | `<domain>Controller.ts`           | `@/shared/dependencies/apiClient`, `@ecommerce/contracts/*` (`createServerFn` → `apiFetch`)     |
| Kernel           | `shared/**`                       | `shared`, `@ecommerce/contracts/shared/*` (+ `contracts/auth` for the session), node_modules    |

### The `shared/` rule

> **Has a domain owner? It stays in the owning module and comes out through its contract.
> Has none? It goes to `shared/` — of that workspace, or `contracts/shared` when both sides need it.**

The test, file by file: _to explain what this file does, do I have to name a domain?_ "The RFM
segment of a customer" → `customers`. "Formats a number as R$" → `contracts/shared/format.ts`.
"Reads the bearer token from the session" → `apps/web/src/shared/dependencies`. A second
consumer never moves a file up; a domain type in a `shared/` folder is the anti-pattern. The
web's `shared/ui` prop types (`Section`, `Metric`, `Recommendation`) are the UI's own and stay
structurally identical to the wire shapes in `contracts/consulting` — do not merge them.

### Contracts: what crosses the wire, declared once

- `packages/contracts/src/<domain>/` holds `<domain>.types.ts` (the API response shapes),
  `<domain>Schema.ts` (zod for query strings and bodies; the search-param type is inferred),
  labels/taxonomies and UI-facing rules. Every consumer — web BFF, web components, API
  controllers, the mobile app — imports the same file.
- **Closed sets** are `as const` tuples with their Portuguese label map, declared in the owning
  domain (`costSets.ts`, `influencerStatuses`, `dataSourceStatuses`, `pillarStatuses`,
  `fidelities`, `userRoles`); zod reads the same tuple (`z.enum(costFrequencies)`). The API
  keeps importing the Prisma enum and an `enumParity.test.ts` per module asserts
  `Object.values(PrismaEnum)` equals the tuple — a new enum value fails a test instead of
  drifting. Prisma enums are never redeclared anywhere else.
- Numbers, never formatted strings, cross the wire; Portuguese labels where the service already
  produced them. Formatting (R$, %, dates) happens in the component with
  `contracts/shared/format` and `metricFormat`.
- API errors are `{ message }` or `{ message, errors: { field: [msg] } }` with 400 / 401 /
  403 / 404 / 422 / 500 (`contracts/shared/apiError.ts`); the web's `ApiRequestError` carries
  the body; a form shows `message` and maps `errors` to fields.

### Cycles: forbidden by tooling, not by construction

Cross-module edges are allowed (through contracts); cycles are not. `npm run check:cycles`
builds each workspace's import graph with dependency-cruiser and counts the **files inside a
cyclic component** (Tarjan, `scripts/cyclicFiles.ts`); CI caps it at **0**. How to break a
cycle, in order:

1. `import type` — removes the edge from the build, not from the ratchet.
2. **The consumer declares the shape it needs and the composition root injects it.** House
   pattern: `AppShell` takes `assistant`/`account` slots filled by `__root.tsx`; `app.ts`
   hands `marketingCostLines` (money) and `retentionSummary` (customers) to
   `createMarketingRouter`, because money and customers already depend on marketing.
3. Move the file to the module that owns it.
4. `shared/` (or `contracts/shared`) — only if the file names no domain.

API routers are factories (`createXRouter()`), never a `Router()` built at module load, so
module load order cannot form a runtime cycle either.

### Server-only guarantee

- **The web never touches the database.** Lint forbids `@ecommerce/database` and `@prisma/*`
  in `apps/web`; `vite.config.ts` `importProtection` fails the build when
  `shared/dependencies/**` (the API client, the session) lands in the client bundle. A
  controller's handler runs on the web server only; the browser gets an RPC stub.
- **The API is the only reader of `DATABASE_URL`**, through `packages/database`. Env is read
  once, validated with zod (`shared/config/env.ts`); nothing else touches `process.env`.
- Tokens never reach the browser: the web keeps them in a sealed httpOnly cookie
  (`ecommerce_session`) and adds the bearer header server-side.

## API side (`apps/api`)

- **Router = wiring.** `createXRouter(deps)` mounts paths on a fresh `Router()` with
  `asyncHandler(controller.method)`. Paths are English, one endpoint per screen payload
  (`GET /orders?aba=…`), writes are `POST` / `PUT /:id` / `DELETE /:id`
  (`specs/backend-plan.md` has the table). Reads answer 200, creates 201, deletes 204.
- **Every data endpoint works on the active store.** `requireAuth` puts the principal
  (`{ userId, role }`) on the request; `resolveClient` reads `x-client-id`, checks the role's
  access (`storeAccess.ts`) and sets `req.auth.clientId`. Services take `clientId` and never
  see roles; controllers that write the consulting layer check `role !== "CLIENT"`. Routes
  without a store (auth, `/me`, `/admin`, `POST /stores`) are mounted before `resolveClient`.
- **Controller = transport.** `authOf(req)` for the client, `screenQuery(req, schema)` for
  the global period + the screen's zod schema (`coerceQuery` turns query strings into the
  numbers, booleans, arrays and nulls the schema expects), `parseOrThrow(schema, req.body)`
  for bodies; then the service, then `res.json`. Nothing else lives there.
- **Service = orchestrator.** Takes `clientId` (from the token, never a slug), fetches through
  Prisma or other modules' `contract`, hands the facts to the pure core, maps rows to the
  `contracts` shapes. Prisma types never cross the boundary.
- **Raw SQL** goes through `prismaClient.$queryRaw` with `Prisma.sql` / `Prisma.join`;
  windows are half-open (`>= start and < end`, `toWindow`), sums are cast (`::float8`,
  `::int`) and default with `coalesce`.
- **Auth.** `POST /auth/login` (rate-limited) returns `{ user, tokens }`; access token HS256
  15 min, refresh token 30 days rotated on use and stored as sha256 (reuse → 401);
  `GET /me`; `requireAuth` sets `req.auth = { userId, clientId, role }`. Passwords are scrypt
  via `@ecommerce/database/passwordHash` (shared with the seed). Invitations and password
  resets are opaque tokens (`newOpaqueToken` / `hashToken`, sha256 stored, expiry per use)
  sent by e-mail — see `specs/saas.md`.
- **Mail is a dependency.** `shared/mail/createMailer(env, now)` returns SMTP (nodemailer,
  `SMTP_URL`) or the development file outbox; `app.ts` injects `mailer` and `appUrl` into
  the routers that send. Templates are pure functions (`authMail.ts`, tested); a service
  never builds a transport.
- **Writes take the actor and record activity.** A service that mutates receives the
  `AuthContext` (or the `Principal`) and calls `recordActivity(actor, clientId, detail)` from
  `@/modules/audit/contract` after the write; the detail is one member of `AuditDetail`
  (`audit.types.ts`) and the sentence comes from the pure `auditSummary` — a new action means
  a new tuple entry in `contracts/audit`, a detail variant and a summary line, in that order.
  Recording never throws.
- **Connectors are providers behind one framework.** A platform integration is a
  `ConnectorProvider` (`modules/connectors/<platform>Provider.ts`: `authorizeUrl`,
  `exchangeCode`, `refresh?`, `describeSettings?`, `backfill`, `sync`) plus a pure
  `<platform>Orders.ts` / `<platform>Rows.ts` mapper with its test; it is registered in
  `providerRegistry.ts` only when its env credentials exist, and the API flips the
  catalog's availability to `oauth` for registered providers — the web needs no
  per-environment knowledge. A provider never touches Prisma: it receives a `SyncContext`
  (`saveRaw`, `readRaw`, `listRaw`, `writeOrders`, `writeAdSpend`, `writeTraffic`, the
  cursor and the settings) and returns the new cursor. Credentials are sealed with the vault
  and only opened inside the worker. The client connects alone: a new connector needs its
  `requirements` (and `domainHint`) in the catalog, and a provider that offers several
  accounts seeds `settings.accountId = null` so the flow asks for the choice before syncing. Test a provider against a local stub of the platform
  (`*_stub.mjs` in the scratchpad) by pointing its `*_URL` env at it.
- **Imports are undoable.** Whatever writes rows for a CSV import records what it touched in
  the `UndoRecorder` (created → `previous = null`, replaced → snapshot) so
  `POST /imports/:id/undo` can restore it; a new kind of imported row needs its entity in
  `importUndo.types.ts` and its branch in `undoPlan.ts` / `importsUndoService.ts`. See
  `specs/imports.md` for the LIFO rule.
- **Errors** are thrown (`HttpError`, `ValidationError`, `unauthorized()`, `notFound()`) and
  rendered by `errorHandler`; unexpected ones are logged with `console.error` and answered
  500 with a Portuguese message. `console.log` only in `index.ts`.
- **Schema changes only through `npm run db:migrate`** (`prisma migrate dev`) — never a
  hand-written migration, never data in a migration. Models and fields are English camelCase
  mapped to snake_case; enums SCREAMING_CASE. The seed imports the fixtures in
  `packages/database/prisma/fixtures/` (typed by `fixture.types.ts`, never an app file) and
  stays deterministic (seeded RNG).

## Web side (`apps/web`)

- **Route file = head() + loader + component.** `validateSearch` with the schema from
  `@ecommerce/contracts/<domain>`, `loaderDeps: ({ search }) => search`,
  `loader: ({ deps }) => getXScreen({ data: deps })`, `errorComponent` rendering
  `RequestError` with `router.invalidate()`. The root route owns the global period params
  (retained across navigation, defaults stripped by `stripPeriodDefaults`) and guards every
  navigation in `beforeLoad` — never in a loader, which would race the children: no session →
  `/entrar`; no active store → `/configurar-loja` (client) or `/admin` (staff); clients never
  reach `/admin`. The session state (user, stores, active store) travels in the route
  context; the loader only fetches the shell status.
- **Session and active store.** `shared/dependencies/session.ts` keeps tokens, the user, the
  active store and a refresh stamp; `apiFetch` sends `x-client-id`; the user's store list is
  refreshed from `/me` when stale. After sign-up or onboarding, navigate with
  `window.location.assign` so every cache starts from the new session.
- **Controller = BFF.** `createServerFn({ method }).validator(schema).handler(({ data }) =>
apiFetch<Shape>("/path", { query | body }))`. Same names and signatures the components
  already call through `useServerFn`. `apiFetch` adds the bearer token from the session,
  refreshes once on 401 and throws `redirect({ to: "/entrar" })` when the session is gone; an
  API error becomes `ApiRequestError` (status + body) — handle it in the hook that called it.
- **Search params are the state.** Tabs, filters, metric pickers and pages live in the URL; a
  module ships a `use<Domain>Search()` hook that patches with `navigate({ search: (prev) =>
({ ...prev, ...next }), replace: true })`. Component state is for what is not shareable.
- **Writes** go through `useServerFn(postFn)` and end with `router.invalidate()`. A form with
  unsaved changes guards navigation with `useBlocker` + the confirm `Dialog` (`CostForm`,
  `GoalsPlan`, `InfluencerForm`); a failed POST shows a Portuguese string.
- **Components render; hooks and loaders orchestrate; pure files compute.** A rule found inline
  in a `.tsx` moves to `contracts` (if the API needs it too) or to a `.ts` beside it, with a
  test.
- **Consulting layer.** Area screens render `ConsultingSection` through
  `consulting/consultingUi.ts` (live KPIs via `metricToTile`, manual KPIs as the consultant's
  text, "—" with a C seal when empty) and pass `pillarActionOf(section)` so staff get the
  `PillarEditor`; the dashboard shows the `MilestoneEditor` for staff. No copy about a store
  lives in code: titles come from `contracts/consulting/engagementTemplate.ts`, values from
  the API.
- **Empty stores are normal.** A new tenant has no orders: every screen must render with
  zeros, "—" and the DataTable empty message, never a blank chart or a 500.
- Never edit `src/routeTree.gen.ts`; keep `<Outlet />` in `AppShell`; do not simplify
  `src/server.ts` / `src/start.ts`. Adding a route means adding it to `src/routes.ts` and
  restarting the dev server so the tree regenerates (a running server keeps a stale copy of
  `routes.ts` and overwrites the tree).

## Testability

Enforced by ESLint in every workspace — `max-lines` 600 (error), `max-lines-per-function` 50
in `.ts` / 150 in `.tsx` (warn), `max-params` 5 (warn), `max-depth` 4 (warn) — plus:

1. **Warning ratchet.** CI runs `lint --max-warnings <cap>` and every workspace must respect
   it; the cap is today's count and only goes down. A change never adds a warning; when it
   removes one, lower the cap in `.github/workflows/ci.yml` in the same commit. Never write a
   new function above the limit: extract the piece that has a name of its own into a pure file
   with its test. Exempt: `*.test.ts` and route files.
2. **Functional core, imperative shell.** Orchestrator fetches → pure function computes →
   orchestrator persists or renders. Business math never sits between two queries or in JSX.
3. **Dependencies enter as parameters.** Data, `today`/`now`, cost rules, the secret, viewport
   values arrive through the signature; nothing is reached via singleton, import or global.
4. **No hidden mutable module state.** No module-level caches or counters.
5. **One responsibility per function.** If describing it needs "and", it is several.
6. **Pure helpers are exported**, never closures inside a component or an unexported function
   that carries a rule.
7. **Mocking is a smell of shape.** More than one mock means the pure part was not extracted.
8. **Born tested.** Every new pure function ships with a colocated vitest file in the same
   commit. Orchestrators, controllers and components are covered by the smoke test against the
   dev servers (every endpoint 200 with a bearer, every screen signed in, the write paths) until
   an integration suite exists.

## Code quality

1. **No comments in `src/`.** Names carry the what; the why goes to `specs/decisions/` or the
   commit body. Only tool-read comments stay (`eslint-disable`, `@ts-expect-error`).
   Existing docblocks are legacy: remove them from a file you touch, never add new ones.
2. **No `console.log` / `console.warn`** (lint); `console.error` for unexpected errors; the
   API's `index.ts` boot line is the one exception.
3. **No `any`** — explicit types or `unknown` with a type guard.
4. **No barrel files** — `contract.ts` is the one named exception, hand-curated.
5. **Descriptive names**; booleans read as predicates (`includeFee`, `hasError`).
6. **No magic strings** — see _Contracts_ above; API paths are literals in one place, the
   router.
7. Prefer `null` over `undefined` for an absent value (Prisma, JSON and the API agree); `as`
   only when inference is provably insufficient; `Partial` / `Pick` / `Omit` over duplicated
   interfaces.

## Types and naming

- Exported types never live inside a component, controller or service: `<domain>.types.ts` in
  `contracts` when they cross the wire, in the module when they do not (`ShellStatus`,
  `AuthContext`).
- Request schemas are `<domain>Schema.ts` (zod) in `contracts`.
- Files: `PascalCase.tsx` only when the main export is a React component; `camelCase` for
  everything else. Never kebab-case in our own code.
- Role suffixes: `*Router.ts`, `*Controller.ts`, `*Service.ts`, `*ScreenService.ts`,
  `*Schema.ts`, `*.types.ts`, `*Fixture.ts` (seed input only), `*Labels.ts`, `*Sets.ts`
  (closed sets), `enumParity.test.ts`, `use*.ts`, `*.test.ts`; `contract.ts`.
- Named exports everywhere; a component's `Props` type stays in the component file.

## Design system (`apps/web/src/shared/ui`, tokens in `apps/web/src/shared/styles`)

Flat: one `Component.tsx` per component and a `component.types.ts` beside it when its types
are consumed elsewhere. The Dashboard is the canonical layout reference. Language: clean
financial analysis — light background, white cards with subtle borders, **one accent** (dark
green `--primary`), orange (`--warning`) only for warnings, `--destructive` for negatives,
Manrope, big legible numbers.

**Tokens are the law.** Every color, size, spacing, radius, shadow and breakpoint is declared
once and consumed as a utility or a TS token — a screen never declares one:

| What        | Where                                        | Use as                                                                                                                                         |
| ----------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Colors      | `global.css` `@theme` (`--color-*`)          | `bg-primary`, `text-muted-foreground`, `border-border`, `bg-warning-soft`, `bg-chart-1`; in recharts props `"var(--chart-1)"`, `"var(--grid)"` |
| Type scale  | 6 sizes, weights 400/600                     | `textClass.label/meta/body/cardTitle/sectionTitle/kpi` from `shared/styles/typography`, `textClass.numeric` on numbers                         |
| Spacing     | 4/8/12/16/24/32/48                           | Tailwind spacing utilities; screen rhythm via `layout.page/headerGap/blockStack/groupStack/cardPadding` from `shared/styles/spacing`           |
| Radius      | 8 card / 6 control / 4 badge                 | `radiusClass.card/control/badge`                                                                                                               |
| Shadow      | sm rest / md hover / lg drawer               | `shadowClass.*`                                                                                                                                |
| Breakpoints | `sm 640 md 768 lg 1024 xl 1280 2xl 1536`     | never a new one                                                                                                                                |
| Formatting  | `contracts/shared/format.ts`, `metricFormat` | the only place numbers, currency, percent and dates are formatted (pt-BR, NBSP in `R$ 1.234`)                                                  |

Rules, in the order they bite:

- **No inline hex, no local size.** `bg-[#0f6e56]`, `text-[13px]` and a hand-picked breakpoint
  are forbidden in new code. Triage when you meet one: the token exists → use it; the value
  repeats → promote it to a token in the same commit; a real one-off → keep it inline and say
  why in the commit.
- **Promote on duplication.** Before adding a `className` override, grep for the same value; a
  match means a variant or token, not a second override.
- **Fork ≠ override.** Duplicating a design-system component is forbidden; passing `className`
  to tweak one instance is fine.
- **Domain widget is not design system.** A chart, table or form only one module uses belongs
  to that module. It moves to `shared/ui` the day a second module imports it (`FormField` did)
  — not before. `shared/ui` never imports `modules/` or a contracts domain (lint).
- **Compose, do not bypass.** Screens are built from `PageHeader`, `PeriodSelector`,
  `ChannelToggle`, `TabBar`, `SegmentedControl`, `SectionBlock`, `MetricTileGroup` +
  `metricToTile`, `DataTable`, the chart family, `Badge`, `ProgressBar`, `Dialog`, `Button`,
  `Input`, `Select`, `MultiSelect`, `FormField`. Inline markup with tokens only where no
  component can wrap the design.
- **Icons: `lucide-react` only.** Tooltips reveal what is not visible: mandatory on an icon-only
  button (label = the `aria-label`), never on a button with visible text.
- **Fidelity seal on every KPI** (`A`/`B`/`C` with a Portuguese note); see
  `specs/kpi-fidelity.md`.
- **Mobile.** Desktop is the reference. Below `sm` use `max-sm:` classes; tables wider than the
  screen sit in `overflow-x-auto` or become cards below `md`; focusable fields keep a 16px font;
  `100svh`, never `100vh`. Never edit a primitive for a one-screen adjustment.
- Every page starts with `layout.page`; blocks are separated by `layout.blockStack`.

## File input

The one upload is the CSV import on Conexões (`apps/api/src/modules/imports`,
`specs/imports.md`). Any new upload copies its pipeline, in this order and never inverted:
rate limit → byte ceiling on both ends (`IMPORT_MAX_BYTES` in contracts; the web's never
larger than the server's) → declared extension and mime (`uploadRules.ts`) → content check
(NUL bytes, decodable text, expected header — CSV has no magic byte, so this is it) → parser
contained (row cap + time budget today; a worker thread when `.xlsx` or bigger files arrive,
see `decisions/2026-09-13-csv-import-without-worker.md`). Nobody unzips a user's archive; a
size or type error answers JSON with 413/415/400/422 and a Portuguese message; limits are
measured (largest legitimate export × 10), never guessed; when in doubt be permissive — an
absent `File.type` passes. The web validates to answer fast (`importFile.ts`); the API is
what protects.

## Git

Commits are English, imperative, `<type>(<scope>)?: <short description>` with `feat`, `fix`,
`chore`, `docs`, `style`, `refactor`, `test`; scope is `web`, `api`, `contracts`, `database`
when the change is confined to one workspace. The body explains the why and the numbers that
justified a choice. One commit per finished task, checks green before each. Never mix a file
move with a logic change in the same commit. `main` is the working branch; no force-push.

## Decision log

`specs/decisions/YYYY-MM-DD-short-title.md` with **Contexto / Decisão / Por quê / Alternativas
descartadas**. Record only when all four hold: it changes business, architecture, data or
security; a real alternative lost; the why is not visible in code + commit; someone would
re-open it in six months.

## Where to look

| Need                                    | File                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| The backend plan, the endpoint table    | `specs/backend-plan.md`, board in `specs/backend-tasks.md`                                                               |
| The full architecture rulebook          | `specs/architecture.md`; the Arko dossier in `specs/reference/`                                                          |
| A screen's behaviour and formulas       | `specs/<screen>.md` (`dashboard`, `orders`, `finance`, `products`, `customers`, `marketing`, `sections`)                 |
| Global period params and windows        | `packages/contracts/src/shared/period.ts`, `periodWindow.ts`                                                             |
| Metric shapes (`MetricValue`, `Series`) | `packages/contracts/src/shared/metric.types.ts`, `metricValue.ts`, `metricFormat.ts`                                     |
| The clock                               | `packages/contracts/src/shared/clock.ts` (`todayIso`), `apps/api/src/shared/config/clock.ts` (`DEMO_TODAY`)              |
| Tenancy, roles, invitations, connectors | `specs/saas.md`, `apps/api/src/modules/{auth,store,admin,connections}`, `packages/contracts/src/{connectors,consulting}` |
| Auth, session, API client               | `apps/api/src/modules/auth`, `apps/web/src/shared/dependencies/`, `apps/web/src/modules/auth`                            |
| CSV import pipeline and templates       | `specs/imports.md`, `apps/api/src/modules/imports`, `packages/contracts/src/imports`                                     |
| The platforms' APIs (auth, endpoints)   | `docs/apis/<platform>.md` — one sheet per connector, Guru and ZapSign; `specs/connectors-plan.md`                        |
| Deploy (Vercel web, Railway api/worker) | `docs/deploy.md`, `apps/api/Dockerfile`, `apps/api/railway*.json`, `apps/web/vercel.json`                                |
| Design-system day-to-day rules          | `apps/web/src/shared/ui/README.md`, `specs/design-system.md`                                                             |
