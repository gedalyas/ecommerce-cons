# Arko Backend — Specific Rules

## Magic Strings & Enums

Use enums for **domain values**: statuses, types, categories, roles, modes — any closed set with
business meaning, especially when repeated. They live in the module that owns the concept and
come out through its `contract.ts`; only an enum with **no** domain owner goes to
`src/shared/models/enums/`. Consumer count is irrelevant — two modules using an enum does not
move it to `shared/`, it just means the owner publishes it. Inline string unions (`'a' | 'b'`) for domain values count as magic strings —
promote them to an enum before using them. Not every literal is a magic string: technical keys
(sort fields like `'date' | 'createdAt'`, request parts like `'query' | 'body'`, external SDK
contracts) stay as literals. Enforcement: type signatures and comparisons with the enum, so a raw
literal fails `tsc` — the CI already runs typecheck/build, and review is the backstop for the
judgment calls a linter cannot make. There is no reliable ESLint rule for this; don't add one.

In this repo: domain-value enums (status, type, role, category — any closed, meaningful set) live in the module that owns the concept and come out through its `contract.ts`; only an enum with no domain owner goes to `src/shared/models/enums/`. Prisma enums are imported from `@prisma/client`, never redeclared. If an enum already exists for a value, use it — never compare against the raw literal. Technical keys (sort fields, request parts, SDK contracts) are not domain values and stay as literals. Guard: type signatures and comparisons with the enum so a raw literal fails `tsc` (the CI build already runs it); review is the backstop. There is no reliable ESLint rule for this — don't add one.

## Architecture

**The folder is the business domain. The layer is the file.** A file either belongs to a
domain (`src/modules/<domain>/`) or belongs to none (`src/shared/`). There is no third option.
This convention is identical in all six Arko repos and in the future mobile app — no exception
by size, stack or age. A project with one domain gets one module.

```
src/
├── modules/<domain>/   # task/, client/, meeting/ — one business capability each
├── shared/             # what has no domain owner
└── <bootstrap>
```

**A module is a business capability, not an entity.** `refund`, `insurance`, `spreadsheet` are
capabilities; `client` is an entity — and a module named after a central entity becomes a magnet
(in a CRM everything "has to do with the client"), so it inflates on its own. There is no
file-count limit: thirty cohesive files are fine, eight incohesive ones are not.

> **If describing the module in one sentence needs an "and", it is more than one module.**

"client: keeps the client record **and** bulk spreadsheet **and** distribution across consultants
**and** sync with the Arko app" — four "and", four modules. When splitting, create a sibling
top-level module, never a subfolder (`client/spreadsheet/`): a subfolder adds a third level and
the question of who the public door is.

**Which files go along: the direction of the dependency, not the name.**

> **If moving the file forces the new module to import back from the origin module, the file was
> already in the right place.**

It is the "and" test applied to the edge instead of the folder. Corollary: **a mirrored split does
not move the same set in both repos.** Symmetry between repos is a result, not a criterion — the
criterion is the edge, and it differs on each side.

**Same domain name across repos when the concept exists in both:** `client`, `task`, `meeting`,
`demand`, `contract`, `insurance`, `objective`, `goal`, `transaction`, `investment`, `budget`,
`user`, `auth`, `spreadsheet`, `arkoApp`, `assignment`. Singular, English,
business term. `admin` and `external` are **not** domains — they are audience and entrypoint;
those files belong to the real domain. A module is created where the capability has files —
never mirrored for symmetry.

### The three invariants

Identical in backend, web and the future mobile app. They are what makes the shared folder rule
worth anything.

#### 1. Every module has a public door

The public door is **one file**: `modules/<domain>/contract.ts`. Anything outside the module
imports from it and from nothing else — the rest is internal and can be reorganised freely.
The file holds no logic, only hand-written `export ... from './file'` lines, and costs nothing at
runtime: `export from` disappears at build time and the import resolves straight to the original.

