# Arko Frontend — Specific Rules

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

In this repo: domain-value enums (status, type, role, category — any closed, meaningful set) live in the module that owns the concept and come out through its `contract.ts` (TS `enum`, e.g. `distributionType.ts`). If an enum already exists for a value, use it — never compare against the raw literal. Technical keys (sort fields, one-off UI-only toggles, external SDK contracts) are not domain values and stay as literals. Guard: type signatures and comparisons with the enum so a raw literal fails `tsc` (the CI build already runs it); review is the backstop. There is no reliable ESLint rule for this — don't add one.

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
The frontend contract re-exports the top-level component, the hook and any type/enum/pure
function that crosses the boundary.

```ts
// modules/client/contract.ts
export { ClientsPage } from "./ClientsPage";
export { useClients } from "./useClients";
export type { ClientBoardSortBy } from "./clientBoard.types";
```

```ts
// modules/spreadsheet/SpreadsheetPage.tsx
import { type ClientBoardSortBy } from "@/modules/client/contract";
```

Reference implementation: `tools_frontend/src/modules/*/contract.ts`.

#### 2. I/O only in the orchestrator

The API client is called from the data hook. Never from inside a component, never from a pure
core file.

#### 3. Pure core in its own file, with a colocated test

Formatting, derivation, layout math, validation: no React, no API client, ships with
`foo.test.ts` beside it. This is the code that travels to the mobile app unchanged, which is why
it must not be trapped inside a component.

| Role         | File                          | Does what                                    |
| ------------ | ----------------------------- | -------------------------------------------- |
| Entry        | `TasksPage.tsx`               | renders                                      |
| Orchestrator | `useTasks.ts`                 | fetches, saves, notifies — touches the world |
| **Core**     | `insuranceQuoteCalculator.ts` | decides, calculates, transforms, validates   |

**Two pocket tests for what counts as core:** if it needs `await`, it is an orchestrator; if
testing it requires a mock, it is in the wrong place — core is tested with literal values. UI
state is not a business rule: open tab, visible modal and controlled input stay in the component.

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

Cycle detection (ADP) is not on yet: `no-restricted-imports` cannot see a cycle. It goes in the
day the first real cycle appears — `dependency-cruiser` with `no-circular` solves it, but it is
not worth the dependency before that.

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

Domains in this repo: `achievement`, `allowedEmail`, `auth`, `balance`, `bankAccount`,
`budget`, `cashFlow`, `categorizationRule`, `category`, `clientProgress`, `consultant`,
`contract`, `crm`, `designSystem`, `document`, `goal`, `investment`, `landing`, `nps`,
`objective`, `onboarding`, `pension`, `pgbl`, `statement`, `survey`, `transaction`,
`transactionSync`, `user`.

Everything under `src/` lives in `modules/` or `shared/` — the pre-migration folders are gone
and the `extinct` lint rule stops them coming back; the design system
(`atoms|molecules|organisms`) lives whole in `shared/ui/`. Every module with an external
consumer publishes a `contract.ts`, and the boundary is verified by
`moduleExposesOnlyContract`, `insideModuleIsRelative` and `crossingUsesAlias` (migration
closed 2026-08-28). New code goes straight to `modules/`. Never mix a move with a logic change
in the same PR.

## Testability

Code must be born unit-testable. Enforced by ESLint (`max-lines-per-function`: 50 warn in `.ts` / 150 in `.tsx`, `max-params`: 5, `max-depth`: 4) plus the rules below — grounded in SOLID (SRP/DIP), Google's Guide to Writing Testable Code, and the functional-core/imperative-shell pattern:

