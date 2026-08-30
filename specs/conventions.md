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
3. put the screen in `src/features/<english-name>/index.tsx`.

Status-like values are English (`done`, `in-progress`, `blocked`,
`connected`, ...); their Portuguese labels live next to the component that
renders them (e.g. `statusLabel` in `StatusBadge/types.ts`).

## Project structure

```
src/
  routes.ts            virtual route map (URL ↔ file)
  routes/              thin route files + __root.tsx (shell, meta, errors)
  features/<area>/     index.tsx (screen), data/ (fixtures), components/
  design-system/       tokens / primitives / patterns / hooks
  layout/              AppShell, Sidebar, AssistantPanel, BottomNav
  components/ui/       stock shadcn/ui (vendored)
  lib/                 format.ts, utils.ts, error handling
  generated/prisma/    Prisma Client output (gitignored)
prisma/                schema.prisma, migrations/, seed.ts
specs/                 these documents
scripts/               generate-favicon.mjs
```

## Code style

- Prettier + ESLint (flat config); `npm run lint` and `npm run format`.
- TypeScript strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` —
  keep them on.
- Generated files (`src/routeTree.gen.ts`, `src/generated/`) are excluded from
  lint/format and never edited by hand.
- Components: one folder per pattern/primitive with `Component.tsx`,
  `types.ts`, `index.ts` barrel.

## Database naming

Prisma models/fields in English camelCase, mapped to snake_case tables and
columns via `@@map`/`@map`. Enums in SCREAMING_CASE. Display copy columns
(labels, notes, recommendation text) store Portuguese.

## Git

- Meaningful, imperative commit messages in English.
- `main` is the default branch. The Lovable sync constraint no longer applies;
  normal history rules (no force-push to shared branches) still do.
