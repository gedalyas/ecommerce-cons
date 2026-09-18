# KPI and the data-fidelity seal

The KPI is the system's central component (`MetricTile` in `src/shared/ui`).

> **2026-09-18 — the seal is not shown.** The product owner chose not to expose the
> A/B/C level to anyone. The API keeps computing `fidelity` and `fidelityNote` on every
> `MetricValue` (the assistant's caveats and the alerts read them) and the consultant's
> manual KPI keeps its stored level, but no screen renders the badge, the "Nível X — …"
> note or the level picker. The section below documents the data model that remains.

## MetricTile

Each KPI shows:

- **Value** — large number (t-kpi scale, downscaled inside tile groups),
  formatted pt-BR via `formatPtNumbers`.
- **Label** — small muted text under the value.
- **Delta** — variation vs the previous month, colored by `deltaDirection`:
  `up` green, `down` red, `neutral` muted. Direction is semantic ("good/bad"),
  not the numeric sign: a CAC increase of +21% is `down` (bad, red).
- Optional `subNote` line.

`MetricTileGroup` lays tiles in a single bordered container with dividers;
2 columns up to `lg`, then 4 (or 3). With `bare` it drops border/background to
sit inside a `PillarCard`.

## Fidelity levels (A/B/C) — data only, not rendered

| Level | Meaning                                       |
| ----- | --------------------------------------------- |
| A     | Medido — direct from an integrated source     |
| B     | Aproximado — estimated/informed by the client |
| C     | Indicativo — qualitative judgement            |

`fidelityNote` copy pattern (Portuguese, always states the source and when):
"Nível B — CMV médio por categoria, informado pelo cliente em março." A metric that
combines sources inherits the worst level (`dashboardFidelity.ts`).

## Formatting rules

Never format numbers inline. `src/shared/utils/format.ts` (locale pt-BR) is the only
formatter: `formatNumber`, `formatCurrency` (BRL), `formatPercent` (input in
percentage points), `formatCompact`, `formatDate`, `formatPtNumbers` (fixes
separators inside fixture strings). Numeric text uses the `num` utility class
(lining-nums; Manrope's tabular comma opens a fake gap).