1. **Warning ratchet** — never introduce a new lint warning: every change must leave the warning count equal or lower. CI enforces this with a `--max-warnings` cap in `ci.yml`; when your change reduces warnings, lower the cap in the same PR. The same ratchet applies to test coverage: minimum thresholds live in `test.coverage` in `vite.config.ts` (`autoUpdate: false` since 2026-08-26) and `npm test` fails if coverage drops below them — never lower a threshold to make a change pass; write the missing tests instead. Never write a new function above 80 lines (`.tsx` components: 150). When editing a legacy function that exceeds a limit, extract the part you are touching instead of growing it — and the extracted function gets a unit test (boy-scout rule: leave what you touched better than you found it; never mass-refactor code the PR doesn't touch).
2. **Functional core, imperative shell** — components render, hooks orchestrate (fetch/state), pure functions compute. Calculations, aggregations, parsers, and validation rules live in `utils/` (or a colocated pure `.ts` module) and are imported by the component or hook; a component derives presentation, it does not own business math. A computing function must not call the API client.
3. **Dependencies enter as parameters (DIP)** — everything a computing function needs — data, clock (`now`), viewport/DOM-derived values, resolved CSS colors — arrives through its signature, never read from inside (`new Date()`, `Date.now()`, `getComputedStyle`, `localStorage`). Resolve at the component/hook edge, pass the value in. A test then passes plain values — no mocks.
4. **Nothing happens at import time** — never capture `import.meta.env` or build clients in module-level constants of logic modules; read them inside the function (or keep them in the API-client layer). Import-time work freezes values and tests cannot override them.
5. **No hidden mutable module state** — module-level caches and mutable singletons leak state between tests; keep state in hooks/components or pass it in.
6. **One responsibility per function (SRP)** — if describing what a function does requires "and", it is several functions. Extract until the description has no "and".
7. **Pure helpers must be exported** — a module-level helper that carries a business rule must be exported so tests can import it. Never redeclare an existing util inside a component — check `utils/` first before writing a formatter/validator.
8. **Mocking is a smell of shape** — if testing a unit requires mocking more than one collaborator, the unit is wrongly shaped: extract the pure part instead of building mock scaffolding.
9. **Born tested** — every new pure/logic function (calculation, business rule, parser, validator) ships with a colocated Vitest test in the same PR: `foo.test.ts` next to `foo.ts`, run with `npm test`. Components and hooks don't require unit tests — a unit test of pure delegation asserts nothing. That is **not** the same as "they don't need testing": what covers them is an integration test (render + interaction, or the API boundary), which this repo does not have yet. Until it does, a component carrying a business rule is a bug waiting at the boundary — extract the rule into a pure function so at least it is covered.

One shape is exempt from `max-lines-per-function`, and only this one: a `*.test.ts` /
`*.test.tsx` file, where a long `describe` is a suite and each `it` is already the isolated
unit. Everywhere else the warning stands, and the fix is to extract the piece that has a name
of its own (a validation, a filter builder, a formatter), which lands in a pure file with its
test beside it. Splitting a cohesive function just to quiet the linter is worse than the
warning: **the CI ceiling only ever goes down.**

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

**In this repo.** Five entry points, none of which opens the file in the browser — everything goes
to `arko_backend` as `FormData` or base64. `isFileTypeCoherent(file, allowedExtensions)` lives in
`shared/utils/fileTypeGuard.ts` and is used by `bulkImportFileValidation`, `ShiftImportModal`,
`documentUploadUtils.validateUploadFile` and `StatementReconciliationModal`; `ProfilePhotoPicker`
already checks `File.type` on its own.

The front validates to give a fast local message, not to protect the server — the backend is what
protects it. So the front is always equal to or **more permissive** than the backend: if the two
diverge the file is refused anyway, only the message shows up somewhere else. Ceilings in force:
10 MB for import and reconciliation (5 files), 3 MB per document with 10 per category, 30 in total
and 50 MB combined, 8 MB of input for the photo — which uploads the cropped 256 px WebP, a few KB.

## No Lazy Loading

Every screen ships in the initial bundle: no `React.lazy`, no dynamic `import()` in code that
reaches the browser. Vercel keeps only the files of the current deploy, so a tab opened before a
deploy asks for a chunk that no longer exists; the SPA rewrite answers with `index.html` (or a 404
where the rewrite skips files), the import rejects and React unmounts the whole tree — a blank
screen that only F5 fixes. It hit the CRM on 2026-09-10 after three deploys in one morning: an
internal tool kept open all day is exactly where route splitting fails most and helps least.

The price was measured before choosing, first load in gzip: CRM 196 → 662 KB, arko 913 → 937 KB,
tools 336 → 337 KB. The `manualChunks` split stays — the vendor chunks keep their hash between
deploys, so a deploy re-downloads only the app chunk. `chunkSizeWarningLimit` is 1200 in the three
repos, above today's largest chunk (arko's app chunk, ~1017 kB); a chunk crossing it is a reason to
look for a heavy dependency, never to split again.

