# Design system (`src/shared/ui`)

Part of the shared kernel: it knows no domain. The **Dashboard** is the
canonical reference for layout, spacing and responsiveness: everything here was
extracted from it.

## Structure

Flat. One `Component.tsx` per component and a `component.types.ts` beside it
when the types are consumed outside the file. Tokens live in
`src/shared/styles/` (`global.css` + `colors.ts`, `typography.ts`, `spacing.ts`,
`radius.ts`, `shadows.ts`, `breakpoints.ts`); hooks in `src/shared/hooks/`.

## Allowed

- Import a component from its file: `@/shared/ui/DataTable`,
  `@/shared/ui/dataTable.types`. There is no barrel.
- Compose patterns inside a module.
- Use `layout.page`, `layout.blockStack`, `layout.cardPadding` from
  `@/shared/styles/spacing` for screen rhythm.

## Not allowed

- Declaring a color, spacing, radius, shadow, font size or breakpoint outside
  `src/shared/styles/`. No screen overrides these locally.
- Creating a new breakpoint. Only `sm 640`, `md 768`, `lg 1024`, `xl 1280`,
  `2xl 1536`.
- Formatting a number, currency, percentage or date in a screen — use
  `@/shared/utils/format` (and `@/shared/utils/metricFormat` for `MetricValue`).
- Importing from `@/modules/*`. The dependency direction is always
  module → shared, never the reverse (lint: `sharedKnowsNoDomain`).
- A widget that only one module uses. That widget belongs to the module.

## Reference layout (Dashboard)

| Item                            | Value                                       |
| ------------------------------- | ------------------------------------------- |
| Container                       | `max-w-5xl`, padding 16 / 24 (sm) / 32 (xl) |
| Between blocks                  | 24px on mobile, 32px from sm                |
| Between cards in the same group | 16px                                        |
| Card padding                    | 20px                                        |
| Metric tile group               | 2 columns up to lg, 4 (or 3) from lg        |
| Lists and tables                | stack into a card below `md`                |
| Floating button                 | 16px from the edges on mobile, 24px from md |

## Language

Component names, props, types, comments and file names are in English. Only the
strings rendered to the user are in Portuguese. See `specs/conventions.md`.
