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

## PDF

`POST /api/v1/reports/pdf` — the same body, the same checks → `application/pdf` named
`relatorio-<loja>-<inicio>-a-<fim>.pdf` (20 per 15 min per store and user). Drawn by `pdfmake`
from the same `ReportDocument` (`reportPdfDefinition.ts`, `reportChartSvg.ts`, both pure and
tested): A4, the title and period, each section kept on one page, KPIs four per row with the
variation green or red by the KPI's `goodWhen`, charts as SVG (bars or lines, with a legend),
tables with the screens' formatting, the store and period in the header and "gerado em … ·
página x de y" in the footer, in the store's timezone. Font Manrope; print colours from
`reportPalette`. See `decisions/2026-09-25-report-pdf-with-pdfmake.md`.

## Automações (scheduled e-mail)

`report_schedule` (migration `report_schedule`): per store and user — name, sections, frequency
(`WEEKLY` with a weekday 1 = segunda … 7 = domingo, or `MONTHLY` with a day 1–28), hour in
the store's timezone, recipients (user ids), on/off, `lastSentAt`. Endpoints, all on the active
store and the person's own schedules (404 otherwise):

- `GET /reports/schedules` → `{ schedules, recipients }` — recipients are the person; staff also
  get the store's users.
- `POST /reports/schedules` (201), `PUT /reports/schedules/:id`, `DELETE /reports/schedules/:id`
  (204) — `reportScheduleSchema` (pt-BR messages: name, at least one section and one recipient,
  the day the frequency needs, hour 0–23); sections the person cannot see → 403; a recipient
  outside the list → 422; a recipient who does not see every chosen section (member areas, screens
  released to the store) → 422 naming the person; at most 10 schedules per person and store;
  30 writes per 15 min; names without control characters. Audit: "Criou / Alterou / Excluiu a automação de relatório …".

The worker registers `report.dispatch` every hour (`0 * * * *`): each enabled schedule of a live
store whose weekday or month day and hour match now in the store's timezone (`isDue`, pure) is
sent to `report.send` (no retries). Sending checks again that it is due, keeps only the
recipients whose current access covers every section (re-evaluated at each sending), claims the
slot atomically (`lastSentAt` compared and set in one update, so a slot goes out at most once), rebuilds the creator's access (a person who lost
the store or the area is skipped), builds the document for **last week** (weekly) or **last
month** (monthly) with the same code as the preview, renders the PDF and e-mails each recipient
still in the store: subject "<nome> — <loja> (<período>)", the first four indicators in the body,
the PDF attached, and who owns the automation, so a recipient knows whom to ask to leave
(`reportMail`, pure). A failing address does not stop the others. Then the audit line "Enviou o relatório
… para N destinatários" (N = e-mails accepted; actor: Relatório automático). Recipient ids of
people who left the store are dropped from the list the screen edits. The dev outbox writes the PDF next to the
message.

## Screen

On the Dashboard only, a **Relatório** button at the right of the top bar opens a sheet with two
tabs. **Automações** lists the person's schedules ("Toda segunda às 8h · 2 destinatário(s)",
"Pausada"), edits them in a form (nome, Semanal / Mensal, dia, hora da loja, destinatários,
seções, ativa) and deletes behind a confirmation. **Montar** holds the
model (Período da tela · Reunião semanal · Fechamento do mês), the period it covers, the
sections the person can see as checkboxes (the template ticks its own), **Baixar PDF** (the browser saves the file the API
rendered), **Pré-visualizar**, and the preview — the title, the period, then each section drawn with the design system's metric
tiles, the multi-series chart and the data table.