Enforced by `no-restricted-syntax` (`staticImportsOnly`, selector `ImportExpression`) on `src/`
outside tests, which may still `await import()`. See
`docs/decisions/2026-09-10-sem-lazy-loading.md`.

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
npm run dev          # Vite dev server
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format:check # Prettier check
npm test             # Vitest with coverage (colocated src/**/*.test.ts)
```

**Definition of done for any task:** `npm run build` + `npm run lint` + `npm run format:check` +
`npm test`, all green, in every repo the change touched. `npm run build` catches what
`tsc --noEmit` misses — the scopes differ.

## API Client

File: `src/shared/utils/api/client.ts`

```typescript
import api from "@/lib/api/client";

// Always use `api` — never axios directly
const response = await api.get("/transactions");
return response.data; // axios wraps response in { data: ... }
```

Interceptors handle automatically:

- `Authorization: Bearer ${accessToken}` added to every request
- `401` — attempts token refresh, retries original request
- `403` — shows session expired message, redirects to `/login`

### Upload multipart — sobrescreva o `Content-Type`

A instância define `Content-Type: application/json` e `timeout: 5000` como default. Com `FormData`, o axios 1.x vê o header json e **serializa o FormData em JSON** — o backend recebe body sem arquivo e responde "arquivo não enviado". Falha só no browser: curl e teste que mocka o service passam.

```typescript
await api.post("/user/photo", formData, {
  timeout: PROFILE_PHOTO_UPLOAD_TIMEOUT_MS,
  headers: { "Content-Type": "multipart/form-data" }, // obrigatório
});
```

Casos vivos: `documentService.upload`, `userService.uploadProfilePhoto`, `consultantService.uploadOwnProfilePhoto`. Ao testar upload, mocke o `api` (não o service) e verifique o header que sai na request — mock do service inteiro não pega essa falha.

## Authentication

The access token lives in an **in-memory variable** in `modules/auth/authSession.ts` — never in
`sessionStorage`/`localStorage`, so XSS cannot read it (decided 2026-08-30, see
`docs/decisions/2026-08-30-access-token-em-memoria.md`). The refresh token is an httpOnly cookie
managed by the backend; a reload rebuilds the session with the silent refresh `rehydrateSession()`
that `ProtectedRoute` and `Login` run on bootstrap. A CONSULTANT's own access token is also an
httpOnly cookie (`consultantAccessToken`); the in-memory token during consultant navigation is the
conceded client token, and the admin's own token during "acessar como" is stashed in memory too
(`stashOriginalAccessToken`/`restoreOriginalAccessToken`). Impersonation survives F5 without any
token in storage: the impersonated user id (not a secret) lives in `sessionStorage`
(`impersonatedUserId`), and `rehydrateSession()` captures it, restores the original session,
then re-issues the conceded token through the same endpoint the "acessar como" flow uses
(`/consultant/all-access` for admin, `/consultant/access` for consultant) — see
`captureImpersonationResume` in `modules/consultant/adminAccessSession.ts`, registered via
`setSessionResumeCapture()` in `main.tsx`.

**A reload never wipes storage.** `rehydrateSession()` and the impersonation resume only
overwrite the session metadata; `sessionStorage.clear()` + `localStorage.clear()` run only when
the identity changes — `persistAuthSession` (login/signup) and `enterAdminAccessSession` /
`enterConsultedClientSession` (opening a client). Screen state persisted in storage (selected
period, selected month, movement filters) must survive F5: between 2026-08-30 and 2026-09-05 it
did not, and consultants lost the month they were analysing on every reload. When the re-issue
fails, `clearImpersonationSession` drops the impersonation flags so the reload degrades to the
original session, never a hybrid one. Decided 2026-09-05, see
`docs/decisions/2026-09-05-recarregar-preserva-o-periodo-selecionado.md`.

**A 401 during impersonation is not fixed by the refresh.** The refresh of a CONSULTANT returns no
`accessToken` in the body (only the renewed cookie), and the conceded client token — 3h, no
automatic renewal — is the one the client routes require. So the 401 retry reissues the conceded
token through `authPort.resumeImpersonatedSession()` and only then retries; when the reissue
fails, it is a real expired session (`session-expired` + `/login`), never a silent retry with the
dead token. The requests that build the session (`/login`, `/consultant/access`,
`/consultant/all-access`) stay out of the retry, otherwise the reissue's own 401 deadlocks on the
promise it is waiting for. Decided 2026-08-31 after a consultant lost a whole categorization
session, see `docs/decisions/2026-08-31-retry-do-401-reemite-o-token-concedido.md`.

`shared/utils/api/client.ts` knows no domain: it reads and writes the token through
`shared/utils/api/authPort.ts` (`getToken`/`setToken`/`resumeImpersonatedSession`), and `main.tsx` — the composition root,
before `render` — registers the adapter with `setAuthPort()`. Never register it from a component
or a `useEffect`: a child effect runs before its parent's, so the first request would leave
without a token.

Non-sensitive session metadata stays in `sessionStorage`:

```typescript
sessionStorage.setItem("userName", name);
sessionStorage.setItem("userRole", role);
sessionStorage.setItem("invoiceDueDate", invoiceDueDate);
sessionStorage.setItem("createdAt", createdAt);
sessionStorage.setItem("loggedOnce", String(loggedOnce));
```

**Auth utils (do not access the session directly):**

- `@/modules/auth/contract` — `getUserId()`, `getUserRole()`, `getAccessToken()`,
  `getRealUserRole()`, `getStoredUserRole()`, `isConsultantContext()`

### Protected Routes

```typescript
import ProtectedRoute from "@/components/ProtectedRoute";