**It is not a barrel.** A barrel is an `index.ts` that re-exports a whole directory by sweep. Here
the list is written by hand, every line is a deliberate act, and what is not in the contract is
private. `index.ts` re-export files remain forbidden (**Code Quality** #4); `contract.ts` is the
named exception, and the only one.
The backend contract re-exports the `*Service`, the router (for `index.ts`) and any
type/enum/pure function that crosses the boundary.

```ts
// modules/client/contract.ts
export { ClientService } from "./clientService";
export { default as clientRouter } from "./clientRouter";
export { determineClientContractStatus } from "./clientContractStatusResolver";
export type { ClientBoardSortBy } from "./clientBoard.types";
```

```ts
// modules/spreadsheet/adminClientsSpreadsheetService.ts
import { determineClientContractStatus, type ClientBoardSortBy } from "../client/contract";
```

Reference implementation: `tools_backend/src/modules/diagnosis/contract.ts`.

**A router only mounts what its own module declares.** A router does its work at import time —
`router.get('/x', handler)` runs on load — so a handler, schema or middleware imported from
another module's contract inside an import cycle arrives `undefined`, and the boot dies with
`Route.get() requires a callback function`: CommonJS resolves a cycle by handing back a
partially initialized module. Who owns a handler is decided by the edge test above, never by
the URL prefix. When a route's handler legitimately belongs to another module, the mount moves,
not the handler: the owner publishes its own router through its contract and `index.ts`
composes by prefix — Express mounts any number of routers on the same path.

```ts
// index.ts — the composition root: the only file that knows every module
app.use("/api/clients", clientRouter); // from client/contract
app.use("/api/clients", clientInvestmentsRouter); // from investment/contract
```

Every mount is self-sufficient: either the router applies its own auth middleware, or the mount
declares it (`app.use(prefix, access, router)`) — never assume a sibling router on the same
prefix ran one before it. The one cross-module import a router may
consume at import time is `auth`'s middleware — a tolerance that holds only while `auth`
imports no other module. The hazard is not exclusive to routers: a schema passed to
`validateForm` or an enum read into a top-level config object is consumed at import time too
and follows the same rule — the value moves to its real owner. Imports referenced only inside
function bodies resolve at request time and are safe even inside a cycle. Guard:
`scripts/checkModuleLoadOrder.ts` (`npm run check:module-load-order`, after `npm run build`)
requires every `modules/*/contract` in a clean process and fails on any `undefined` export.
**Reference implementation: `crm_backend`** — copy it when turning the guard on in another repo.

**The contract publishes `createXRouter()`, not a built router.** Mounting a route is work done
at import time, so a module that publishes a ready-made router runs that work the moment anything
touches its contract — and inside a cycle the handler is still `undefined` when it does. A factory
runs nothing on load: the composition root calls it once, when every module has finished loading.
It is what lets _any_ file be an entry point (a test importing a controller, a script importing a
service), not just the contract.

```ts
// modules/user/userRouter.ts
export const createUserRouter = (): Router => {
  const router = Router();
  router.get("/", authenticateRoles(ADMIN_BACKOFFICE), listUsers);
  return router;
};

// modules/user/contract.ts
export { createUserRouter } from "./userRouter";

// index.ts
app.use("/api/users", createUserRouter());
```

Guard: `scripts/checkModuleLoadOrder.ts` (`npm run check:module-load-order`, after
`npm run build`) requires **every** compiled file under `dist/modules` in a clean process and
fails on a load error or an `undefined` export. Import a type with `import type` — the
`consistent-type-imports` rule enforces it — and the edge disappears from the build entirely,
which is the cheapest way to thin the graph.

#### 2. I/O only in the orchestrator

Prisma, `fetch`, SMTP, Slack, LLM: only in `*Service`. Never in a controller, never in a pure
core file.

#### 3. Pure core in its own file, with a colocated test

Every business rule, calculation, parser, validator or guard lives in a file that imports no
infrastructure, and is born with `foo.test.ts` beside it.

| Role         | File                   | Does what                                    |
| ------------ | ---------------------- | -------------------------------------------- |
| Entry        | `taskController.ts`    | translates HTTP                              |
| Orchestrator | `taskService.ts`       | fetches, saves, notifies — touches the world |
| **Core**     | `taskSummaryCounts.ts` | decides, calculates, transforms, validates   |

Files without the `Service` suffix (`*Guard`, `*Resolver`, `*Builder`, `*Calculations`,
`*Parser`) import no infrastructure and ship with a test. The suffix is what tells you whether
the file needs one.

Two shapes are exempt from `max-lines-per-function`, and only these two: a `*Router.ts` factory
body, which is a route table — a declarative list, one line per route, that names nothing when
split — and a `*.test.ts` file, where a long `describe` is a suite and each `it` is already the
isolated unit. Everywhere else the warning stands, and the fix is to extract the piece that has
a name of its own (a validation, a filter builder, a payload assembly), which lands in a pure
core file with its test beside it. Splitting a cohesive function just to quiet the linter is
worse than the warning: **the CI ceiling only ever goes down.**

**Two pocket tests for what counts as core:** if it needs `await`, it is an orchestrator; if
testing it requires a mock, it is in the wrong place — core is tested with literal values. When a
calculation needs more data mid-way, the orchestrator fetches everything first and passes it as a
parameter (**Testability** #3). The core never fetches on its own.

### Domain types do not go up to `shared/` — they come out through the contract

**Decided 2026-08-27**, after the previous rule ("if two modules need the same rule, it goes up
to `shared/`") was questioned and researched.

> **Has a domain owner? It stays in the owning module and is published by its `contract.ts`.
> Has none? It goes to `shared/`.**

`ClientBoardSortBy` belongs to `client` even though `spreadsheet` reads it; `formatCurrencyPtBr`
belongs to nobody. The first comes out through the contract, the second lives in `shared/`.

Pushing domain types up to `shared/` produces a star graph where a cycle between modules is
impossible — that is the real advantage of the old rule, and why it existed. The price is that
`shared/` becomes a domain dump: the modules turn into shells and the spaghetti comes back with
a nicer folder name. That is the _shared folder anti-pattern_, a known and named failure mode of
this style of architecture.

**The market answer to module cycles is not flattening the graph, it is the ADP** (Acyclic
Dependencies Principle): the cycle is forbidden by tooling, not by construction. The same pattern
appears in every language that reached scale — _published interface_ / _module public API_:

| Where                 | How it shows up                                                                     |
| --------------------- | ----------------------------------------------------------------------------------- |
| Nx                    | `index.ts` as the lib's public API + `enforce-module-boundaries` barring deep paths |
| Feature-Sliced Design | "Public API" rule per slice, and `@x` for cross-slice imports                       |
| Java 9+               | `module-info.java` with `exports`                                                   |
| Rust                  | private `mod` + `pub use` re-exporting the surface                                  |
| Go                    | `internal/` package — the compiler bars anyone outside                              |
| .NET                  | `internal` + `InternalsVisibleTo`                                                   |

It scales because the gain is proportional to size: with 5 modules it is ceremony, with 28 it is
what keeps a refactor local — changing the inside of `client` stops being a bet on who out there
will break.

**The two ways this rots, both real:**

1. **Without enforcement it is theatre.** If the deep path still compiles, someone imports it that
   way on a Friday. The lint rule ships with the pattern, not after it.
2. **The contract turning into a barrel.** The way it dies is exporting "just in case" until
   `contract.ts` lists the whole module. Antidote: only what has a consumer **today** goes in, and
   it comes out when the last consumer disappears — same rule as `shared/`.

### The `shared/` rule

Condition 1 is the rule. Condition 2 is only a guard against speculation:

1. **No domain owner** — decisive. If some module owns the concept, the file is that module's and
   comes out through its `contract.ts`. A second consumer does not transfer ownership.
2. **Something outside the file already uses it** — never share speculatively. "Something" means
   any consumer: another module, the bootstrap (`index.ts`, `App.tsx`), or another `shared/` file.
   It is not a second-owner test. In a repo with a single module no file can ever have two module
   consumers, so there condition 1 governs alone; and a design-system primitive used only by
   another primitive, or a shell file used only by the bootstrap, still belongs in `shared/`.

The test that separates the two cases, file by file:

> **To explain what this file does, do I have to name a domain?**
> Yes ("it is the contract status **of the client**") → owning module, out through the contract.
> No ("formats a number as R$") → `shared/`.

`shared/` is the _shared kernel_: small, stable and deliberately boring. Nothing in it knows what
a client, a policy or a meeting is. Health metric: a module migration that produces many new
`shared/` files has failed.

### Against erosion

Documented architecture rots; verified architecture does not. The invariants are checked by
ESLint `no-restricted-imports` — **no new dependency** — with `severity: error`:

| Rule                        | What it bars                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `moduleExposesOnlyContract` | importing `modules/<x>/<anything>` that is not `modules/<x>/contract`                                                         |
| `insideModuleIsRelative`    | `@/modules/<x>/<file>` from anywhere — inside the module the import is relative, and no alias reaches another module's inside |
| `crossingUsesAlias`         | a relative import that leaves the module (`../`, by subfolder depth) — crossing the boundary is by alias                      |
| `sharedKnowsNoDomain`       | `shared/` importing `modules/` — the inversion that ruins the kernel                                                          |
| `dependenciesOnlyInService` | `shared/dependencies/*` outside `*Service.ts`                                                                                 |
| `extinct`                   | the pre-migration folders (`controllers/`, `services/`, `utils/` at the root of `src/`)                                       |

**Reference implementation: `tools_backend/eslint.config.mjs`.** It is written and tested there —
copy it when turning the rules on in another repo, do not rewrite from scratch. Inside a module
imports are relative; the boundary rule is expressed by subfolder depth (`MAX_MODULE_DEPTH`).

Cycle detection (ADP) is on: `npm run check:cycles` (`scripts/checkCycles.ts`, identical in
the six repos — copy it, do not rewrite) asks `dependency-cruiser` only for the import graph
(`.dependency-cruiser.cjs` holds resolution options, no rule) and measures the **files inside
a cyclic component** (Tarjan, `scripts/cyclicFiles.ts`, pure core with its test beside it).
`no-restricted-imports` cannot see a cycle — it reads one import line at a time — which is why
this needs its own tool. The number is a ratchet, exactly like `--max-warnings`: the CI runs
`--max-files` at today's count and fails when a file joins a cycle; when your change takes files
out of a cycle, lower the cap in the same PR. Boy-scout rule, the same one that governs warnings and coverage: a file you touch that sits inside a cyclic component leaves the PR with one edge fewer — undo the import that closes the cycle (the edge test above) rather than adding to it; never mass-refactor cycles the PR doesn't touch. **The cap only ever goes down.** dependency-cruiser's
own `no-circular` baseline was tried and dropped on 2026-08-28: it matches a known cycle by its
exact path, and inside a large cyclic component any change re-routes the paths, so PRs with no
new cycle failed on "new" ones (see `docs/decisions/2026-08-28-ciclos-ratchet-por-scc.md`).

**Rollout order when turning the rules on in a repo:** `git mv` the domain files out of `shared/`
→ write the `contract.ts` files → rewrite the imports → **then** turn the lint on, already green.
Turning it on first leaves CI red for the whole migration and the real regression signal is lost.

### Imports

**Inside the module, relative (`./file`); crossing the boundary, alias
(`@/modules/<other>/contract`, `@/shared/`).** Two reasons: the module crossing is visible to the
naked eye on the import line — which is what makes the public-door rule reviewable — and the
internal path stays short. Long paths make Prettier wrap imports across lines, which pushes large
files over the ESLint `max-lines` limit; that happened for real, in two files.

The alias is wired the same way in every backend: `paths` in `tsconfig.json`, `tsc-alias` after
`tsc` in `build` (it rewrites the aliases in `dist`, so runtime resolves plain relative paths and
pays nothing), `ts-node -r tsconfig-paths/register` for `dev` and the `scripts/`, and
`vite-tsconfig-paths` in `vitest.config.ts`. The frontends get it from Vite and need none of
that. Because the alias is what makes the crossing visible, the `no-restricted-imports` patterns
match it too — `moduleExposesOnlyContract` is listed in the per-module blocks, not only in the
base one, or a module file could reach into another module through `@/modules/<x>/<file>` with
nothing to stop it.

### Why this model

Not an invention: it is the common denominator of the official references of the TypeScript branch.

- [NestJS](https://docs.nestjs.com/modules) — folder per domain, layers inside
- [Angular Style Guide](https://angular.dev/style-guide) — _"avoid creating directories like `components`, `directives`, and `services`"_, _"unit tests should live in the same directory as the code-under-test"_
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) §1.1 — structure by business components
- [Expo](https://expo.dev/blog/expo-app-folder-structure-best-practices) — feature folders with a public API per feature

Not to be confused with **Vertical Slice Architecture** (one folder per use case). Here the
granularity is the business domain, not the use case. It is also not hexagonal: there is no
port/adapter, no interface with a single implementation, and Prisma is not wrapped in a
repository — Prisma **is** the adapter. Hexagonal comes back to the table the day a second real
implementation of the same capability exists.

The trade is deliberate: one extra folder in a small project costs less than the sentence "in
this one it is different". An exception is exactly what reintroduces the cognitive cost the
single convention exists to remove.

### This repo

Domains in this repo: `achievement`, `allowedEmail`, `arkoApp`, `auth`, `balance`,
`bankAccount`, `budget`, `calendar`, `cashFlow`, `categorizationRule`, `category`,
`clientProgress`, `consultant`, `crm`, `document`, `goal`, `investment`, `mail`, `nps`,
`objective`, `onboarding`, `openFinance`, `pension`, `pgbl`, `profilePhoto`, `report`, `statement`,
`survey`, `transaction`, `transactionSync`, `user`.

Everything under `src/` lives in `modules/` or `shared/` — the pre-migration folders are gone
and the `extinct` lint rule stops them coming back. Every module with an external consumer
publishes a `contract.ts`, every router is a `createXRouter()` factory, and the boundary is
verified by `moduleExposesOnlyContract`, `insideModuleIsRelative` and `crossingUsesAlias`
(migration closed 2026-08-28). New code goes straight to `modules/`. Never mix a move with a
logic change in the same PR.

## Testability

Code must be born unit-testable. Enforced by ESLint (`max-lines-per-function`: 50 warn, `max-params`: 5, `max-depth`: 4) plus the rules below — grounded in SOLID (SRP/DIP), Google's Guide to Writing Testable Code (Hevery), and the functional-core/imperative-shell pattern:

1. **Warning ratchet** — never introduce a new lint warning: every change must leave the warning count equal or lower. CI enforces this with a `--max-warnings` cap in `ci.yml`; when your change reduces warnings, lower the cap in the same PR. The same ratchet applies to test coverage: minimum thresholds live in `vitest.config.ts` (`autoUpdate: false` since 2026-08-26) and `npm test` fails if coverage drops below them — never lower a threshold to make a change pass; write the missing tests instead. Never write a new function above 80 lines. When editing a legacy function that exceeds a limit, extract the part you are touching into a smaller function instead of growing it — and the extracted function gets a unit test (boy-scout rule: leave what you touched better than you found it; never mass-refactor code the PR doesn't touch).
2. **Functional core, imperative shell** — a function that computes or decides must not call Prisma, `fetch`, or an LLM. Pattern: orchestrator fetches → pure function computes → orchestrator persists. Business math lives in pure functions, never inline between queries. Testing strategy follows the split: many fast unit tests on the core, few integration tests on the shell.
3. **Dependencies enter as parameters (DIP)** — everything a computing function needs — data, clock (`now`), random, fetchers/clients — arrives through its signature, never reached from inside via singleton, module import, or global. The static-class service convention stays, but a static method that computes gets its collaborators as arguments (references in this repo: `CategorizationRuleService.applyRules({ preloadedRules })`, `resolvePlan(now)`). `new Date()` / `Date.now()` inside calculation/rule logic is the canonical violation: take `now` as a parameter (reference implementation: `src/modules/objective/objectiveCalculations.ts`); reading the clock is allowed only at the orchestration edge (controller, cron entry).
4. **Nothing happens at import time** — no env capture into `static readonly` fields or module-level constants, no client construction (SMTP/HTTP/SDK), no I/O at module load. Read env and build clients in config/bootstrap files or lazily at call time; import-time work freezes values and tests cannot override them.
5. **No hidden mutable module state** — module-level caches, counters, and memoized singletons leak state between tests and between requests. Keep state at the shell, pass it in as a parameter, or expose a reset for tests.
6. **Side effects outside calculations** — email/Slack/websocket/notifications are never called from inside a function that computes; they belong to the orchestrator, after the calculation. Never swallow their errors with an empty `catch`.
7. **One responsibility per function (SRP)** — if describing what a function does requires "and" (fetches AND computes AND notifies), it is several functions. Extract until the description has no "and".
8. **Pure helpers must be reachable** — a helper that carries a business rule must be exported (or live in `utils/`), never a closure inside a method or an unexported module function.
9. **Mocking is a smell of shape** — if testing a unit requires mocking more than one collaborator, the unit is wrongly shaped: extract the pure part instead of building mock scaffolding.
10. **Born tested** — every new pure/logic function (calculation, business rule, parser, validator) ships with a colocated Vitest test in the same PR: `foo.test.ts` next to `foo.ts`, run with `npm test`. Orchestrators (controllers, crons, hooks, services that only fetch/persist) don't require unit tests — a unit test of pure delegation asserts nothing. That is **not** the same as "they don't need testing": what covers them is an integration test (route + auth + serialization), which this repo does not have yet. Until it does, an orchestrator carrying a decision is a bug waiting at the boundary — extract the decision into pure core so at least the rule is covered.

## Code Quality

1. **No comments** — code must be self-explanatory; use descriptive names instead. Every form
   counts, with no exception for the ones that look professional: inline `//`, block `/* */`,
   JSDoc/TSDoc `/** */`, a docblock at the top of a file, a note on an interface field, a line
   explaining a constant, a `TODO`. A file that needs explaining needs better names, and the
   "why" that does not fit in a name goes in `docs/decisions/` or in the PR, never in the code.
   The only comments that stay are the ones a tool reads: `eslint-disable`, `@ts-expect-error`,
   `prettier-ignore`, `/// <reference`, and the `/* empty */` an empty `catch` needs to satisfy
   `no-empty`
2. **No `console.log` or `console.warn`** — remove before committing. Exception: `console.error`
   in backend controllers, for unexpected errors only
3. **No `any`** — explicit types, or `unknown` with type guards
4. **No barrel files** — always direct imports; never create `index.ts` re-exports. The one named
   exception is `modules/<domain>/contract.ts`, the module's public door: a hand-curated list
   where every line is deliberate, not a directory sweep
5. **Descriptive names** — variables, functions and files must communicate intent without a comment
6. **No magic strings** — see **Magic Strings & Enums** above

## File Input

Every file the user sends is a decompression-bomb surface: gzip in the request body, object
streams inside a PDF, an XLSX that is a ZIP container. These seven rules are the same in all six
repos — change one, change all six.

1. **Byte ceiling on both ends** — a named constant on the server (multer, schema or the route's
   parser) and another on the front, and the front's is never larger than the server's
2. **Type by content, not by name** — the declared name and mime are necessary, never sufficient:
   on the server the magic byte decides; on the front the extension and `File.type` must agree
3. **Every route that processes a file is rate limited** — per user when authenticated, per IP
   when public, separate from the login limiter
4. **The JSON body never inflates** — `express.json` always with `inflate: false`; a small global
   limit, and the large one mounted only on the route that needs it
5. **A parser that inflates runs contained** — PDF, XLSX and images are opened only after the byte
   ceiling and the confirmed type; on the server inside a worker with a memory and time cap, on
   the front never without the ceiling first
6. **Nobody unzips ZIP/TAR that came from a user** — if it ever becomes necessary, it enters with
   a cap on inflated bytes and on compression ratio
7. **A size or type error answers JSON** with the right status (413, 415, 400) and a message in
   Portuguese — never Express's default HTML page

**Order of the checks, cheapest first — never invert it:** rate limit → byte ceiling → declared
extension and mime → magic byte of the content → parser inside the worker. Rejecting at the
fourth step costs four bytes read; rejecting at the fifth costs a whole WASM module.

**Permissive when in doubt.** A limit that refuses a legitimate file is a worse bug than the risk
it closes: an absent, empty or unknown `File.type` always passes (on Windows a `.csv` arrives as
`application/vnd.ms-excel` or empty), the magic byte only rejects a _known_ binary that
contradicts what was declared, and PNG/JPEG/WebP count as one family. A real PDF always starts
with `%PDF-`, so nothing legitimate is ever refused.

**Never guess a limit — measure it.** Build the largest payload the schema accepts, validate it
through the real zod schema, count `Buffer.byteLength`, multiply by ten. The number and its
arithmetic go in the commit body. A global limit of 256 KB was once proposed here and would have
answered 413 to a real advisor: the legitimate migration spreadsheet weighs 650 KB.

Deeper material — the PR checklist, how each trap was found, and the cross-repo comparison — is in
the `file-input` skill.

**In this repo.** Six entry points: three parse routes (`/api/transaction/parse-file`,
`/api/cash-flow/shift-records/parse-file`, `/api/budget/parse-credit-card-invoice`), the two
reconciliation routes that take base64 in JSON, `/api/document/upload` and the profile photo.
Never assemble any of it by hand — the pieces already exist:

| For                                 | Use                                                                                                           | Where                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| JSON body                           | `createJsonBodyParser(limit?)` — already fixes `inflate: false`                                               | `shared/middlewares/jsonMiddleware.ts`   |
| Multipart upload                    | `createParsedFileUpload()`                                                                                    | `shared/middlewares/uploadMiddleware.ts` |
| Multer error                        | `createMulterErrorHandler(maxBytes, message?)`, chained **after** the upload                                  | idem                                     |
| `req.body.user` surviving multipart | `uploadPreservingAuthUser(upload)` — multer discards the body                                                 | idem                                     |
| Rate limit                          | `createUploadRateLimit(message, limit)`                                                                       | `shared/middlewares/uploadRateLimit.ts`  |
| Magic byte                          | `isContentConsistentWithMime(buffer, mime)`, `isContentConsistentWithImage(buffer)`                           | `shared/utils/fileSniff.ts`              |
| Opening a PDF                       | `PdfPasswordService`, `PdfExtractionService` — already run in a worker; never call `pdf-lib` or qpdf directly | `shared/utils/`                          |

Limits in force: `DEFAULT_JSON_BODY_LIMIT` 8 MB global, `RECONCILIATION_LIMITS.BODY_LIMIT` 15 MB
mounted by path in `index.ts` (a parser mounted inside a router is dead code — the app-level
`express.json` runs first), `PARSED_UPLOAD_MAX_BYTES` 10 MB, 3 MB per document, 2 MB per photo.
Rate limit: 30 per 15 min on what persists, 100 per 15 min on what only parses.

## Types & Models

- **Exported** types, interfaces and enums never live inside services, controllers, configs,
  components, pages or crons — they get their own file, next to the code that owns them:
  - Belongs to one domain → `src/modules/<domain>/` (e.g. `modules/task/task.types.ts`)
  - Has no domain owner → `src/shared/models/{types,enums,schemas}/`
- Backends also keep request schemas as `*Schema.ts`
- File naming: `camelCase.types.ts` (e.g. `transaction.types.ts`)
- File naming, everything else: `PascalCase` only when the file's main export is a React
  component of the same name (`PageLoading.tsx` exports `PageLoading`); `camelCase` otherwise,
  including `.tsx` files that export a collection, a map or column definitions
  (`clientsSpreadsheetColumns.tsx`, `meetingTranscriptSlots.tsx`). Backends are always `camelCase`.
- **Never kebab-case in our own code.** Kebab is allowed only where an external tool fixes the
  name: a `.d.ts` matching an npm package (`qpdf-wasm.d.ts`, `recharts-scale.d.ts`), a framework
  file (`vite-env.d.ts`), a build entrypoint referenced by config (`entry-prerender.tsx`), and the
  Shadcn registry components in `crm_frontend/src/shared/ui/` (`dropdown-menu.tsx`,
  `scroll-area.tsx`), which `npx shadcn add` rewrites with that name. A component we wrote
  ourselves follows our rule even sitting next to Shadcn files: `SummaryDistributionCards.tsx`,
  never `summary-distribution-cards.tsx`.
- Non-exported interfaces used by a single file may stay local to that file
- React component `Props` interfaces stay in the component file

## TypeScript

```typescript
// ✅ Correct — unknown with type guards
catch (err: unknown) {
  if (err instanceof MappedException) { /* known error */ }
  if (err instanceof Error) { /* generic error */ }
}

// ❌ Prohibited
catch (err: any) { }
catch (e) { console.log(e.message) }  // no type guard
```

- Prefer `null` over `undefined` for absent values (consistent with Prisma/JSON/API responses)
- Use `as` casting only when type inference is provably insufficient
- Use `Partial<T>`, `Omit<T, K>`, `Pick<T, K>` instead of duplicating interfaces

## Code Review

Três arquivos, três perguntas — nenhuma regra vive em dois deles:

| Arquivo                               | Responde                              | Quem lê                             |
| ------------------------------------- | ------------------------------------- | ----------------------------------- |
| `CLAUDE.md`                           | como escrever código neste repo       | quem escreve código                 |
| `REVIEW.md`                           | o que checar num diff e o que ignorar | o review, na CI e no `/code-review` |
| `.github/workflows/claude-review.yml` | como o resultado é publicado          | GitHub Actions                      |

Regra nova de review entra no `REVIEW.md` — nunca no prompt do workflow, que só
cuida de formato, limite de comentários e onde publicar. O que a CI já pega de
forma determinística (ESLint, `tsc`, Prettier, os ratchets) nunca vira comentário
de review: lint é a barreira mecânica, o review é a barreira de julgamento.
Duplicar a regra nos dois lugares é o que faz o bot gastar os cinco comentários
dele com o que a pipeline já barrou.

Todo comando `gh` no prompt do workflow leva o número do PR já interpolado
pelo GitHub (`gh pr diff ${{ github.event.pull_request.number }}`), nunca
variável de shell como `"$PR_NUMBER"`. O Claude Code bloqueia comando Bash
com expansão de variável mesmo quando ele está no `allowedTools`, e o bot
queima turno tentando contornar: com `"$PR_NUMBER"` no prompt, todo review
abriu com 7 a 23 chamadas bloqueadas e o custo médio subiu de US$ 0,39 para
US$ 0,57.

## Git

| Type       | Use                                 |
| ---------- | ----------------------------------- |
| `feat`     | New feature                         |
| `fix`      | Bug fix                             |
| `chore`    | Maintenance (deps, config, scripts) |
| `docs`     | Documentation only                  |
| `style`    | Formatting only (no logic change)   |
| `refactor` | Refactoring (no behavior change)    |
| `test`     | Tests only                          |

Format: `<type>: <short description in imperative>` — imperative (`add`, not `added`), one line
when possible. **The whole commit is written in English — subject and body alike.** The product
speaks Portuguese and so do the plans in `docs/plans/`, but the git log does not: it is read
alongside the code, whose identifiers are English by the `no-restricted-syntax` rule above. A
commit in Portuguese is rewritten before it is pushed, never after. The repo is squash-only with `PR_TITLE`: the PR title is what becomes the
conventional commit. Never mix a file move with a logic change in the same PR.

O tamanho do PR é barrado na CI por dois orçamentos separados, medidos em linhas
adicionadas ignorando as vazias, as de só-pontuação, `package-lock.json` e
`migrations/`: **700 de produção** e **1000 de testes**. Arquivo `*.test.ts` conta
no orçamento de teste, nunca no de produção — teste é 20–42% do diff sob a regra
nasce-testado, e contar os dois juntos fazia do "não escrever teste" o caminho mais
barato para passar no gate.

After completing any feature, fix or refactor, output a ready-to-copy commit message:

```
Commit message: `<type>: <short description>`
```

## Decision Log

Non-trivial decisions are recorded in `docs/decisions/`, one dated file per decision
(`YYYY-MM-DD-short-title.md`, with **Contexto / Decisão / Por quê / Alternativas descartadas**).
A cross-cutting decision is recorded in every repo it touches.

Record it only if **all four** are true:

1. It changes **business, architecture, data or security** — not a local implementation detail
2. There was a **real alternative** that was rejected — not an obvious or forced choice
3. The **"why" is NOT clear from the code + commit alone**
4. Someone would **re-open or re-question** this choice in ~6 months

Any "no" → don't record it. A log that records everything becomes noise no one reads.
Rule of thumb: if you had to argue with yourself before choosing, and the loser had a real case,
write the file.

## Development Scripts

```bash
npm run dev          # ts-node development server
npm run build        # TypeScript compilation
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format:check # Prettier check
npm test             # Vitest with coverage (colocated src/**/*.test.ts)
```

**Definition of done for any task:** `npm run build` + `npm run lint` + `npm run format:check` +
`npm test`, all green, in every repo the change touched. `npm run build` catches what
`tsc --noEmit` misses — the scopes differ.

## Backup & Security Policy

The production database backup runs **once a week**, from the folder that holds the repos:

```bash
make backup-prod    # captures + downloads both prod DBs to ~/Documents/heroku-backups/<date>/
make verify-backup  # checks the day's files are valid and complete
```

Every backup lives in **3 places** (3-2-1 rule): Heroku's automatic capture, the local PC at
`~/Documents/heroku-backups/<date>/`, and a manual copy on a pendrive.

**Never create a Prisma migration by hand** — always `prisma migrate dev`. A migration carries
DDL only: no seed, no data. Initial records are entered through the admin screen.

## Authentication Middlewares

File: `src/modules/auth/authMiddleware.ts`

Cada role tem a **sua** chave de assinatura, mapeada em `accessKeyByRole.ts`
(`CLIENT` → `ACCESS_PRIVATE_KEY`, `CONSULTANT` → `CONSULTANT_ACCESS_KEY`, `ADMIN` →
`ADMIN_ACCESS_KEY`, `BACKOFFICE` → `BACKOFFICE_ACCESS_KEY`). Todo middleware é
`authenticateRoles([...])`: ele tenta verificar o token com a chave de cada role da lista, então
uma role fora da lista falha na assinatura, não numa comparação de campo. Role nova nasce sem
acesso a nada até ser listada — e `validateAuthEnv` em `index.ts` consome `ACCESS_KEY_ENV_VARS`,
então o boot morre se a chave dela não estiver configurada. Ver
`docs/decisions/2026-09-03-chave-propria-e-escopo-do-backoffice.md`.

| Middleware                       | Who can access                                  |
| -------------------------------- | ----------------------------------------------- |
| `authenticateClient`             | CLIENT, ADMIN, BACKOFFICE                       |
| `authenticateConsultant`         | CONSULTANT (via cookie), ADMIN, BACKOFFICE      |
| `authenticateAdmin`              | ADMIN, BACKOFFICE                               |
| `authenticateAdminOnly`          | ADMIN                                           |
| `authenticateClientOrConsultant` | CLIENT, CONSULTANT, ADMIN, BACKOFFICE           |
| `authenticateLogout`             | Qualquer perfil (header ou cookie do consultor) |
| `authenticateRefresh`            | Refresh token validation                        |

`authenticateAdminOnly` é o que o BACKOFFICE não alcança: quem administra o escopo do backoffice
não pode ser o próprio backoffice, ou ele se concede acesso.

`authenticateLogout` é o único que aceita o cookie httpOnly `consultantAccessToken` como
credencial, e existe só para `POST /login/logout`: o consultor não guarda access token no
frontend, então sem esse fallback o logout dele voltava 401 e os cookies de sessão sobreviviam ao
"Sair" — ver `docs/decisions/2026-08-31-logout-do-consultor-aceita-o-cookie.md`. Nenhuma rota de
estado aceita cookie como credencial (CSRF).

JWT payload available at `req.body.user` after authentication:

```typescript
const { userId, userRole } = req.body.user;
// userRole: UserRole — CLIENT | CONSULTANT | ADMIN | BACKOFFICE
```

### Escopo do backoffice

Uma conta `BACKOFFICE` só enxerga os clientes dos consultores ligados a ela em
`backoffice_consultant_scope`, configurados pelo ADMIN em `/admin/usuarios`. O recorte é **fail
closed**: backoffice sem nenhum consultor no escopo não acessa cliente algum. Ele vale nas duas
portas de acesso a cliente — `GET /consultant/all-users` (listagem, via
`buildUserAccessWhere`) e `POST /consultant/all-access` (impersonação, via
`isWithinBackofficeScope`) — mais o dropdown `GET /consultant/all`. Quem resolve o escopo é
`BackofficeScopeService.resolveScopeForRole(userId, role)`, que devolve `null` (sem recorte) para
qualquer role que não seja BACKOFFICE. Rota nova que exponha dado de cliente ao backoffice passa
pelo mesmo `resolveScopeForRole`.

## Inter-Service Communication

```
[CRM Frontend] → (apiClient) → [CRM Backend] → (X-API-Key) → [Arko Backend]
```

- The CRM frontend **never** calls the Arko backend directly
- Arko exposes `/api/external/*` behind the `authenticateExternalApi` middleware
- The CRM backend calls Arko through `ExternalApiService`, using `EXTERNAL_API_KEY`
- The Arko backend calls the CRM through `CrmService`, using the same `EXTERNAL_API_KEY`
- Both sides share the same `EXTERNAL_API_KEY` value

## External API — Arko Exposes to CRM

Routers: one `createExternal<X>Router()` per owning module — `allowedEmail`, `arkoApp`,
`budget`, `consultant`, `investment`, `objective` and `user` — all mounted at `/api/external`
by `index.ts`
Middleware: `authenticateExternalApi` — validates `x-api-key` header against `EXTERNAL_API_KEY`

Available routes (called by CRM backend only — never by any frontend):

| Method | Route                                       | Description                                                    |
| ------ | ------------------------------------------- | -------------------------------------------------------------- |
| `POST` | `/api/external/allowed-emails/clients`      | Add allowed email                                              |
| `POST` | `/api/external/clients/update-email`        | Update client email (User + AllowedClientEmail + Drive folder) |
| `GET`  | `/api/external/transactions/stats-detailed` | Transaction statistics                                         |
| `GET`  | `/api/external/investments/custody-stats`   | BTGPactual custody stats                                       |
| `GET`  | `/api/external/consultant/all`              | List of consultants                                            |
| `GET`  | `/api/external/investments/assets`          | Ativos observados nas carteiras (paginado, busca e filtros)    |
| `GET`  | `/api/external/investments/assets/filters`  | Tipos e subtipos disponíveis para filtrar os ativos            |

**Important:** Controllers in `/api/external` routes must NOT access `req.body.user` (no JWT on these routes — auth is via API key only).

### Adding a New Route for CRM

1. Register in the owning module's `createExternal<X>Router()`, with `authenticateExternalApi`
   and the target controller — when the module has none yet, create the router and publish it
   through the module's `contract.ts`
2. Ensure the controller does not use `req.body.user` — use query/body params only
3. In CRM backend: add proxy endpoint in `adminArkoProxyRouter` calling `ExternalApiService`

## Arko Calling CRM

- Service: `CrmService` in `src/modules/crm/crmService.ts`
- Config: `CRM_API_URL` (CRM URL), `EXTERNAL_API_KEY` — sent as `X-API-Key` header

### Fire-and-Forget Methods (`try*` prefix)

Standard CrmService methods throw `MappedException` on failure. Methods prefixed with `try` intentionally **swallow all errors** (log via `console.error`, never throw). This ensures tracking never affects user experience.

```typescript
// Standard method — throws on failure
static async getContractStatus(clientId: string): Promise<ContractStatus> { ... }

// Fire-and-forget — NEVER throws, logs errors only
static async tryNotifyInvestmentBankConnected(email: string): Promise<void> { ... }
```

Do not add `throw` to `try*` methods — the silent failure is intentional.

## Key Integrations

| Integration   | Purpose                                    | Notes                                                                                                                                                                                                                                                                                                                                         |
| ------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket.io 4   | Real-time updates                          | `WebSocketService` — uses singleton pattern. All connections require JWT via `socketAuthMiddleware` (`socket.handshake.auth.token`). User identity available at `socket.data.userId` / `socket.data.userRole` after connection                                                                                                                |
| Anthropic SDK | AI features (extração de faturas/extratos) | Modelo `claude-sonnet-4-6`; client via `getAnthropicClient(<feature>)` em `src/shared/dependencies/anthropicClient.ts` — feature nova registra sua env var em `anthropicKeyResolver.ts` (`FEATURE_ENV_VARS`). PDF enviado nativamente (bloco `document`), imagens via bloco `image`, extração com structured outputs (`messages.parse` + Zod) |
| Pluggy SDK    | Open finance / bank aggregation            | —                                                                                                                                                                                                                                                                                                                                             |
| Nodemailer 7  | Email sending                              | —                                                                                                                                                                                                                                                                                                                                             |
| Google APIs   | Calendar, etc.                             | —                                                                                                                                                                                                                                                                                                                                             |

## Environment Variables

| Variable                      | Purpose                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `EXTERNAL_API_KEY`            | Shared secret with CRM; validates `x-api-key` in `/api/external/*`                                   |
| `CRM_API_URL`                 | CRM backend URL for Arko → CRM calls                                                                 |
| `DATABASE_URL`                | Prisma database connection                                                                           |
| `JWT_SECRET`                  | JWT signing key                                                                                      |
| `ANTHROPIC_API_KEY`           | Chave da Anthropic (Claude) — fallback dos serviços de IA                                            |
| `ANTHROPIC_API_KEY_<FEATURE>` | Chave por funcionalidade de IA (ver `anthropicKeyResolver.ts`); opcional, prevalece sobre a genérica |
| `BLOB_READ_WRITE_TOKEN`       | Vercel Blob (profile photo); required outside Vercel infra                                           |
| `ACCESS_PRIVATE_KEY`          | Assina o access token do CLIENT (inclui o token concedido na impersonação)                           |
| `CONSULTANT_ACCESS_KEY`       | Assina o access token do CONSULTANT                                                                  |
| `ADMIN_ACCESS_KEY`            | Assina o access token do ADMIN                                                                       |
| `BACKOFFICE_ACCESS_KEY`       | Assina o access token do BACKOFFICE — valor distinto do `ADMIN_ACCESS_KEY`                           |
