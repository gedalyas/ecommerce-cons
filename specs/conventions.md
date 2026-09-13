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
`src/routes.ts` maps English files to Portuguese paths. To add a screen:

1. create `src/routes/<english-name>.tsx` (head + component import only),
2. add `route("/<caminho-em-portugues>", "<english-name>.tsx")` to
   `src/routes.ts`,
3. put the screen in `src/modules/<domain>/<Domain>.tsx` and publish it through
   `src/modules/<domain>/contract.ts`.

Status-like values are English (`done`, `in-progress`, `blocked`,
`connected`, ...); their Portuguese labels live next to the component that
renders them (e.g. `statusLabel` in `StatusBadge/types.ts`).

## Project structure

The folder is the business domain, the layer is the file — see
`specs/architecture.md` for the rules and `eslint.config.js` for what enforces
them.

```
src/
  routes.ts            virtual route map (URL ↔ file)
  routes/              composition root: thin route files + __root.tsx
  modules/<domain>/    flat; contract.ts (isomorphic) + contract.server.ts (services)
  shared/              kernel without domain knowledge
    ui/                design system, flat (Component.tsx + component.types.ts)
    styles/            global.css + token files
    layout/            AppShell, Sidebar, BottomNav
    hooks/ utils/ models/types/ config/ dependencies/
  generated/prisma/    Prisma Client output (gitignored)
prisma/                schema.prisma, migrations/, seed.ts, seedAnalytics.ts
scripts/               checkCycles.ts, cyclicFiles.ts, generate-favicon.mjs
specs/                 these documents + decisions/ (ADRs)
```

## Code style

- Prettier + ESLint (flat config); `npm run lint`, `npm run format`,
  `npm run check:cycles` (files inside import cycles, capped at 0 in CI).
- TypeScript strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` —
  keep them on.
- Generated files (`src/routeTree.gen.ts`, `src/generated/`) are excluded from
  lint/format and never edited by hand.
- Files: `camelCase.ts`; `PascalCase.tsx` only when the file exports a
  component. No kebab-case, no `index.ts` barrels (`contract.ts` is the one
  hand-written exception). Role suffixes: `*Controller.ts`, `*Service.ts`,
  `*Schema.ts`, `*.types.ts`, `*Fixture.ts`, `use*.ts`, `*.test.ts`.
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