<Route
  path="/home"
  element={
    <ProtectedRoute>
      <Home />
    </ProtectedRoute>
  }
/>
```

`ProtectedRoute` tries the silent refresh first (spinner while it runs) and only then redirects:
to `/selecione-cliente` when the restored session is a CONSULTANT, to `/login` otherwise. Admin
routes redirect non-admins to `/home`.

### Login Navigation, Logout, Roles

- **Login navigate by role:** `CONSULTANT` → `/selecione-cliente`, `ADMIN` → `/admin/usuarios`, else `/home`.
- **Logout:** `const { logout } = useLogout()` from `@/modules/auth/useLogout` — calls `authService.logout()` (`/login/logout`) **always**, then clears storage and redirects. Never condition the call on there being a token in memory: the CONSULTANT has none (their own token is the httpOnly cookie), so the guard meant their logout never reached the server — the cookies survived and `/login`'s silent refresh put them straight back on `/selecione-cliente`. On the server that request authenticates through `authenticateLogout`, the only middleware that accepts the consultant cookie as a credential (see `docs/decisions/2026-08-31-logout-do-consultor-aceita-o-cookie.md`).
- **Roles enum** em `src/modules/auth/userRole.ts`, publicado por `@/modules/auth/contract`: `ADMIN | BACKOFFICE | CONSULTANT | CLIENT`.

## Shared Components

Every shared component lives in `@/shared/ui/`. The `@/components/` tree is gone (migration closed 2026-08-28) — if a name below still shows up in an import, the import is stale.

| Old name         | Component in `@/shared/ui/` | Purpose           |
| ---------------- | --------------------------- | ----------------- |
| `Modal`          | `Modal`                     | Base modal        |
| `TextInput`      | `Input`                     | Text input        |
| `Spinner`        | `Spinner`                   | Loading indicator |
| `Header`         | —                           | App header        |
| `Sidebar`        | `Sidebar`                   | Navigation        |
| `TabBar`         | —                           | Mobile tab nav    |
| `ProtectedRoute` | (n/a)                       | Route auth guard  |
| `ErrorBox`       | (use `Snackbar`)            | Error display     |
| `Chip`           | `Pill`                      | Tag/chip          |
| `Toast`          | `Snackbar`                  | Notifications     |

Toasts via `useSnackbar()` de `@/shared/ui/SnackbarContext` (`showSuccess/showWarning/showError/showSnackbar`) — padrão das telas migradas. `@/hooks/useNotifications` é wrapper da Notification API do browser e seu `showToast` é no-op: não use pra toast.

## Real-Time (Socket.io)

JWT obrigatório em todas as conexões (backend `socketAuthMiddleware` rejeita sem token). `auth` no `io()` deve ser **função** (não objeto estático) pra reconnects pegarem token refreshed: `auth: (cb) => cb({ token: getAccessToken() })` com `getAccessToken` de `@/modules/auth/contract`.

Usar `useWebSocket` hook (`subscribe`/`unsubscribe` no `useEffect`, cleanup no retorno). `WebSocketService` é singleton — exceção à regra de static class.

## Mobile

O desktop (≥ 768px) é a referência e não se mexe. Um ajuste de celular tem uma destas três
formas, e só estas:

1. **Classe que só existe abaixo de `sm`** — `max-sm:…`, ou mobile-first com um `sm:` que repete
   o valor de hoje no desktop (`w-full sm:w-[180px]`).
2. **Regra em `@media (max-width: 767px)`** no `global.css`, **fora de `@layer`** — CSS sem layer
   ganha de qualquer utilitário do Tailwind, então nunca precisa de `!important`.
3. Nunca editando um primitivo do design system — quando o ajuste vale para todo diálogo ou
   botão, ele entra pela forma 2 via `[data-slot="…"]`.

Três armadilhas que o DevTools do Chrome **não** reproduz, e cada uma custa uma ida a produção
para descobrir (medidas no CRM em 29/08/2026):

- **Campo focável com fonte abaixo de 16px faz o Safari iOS dar zoom e nunca voltar** — o usuário
  fica arrastando uma página que não cabe mais na tela. Nunca sobrescreva o tamanho de fonte de
  `input`/`select`/`textarea` para `text-sm`/`text-xs` sem prefixo `sm:`.
- **Tabela mais larga que a tela dentro de `overflow-hidden` fica inalcançável, não só feia** — a
  última coluna (normalmente a de ações) não tem como ser rolada até. Use
  `max-sm:overflow-x-auto`, ou renderize cards abaixo de `sm`.
- **`100vh` no iOS inclui a barra do Safari**, então a última linha fica escondida atrás dela —
  use `100svh`.

Testar uma tela no celular significa Safari real (ou o Simulador do Xcode).

## Theme Colors (legacy)

Cores legacy do app antigo, mantidas só por compat: Primary `#002069`, Secondary `#20D35D`, Background `#F6F6F6` (utilities `bg-primary`, `bg-background`, etc). **Novas UIs usam tokens DS** (`bg-arko-*`, `text-arko-*`, `border-arko-*`) — ver seção Design System abaixo.

