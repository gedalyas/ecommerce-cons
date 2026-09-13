# Conventions

## Language rule

The project separates _what the user reads_ from _what the developer reads_:

| Surface                                                     | Language                                             |
| ----------------------------------------------------------- | ---------------------------------------------------- |
| Rendered strings, aria-labels, `head()` titles/descriptions | **Portuguese (pt-BR)**                               |
| URLs (paths the user sees)                                  | **Portuguese** — `/dinheiro`, `/gestao`, `/conexoes` |
| File and folder names                                       | **English**                                          |
| Identifiers, props, types, enum/status values, data keys    | **English**                                          |
| Comments, commit messages, developer docs (specs, READMEs)  | **English**                                          |
| User-facing copy stored in fixtures or the database         | **Portuguese** (it is copy)                          |

The route-file/URL split is implemented with TanStack virtual file routes:
`apps/web/src/routes.ts` maps English files to Portuguese paths. To add a
screen:

1. declare its payload and query schema in `packages/contracts/src/<domain>/`,
2. serve it from `apps/api/src/modules/<domain>/` (router + controller +
   service) and mount the router in `apps/api/src/app.ts`,
3. create `apps/web/src/routes/<english-name>.tsx` (head + loader + component),
4. add `route("/<caminho-em-portugues>", "<english-name>.tsx")` to
   `apps/web/src/routes.ts` and restart the web dev server,
5. put the screen in `apps/web/src/modules/<domain>/<Domain>.tsx`, the BFF
   server function in `<domain>Controller.ts`, and publish both through
   `contract.ts`.

Status-like values are English (`done`, `in-progress`, `CONNECTED`, ...);
their Portuguese labels live next to the closed set in `packages/contracts`
(`pillarStatuses`, `dataSourceStatuses`, `costFrequencyLabel`).

## Project structure

The folder is the business domain, the layer is the file — see
`specs/architecture.md` for the rules and `eslint.config.js` for what enforces
them.

```
apps/web/src/
  routes.ts            virtual route map (URL ↔ file)
  routes/              composition root: thin route files + __root.tsx (session guard)
  modules/<domain>/    flat; contract.ts; <domain>Controller.ts is the BFF (apiFetch)
  shared/              kernel without domain knowledge
    ui/                design system, flat (Component.tsx + component.types.ts)
    styles/ layout/ hooks/ utils/ dependencies/ (apiClient, session)
apps/api/src/
  app.ts, index.ts     composition root and boot
  modules/<domain>/    flat; contract.ts; <domain>Router.ts, Controller, Service, rules
  shared/              config/env.ts, http/ (errors, validate, coerceQuery, auth)
packages/contracts/src/<domain>/ + shared/   types, schemas, closed sets, formatters
packages/database/     prisma/ (schema, migrations, seed, fixtures), src/ (client)
scripts/               checkCycles.ts, cyclicFiles.ts, generate-favicon.mjs, make-helpers.mjs
specs/                 these documents + decisions/ (ADRs)
```

## Code style

- Prettier + ESLint (flat config); `npm run lint`, `npm run format`,
  `npm run check:cycles` (files inside import cycles, capped at 0 in CI).
- TypeScript strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` —
  keep them on.
- Generated files (`apps/web/src/routeTree.gen.ts`,
  `packages/database/src/generated/`) are excluded from lint/format and never
  edited by hand.
- Files: `camelCase.ts`; `PascalCase.tsx` only when the file exports a
  component. No kebab-case, no `index.ts` barrels (`contract.ts` is the one
  hand-written exception). Role suffixes: `*Router.ts`, `*Controller.ts`,
  `*Service.ts`, `*Schema.ts`, `*.types.ts`, `*Sets.ts`, `*Fixture.ts`,
  `use*.ts`, `*.test.ts`.
- Named exports everywhere; identifiers in English (accents are a lint error).
- Pure functions ship with a colocated `foo.test.ts` (vitest).

## Database naming

Prisma models/fields in English camelCase, mapped to snake_case tables and
columns via `@@map`/`@map`. Enums in SCREAMING_CASE. Display copy columns
(labels, notes, recommendation text) store Portuguese.

## Git

- Commit messages in English, imperative, `<type>: <description>` (`feat`, `fix`, `chore`,
  `docs`, `style`, `refactor`, `test`) — see `CLAUDE.md`.
- `main` is the default branch. The Lovable sync constraint no longer applies;
  normal history rules (no force-push to shared branches) still do.
