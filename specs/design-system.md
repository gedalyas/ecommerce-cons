# Design system

Source of truth: `src/shared/ui` (components, flat) and `src/shared/styles`
(`global.css` with the CSS variables and type-scale utilities, plus the token
files). The Dashboard screen is
the canonical layout reference. `src/shared/ui/README.md` carries the
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
- All of the above live only in `shared/styles/`; screens never declare
  a color, size or spacing locally.
- Numbers/currency/dates formatted only through `src/shared/utils/format.ts`; numeric
  text gets the `num` class (lining-nums).
- Dependency direction: modules import from `shared/ui`, never the reverse
  (`shared/` knows no domain — enforced by lint).

## Layers

`src/shared/ui/` is flat: one `Component.tsx` per component and a
`component.types.ts` when its types are consumed elsewhere. The classification
below is a reading aid, not a folder.

- Tokens (`src/shared/styles/`) — colors (semantic, mirrored to CSS vars),
  typography, spacing + `layout` class recipes (page container, block rhythm,
  card padding), radius, shadows, breakpoints.
- Primitives — Button, Badge, Card, Divider, Tooltip, Input, Skeleton, plus the
  vendored shadcn pieces still in use (Calendar, Popover, Select).
- Patterns — MetricTile(-Group), KpiCard/metricToTile, FidelityBadge,
  StatusBadge, PillarCard, SectionPage, SectionBlock, PageHeader,
  RecommendationList, AlertBanner, ScrollShadow, PeriodSelector, DataTable,
  TimeSeriesChart, DonutBreakdown, IndicatorCarousel.
- Hooks (`src/shared/hooks/`) — `useBreakpoint`, `useScrollShadow`,
  `usePeriod`.

## Theme

Light theme only for now. The CSS defines a `.dark` custom variant hook but no
dark palette; adding one means defining the full variable set in `global.css`,
not per-component overrides.