## Design System (`shared/ui/`)

> Regras revisadas em 2026-05. Mudanças futuras exigem 2+ casos documentados de falha — anti-flip-flop.

**Taxonomia atomic-design.** Átomo, molécula e organismo continuam sendo como se classifica um componente, mas a divisão deixou de ser de pasta: desde a migração para `modules/` (2026-08-28) o DS inteiro vive plano em `src/shared/ui/`. O inventário vivo é o **conteúdo da pasta** (sempre atual); classifique pela regra abaixo, não por lista.

**Regra firme pra código novo:** componente compartilhado nasce em `src/shared/ui/` — nunca dentro de um módulo, se mais de um módulo usa. `FilterControl` é o caso seminal de molécula; `ListToolbar` (combina SearchInput + FilterControl + actions slot em página de lista) é o caso seminal de organismo.

**Widget de domínio não é DS:** chart específico, modal de feature e afins pertencem ao módulo que os usa, não a `shared/ui/`. Um componente sobe para `shared/ui/` quando um segundo módulo passa a importá-lo — não antes.

**Use o DS como está.** Refine variantes existentes quando o design bater. Arko extensions (`Pill`, `IconButton`, `Spinner`, `SearchableDropdown`, `DatePicker` popover) ficam — preenchem gaps reais.

**Fork ≠ override.** Duplicar arquivo de componente DS é proibido. Override de `className` em componente DS é OK pra tweak one-off — os componentes aceitam `className` exatamente pra isso.

**Promote on duplication** (gatilho na escrita, não em auditoria). Antes de adicionar override `className` ou hex inline, grep o codebase pelo mesmo valor (`grep "h-7 w-11" src/`). Match → promove a variante/token **no mesmo PR**. Sem match → inline OK. Reviewer pergunta: _"grepou?"_ — se não, ele mesmo grepa antes de aprovar. Vale também pra divergência design↔DS: use o DS mais próximo, override local, promove quando recorrer; não distorce o DS por decisão pontual.

