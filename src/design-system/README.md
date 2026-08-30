# Design system

A cross-cutting layer, independent of any feature. The **Dashboard** is the
canonical reference for layout, spacing and responsiveness: everything here was
extracted from it.

## Structure

- `tokens/` — color, typography, spacing, radius, shadow and breakpoints.
- `primitives/` — Button, Badge, Card, Divider, Tooltip, Input, Skeleton.
- `patterns/` — compositions reused by more than one feature.
- `hooks/` — `useBreakpoint`, `useScrollShadow`.

## Allowed

- Import tokens and components from `@/design-system` or from the folder path.
- Compose patterns inside a feature.
- Use `layout.page`, `layout.blockStack`, `layout.cardPadding` for screen rhythm.

## Not allowed

- Declaring a color, spacing, radius, shadow, font size or breakpoint outside
  `tokens/`. No screen overrides these locally.
- Creating a new breakpoint. Only `sm 640`, `md 768`, `lg 1024`, `xl 1280`,
  `2xl 1536`.
- Formatting a number, currency, percentage or date in a screen — use
  `@/lib/format`.
- Importing from inside a feature. The dependency direction is always
  feature → design system, never the reverse.

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
