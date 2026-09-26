# Relatório (Dashboard › Relatório)

Modules: `packages/contracts/src/reports` (the document model, the section catalogue, the
templates, the request schema, who sees which section), `apps/api/src/modules/reports` (fetch
the numbers, build the document) and `apps/web/src/modules/reports` (the button, the builder,
the preview). Plan: `growth-plan.md` › G5.

## The document

A report is a platform-neutral `ReportDocument`: title, store, range, generation time and
sections, each with blocks — `kpis` (label + `MetricValue`), `chart` (bars or lines, unit,
buckets, series of raw numbers), `table` (typed columns, raw cells) and `note` ("Sem dados no
período."). Numbers travel raw; the web preview, a future mobile screen and the server PDF
format them. The API builds it in the pure `reportDocumentOf` from the same services the screens
use (`dashboardOverview`, `marketingScreen`), so the report never disagrees with a screen.

| Section                | Source                             | Blocks                                               |
| ---------------------- | ---------------------------------- | ---------------------------------------------------- |
| Indicadores do período | Dashboard metrics (the carousel's) | KPIs                                                 |
| Vendido × Investido    | Dashboard series                   | Lines                                                |
| ROAS por canal         | Dashboard `roasByChannel`          | Table                                                |
| Canais de venda        | Dashboard `channelSplit`           | Bars                                                 |
| Produtos mais vendidos | Dashboard `topProducts` (10)       | Table                                                |
| Funil de vendas        | Dashboard `funnel`                 | Table                                                |
| Meta Ads / Google Ads  | Marketing › Meta / Google          | KPIs (compras as reported counts) + top 10 campaigns |
| Funil de investimento  | Marketing › Funil de investimento  | Total + table by stage                               |
| Vendas por canal       | Marketing › Vendas por canal       | Table                                                |

Marketing sections need the Marketing area (members) and the Marketing screen released to the
store (clients); `sectionsVisibleTo` decides what the builder offers and the API refuses the
rest with 403. Templates: **Reunião semanal** (last week, Monday to Sunday) and **Fechamento do
mês** (last month); "Período da tela" keeps the period chosen in the top bar.

## Endpoint

`POST /api/v1/reports/preview` — body `{ sections, inicio, fim, por?, comparar?, canal? }`
(`reportRequestSchema`: at least one known section, a range of at most one year) → the
`ReportDocument`. 60 per 15 min per store and user. An empty store answers zeros, "—" and notes,
never an error.

## Screen

On the Dashboard only, a **Relatório** button at the right of the top bar opens a sheet: the
model (Período da tela · Reunião semanal · Fechamento do mês), the period it covers, the
sections the person can see as checkboxes (the template ticks its own), **Pré-visualizar**, and
the preview — the title, the period, then each section drawn with the design system's metric
tiles, the multi-series chart and the data table.