**Bypass estrutural permitido.** Quando o design exige markup/comportamento que nenhum DS component pode wrap (clickable card, dashed CTA, custom dropzone, popover ancorado), build inline. Use tokens DS (`bg-arko-*`, `rounded-arko-*`, `shadow-arko-*`) — bypass de components OK, bypass de tokens não. Exemplo vivo: o botão dashed "Adicionar cartão" em [Sync.tsx](src/modules/bankAccount/Sync.tsx).

### Page container

Toda página renderizada dentro de `<AppLayout>` (rotas em [App.tsx](src/App.tsx)) usa `<PageContainer>` como root. É **full-bleed**: estica de ponta a ponta acompanhando a largura disponível (sem `max-width`, sem `mx-auto`), define o gap vertical entre blocos (`gap-4`) e zero padding próprio — o `p-4` do `<main>` em [AppLayout.tsx](src/components/AppLayout.tsx) é o único gutter de chrome. **Largura não é configurável por página** — o `PageContainer` não tem prop de width; o padrão mora no primitivo, justamente pra não dar drift.

```tsx
import PageContainer from "@/components/atoms/PageContainer";

const MyPage = () => (
  <PageContainer>
    <Card>...</Card>
    <Card>...</Card>
  </PageContainer>
);
```

**Não:** adicionar `px-*`/`py-*`, `max-w-*` ou `mx-auto` no root da página. Se o design pede gutter diferente, ajuste o `<main>` em AppLayout (afeta todas) ou converse antes de divergir.

**Exceções legítimas conhecidas:**

- Páginas full-bleed que precisam estourar até o `p-4` do `<main>` (ex: Chat) podem optar por não usar `<PageContainer>`.
- Páginas com layout horizontal (ex: Budget com `md:flex-row`) usam `<PageContainer>` no root e fazem o split internamente.

**Decisão de largura (2026-06):** full-bleed é o canônico pra todas as telas do DS — o conteúdo acompanha a largura da tela, sem teto. Cap de largura (ex: `max-w-*` pra páginas de leitura/formulário) **não** é suportado hoje: quando 2+ telas reais precisarem, entra como opt-out explícito (prop nomeada), nunca como default. `gap`/`direction` seguem a mesma regra — só com 3+ casos.

**End-state:** quando a última tela migrar pro DS, o shell sobe pro `<Outlet/>` do `AppLayout` e os `<PageContainer>` por página somem — largura deixa de ser escolhível de vez. Até lá, toda tela migrada usa `<PageContainer>` no root.

### Tokens — Tailwind v4 `@theme`

All DS tokens live in [src/styles/global.css](src/styles/global.css) inside the `@theme` block (same file as `@import "tailwindcss"`) and are consumed as real Tailwind utilities.

| Namespace   | Variable                                         | Utility                                     |
| ----------- | ------------------------------------------------ | ------------------------------------------- |
| Color       | `--color-arko-*`                                 | `bg-arko-*`, `text-arko-*`, `border-arko-*` |
| Font        | `--font-arko-*`                                  | `font-arko-*`                               |
| Size        | `--text-arko-*` (+ `--text-arko-*--line-height`) | `text-arko-*`                               |
| Shadow      | `--shadow-arko-*`                                | `shadow-arko-*`                             |
| Radius      | `--radius-arko-*`                                | `rounded-arko-*`                            |
| Line-height | `--leading-arko-*`                               | `leading-arko-*`                            |
| Easing      | `--ease-arko-*`                                  | `ease-arko-*`                               |

`--sp-*` (spacing) e `--dur-*` (duration) vivem em `:root` (não `@theme`) — escala 2px colide com Tailwind 4px-base. Use só quando o spacing default não cabe: `p-[var(--sp-3)]`.

```tsx
// ✅ Utility
<div className="bg-arko-green-800 text-arko-ink-700 rounded-arko-pill" />
// ❌ Hex hardcoded — proibido (sem regra ESLint hoje; pego em review/skill)
<div className="bg-[#116D45]" />
```

