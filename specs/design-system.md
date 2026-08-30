# Design system

Source of truth: `src/design-system` (tokens, primitives, patterns, hooks) and
`src/styles.css` (CSS variables, type-scale utilities). The Dashboard screen is
the canonical layout reference. `src/design-system/README.md` carries the
day-to-day rules; this spec records the intent.

## Visual language

Clean, professional, financial-analysis look. Light background, white cards
with subtle borders, slightly rounded corners, no heavy shadows, no gradients
(the scroll shadows are the single exception). **One accent color** — dark
green `#0F6E56` — with orange `#B45309` reserved for warnings and red
`#B91C1C` for negatives. Sans-serif (Manrope), big legible numbers, medium
density.

## Hard constraints

- **Type scale**: exactly 6 sizes — `t-label` 11, `t-meta` 13, `t-body` 15,
  `t-card-title` 17, `t-section-title` 24, `t-kpi` 32. Weights 400 and 600 only.
- **Spacing scale**: 4, 8, 12, 16, 24, 32, 48px.
- **Radii**: 8px card, 6px button/input, 4px seal/badge.
- **Shadows**: `shadow-sm` at rest, `shadow-md` hover/overlay, `shadow-lg`
  drawer/modal.
- **Breakpoints**: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536` — no
  new ones.
- All of the above live only in `tokens/` + `styles.css`; screens never declare
  a color, size or spacing locally.
- Numbers/currency/dates formatted only through `src/lib/format.ts`; numeric
  text gets the `num` class (lining-nums).
- Dependency direction: features import from the design system, never the
  reverse.

## Layers

- `tokens/` — colors (semantic, mirrored to CSS vars), typography, spacing +
  `layout` class recipes (page container, block rhythm, card padding),
  radius, shadows, breakpoints.
- `primitives/` — Button, Badge, Card, Divider, Tooltip, Input, Skeleton.
- `patterns/` — MetricTile(-Group), FidelityBadge, StatusBadge, PillarCard,
  SectionPage, SectionBlock, PageHeader, RecommendationList, AlertBanner,
  ScrollShadow.
- `hooks/` — `useBreakpoint`, `useScrollShadow`.

`src/components/ui/` holds the stock shadcn/ui components; app code prefers
the design-system primitives and treats `components/ui` as vendored support
material (some patterns wrap it, e.g. Tooltip).

## Theme

Light theme only for now. The CSS defines a `.dark` custom variant hook but no
dark palette; adding one means defining the full variable set in `styles.css`,
not per-component overrides.
