# KPI and the data-fidelity seal

The KPI is the system's central component (`MetricTile` + `FidelityBadge` in
`src/design-system/patterns`).

## MetricTile

Each KPI shows:

- **Value** — large number (t-kpi scale, downscaled inside tile groups),
  formatted pt-BR via `formatPtNumbers`.
- **Label** — small muted text under the value.
- **Delta** — variation vs the previous month, colored by `deltaDirection`:
  `up` green, `down` red, `neutral` muted. Direction is semantic ("good/bad"),
  not the numeric sign: a CAC increase of +21% is `down` (bad, red).
- **Fidelity seal** — top-right corner.
- Optional `subNote` line.

`MetricTileGroup` lays tiles in a single bordered container with dividers;
2 columns up to `lg`, then 4 (or 3). With `bare` it drops border/background to
sit inside a `PillarCard`.

## Fidelity seal (A/B/C)

16×16px, 4px radius, 10px semibold, with an explanatory tooltip:

| Level | Meaning                                       | Rendering                      |
| ----- | --------------------------------------------- | ------------------------------ |
| A     | Medido — direct from an integrated source     | solid (primary bg, white text) |
| B     | Aproximado — estimated/informed by the client | outlined (primary border/text) |
| C     | Indicativo — qualitative judgement            | light gray (muted bg)          |

Tooltip copy pattern (Portuguese, always states the source and when):
"Nível B — CMV médio por categoria, informado pelo cliente em março."

The original spec calls for B/C values to render in a lighter weight than A;
tiles currently render all values at the same weight — treat that as an open
refinement, not a regression to preserve.

## Formatting rules

Never format numbers inline. `src/lib/format.ts` (locale pt-BR) is the only
formatter: `formatNumber`, `formatCurrency` (BRL), `formatPercent` (input in
percentage points), `formatCompact`, `formatDate`, `formatPtNumbers` (fixes
separators inside fixture strings). Numeric text uses the `num` utility class
(lining-nums; Manrope's tabular comma opens a fake gap).