**Hex inline é proibido em código novo.** Hoje **não há regra ESLint** pra isso ([eslint.config.mjs](eslint.config.mjs) não tem `no-restricted-syntax`) — é pego em review e pelo skill `check-migration` (#5). Captura mental: `bg-[#…]`, `text-[#…]`, `border-[#…]`, `fill-[#…]`, `stroke-[#…]`. Triagem ao encontrar um:

1. Token existe? Grep `--color-arko-` em `global.css` — case comum, lookup esquecido.
2. Hex se repete no codebase? Promove a token no mesmo PR.
3. One-off legítimo? Deixa um comentário justificando pro reviewer (não há `eslint-disable` porque não existe a regra).

### Status palette — 3 famílias por superfície

Família errada produz semântica certa com visual errado (warning laranja num input que deveria ser amarelo, etc).

| Família             | Superfície                                            | Tokens                                                                                                      |
| ------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Badge/Modal/Sidebar | Filled tags, destructive buttons, nav accents         | `*-soft-bg`, `*-strong`, `*-strong-hover` (success/warning/danger)                                          |
| Saturated mid-tone  | Snackbar borders, Progress fills, Spinner, file icons | `warning-saturated` (#F68A1A), `danger-saturated` (#F25252)                                                 |
| Form/Input          | Input border + helper + icon, password meter          | `form-warning` (#F6C800), `form-warning-strong` (#B38E00); error reusa `danger-saturated` + `danger-strong` |

`info` family é Arko extension (`--color-arko-info`, `-bg`, `-fg`) — sem equivalente em design source, mantém. Surface-state extras: `text-arko-fg-on-solid` (label off-white em bg dark), `bg-arko-ink-950` (pressed state), `success-strong` (#116D45 = `green-800`).

### Canonical variants

Use a tabela. Tweak fora dela = override `className` no consumer (com gatilho de grep, ver acima).

| Component    | Variants                                                                                              | Sizes                                |
| ------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `Button`     | `solid \| outline \| text \| destructive`                                                             | `xs \| sm \| md-compact \| md \| lg` |
| `IconButton` | `solid \| outline \| text \| destructive \| brand`                                                    | `sm \| md \| lg`                     |
| `Badge`      | `success \| warning \| danger \| info \| neutral`                                                     | `md \| sm`                           |
| `Snackbar`   | `success \| warning \| danger \| information`                                                         | `sm \| md`                           |
| `Text`       | `h1..h5 \| body-lg/md/sm \| label \| caption \| eyebrow \| button-text \| numeric \| display-2xl..xs` | —                                    |

`Text` mantém variantes legacy (`xl/lg/md/sm/xs/xxs`) como Arko legacy permanente — prefira semânticas em código novo.

### Fonts

| Usage                     | Variable            | Font                  |
| ------------------------- | ------------------- | --------------------- |
| Display (titles, buttons) | `font-arko-display` | Montserrat Alternates |
| UI (body)                 | `font-arko-ui`      | Inter                 |
| Numeric/alt               | `font-arko-alt`     | Fustat                |

Loaded via Google Fonts em [index.html](index.html). Legacy `body { font-family: 'Montserrat' }` em `global.css` preservado — componentes que precisam Inter usam `<Text>` ou `font-arko-ui` explícito.

### Icons & Images

**Apenas `@phosphor-icons/react`** em todo o `src/`. Lucide e outras libs proibidas. Arquivo que ainda importe lucide é tech debt — migrar quando tocar. SVG pra logos/ícones/ilustrações; PNG só pra fotos/raster com textura.

### Tooltip — quando usar

`Tooltip` (`molecules/Tooltip`) revela info que **não está visível** — não é enfeite pra todo botão.

- **IconButton** (ícone sem texto) → tooltip obrigatório; `label` = mesmo texto do `aria-label`.
- **Button com texto visível** → sem tooltip (nunca repetir o label que já está na tela).
- **Desabilitado por motivo não óbvio / texto truncado / ajuda extra** → tooltip permitido.
- Ícone decorativo sem ação → nunca (tooltip é pra _trigger_).

### Component pattern

`forwardRef` + aceita `className`. `cn()` de `@/lib/cn` pra merge. Export: default + named + types.

**Tailwind-merge gotcha:** `text-arko-XX` (size) é classificado como **color** por tailwind-merge (prefixo `arko-` colide). Quando size + color coexistem no mesmo elemento, um é dropado. Workaround: use `text-[1rem]` literal pro size se o consumer for sobrescrever cor. Ref: commit `f3a2928`.

## React Version

React 19 — can use new React 19 features (`use()` hook, `useFormStatus`, etc.) when appropriate.

## Folder Notes

- `src/shared/utils/api/` — Axios instance with interceptors (`client.ts`)
- `src/modules/landing/constants/` — Landing page constants
- `src/shared/styles/` — Global CSS
