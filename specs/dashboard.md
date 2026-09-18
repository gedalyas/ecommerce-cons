# Dashboard (`/`)

Module: `src/modules/dashboard`. Route loader calls `getDashboardOverview`
with the global params (`?inicio&fim&por&comparar&canal`); the payload is
`DashboardOverview` (`dashboard.types.ts`). Alerts are derived from the data
(`src/modules/alerts`); milestone criteria and open recommendations come from
the database through `consulting/contract.server.ts`.

Header: title "Dashboard", subtitle "Visão consolidada de {período}" and, on
the right, the "Personalizar" button. The period, granularity, comparison and
channel come from the global filter in the top bar (`specs/layout-and-navigation.md`);
the screen has no controls row of its own.

## Blocks are widgets the user arranges

The dashboard is a grid of widgets (two columns from `md`; a widget is
"Linha inteira" or "Meia linha"). Which widgets show, in which order and at
which width is a per-user, per-store layout (`dashboard_layout`, one row per
`user_id` × `client_id`) returned inside `GET /dashboard` as `layout` and
saved through `PUT /dashboard/layout` (`dashboardLayoutSchema`). A layout that
is missing, empty or only made of unknown kinds falls back to
`defaultDashboardLayout`; unknown kinds and duplicates are dropped on read
(`normalizeDashboardLayout`, `contracts/dashboard/dashboardLayoutRules.ts`).

The catalog (`contracts/dashboard/dashboardWidgets.ts`), each kind at most once:

| Kind                  | Widget                       | Data                                                                   |
| --------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| `headline`            | Indicadores em destaque      | §1                                                                     |
| `indicator`           | Evolução do indicador        | §2                                                                     |
| `revenueVsInvestment` | Receita × investimento       | `series.marketingInvestment` (bars) × `series.totalSold`               |
| `channelSplit`        | Vendas por canal             | `channelSplit`: paid revenue per bucket, e-commerce × marketplace      |
| `bySource`            | Vendas por origem            | §3                                                                     |
| `topProducts`         | Produtos mais vendidos       | `topProducts`: ten best sellers by paid revenue (`productSales`)       |
| `customerMix`         | Clientes novos × recorrentes | `customerMix`: buyers of the period split by first order               |
| `funnel`              | Funil do e-commerce          | `funnel`: sessions → produto visto → carrinho → checkout → paid orders |
| `paidMedia`           | Mídia paga                   | `paidMedia`: ad spend (bars) × attributed revenue per bucket           |
| `matrix`              | Resumo financeiro            | §4                                                                     |
| `alerts`              | Precisa da sua atenção       | §5                                                                     |
| `milestone`           | Marco de maturidade          | §5b                                                                    |
| `recommendations`     | Recomendações em aberto      | §5b                                                                    |

The default layout: headline, indicator (full), then revenue × investment,
channel split, by source, top products, customer mix and funnel (half), then
alerts, milestone and recommendations (full). `paidMedia` and `matrix` start
out of the board.

"Personalizar" opens the dialog "Personalizar dashboard": the chosen widgets
as a sortable list (drag handle, icon, name and description, Linha inteira /
Meia linha, remove), "Adicionar bloco" chips for the kinds not on the board,
Cancelar / Salvar. Salvar is enabled only when something changed and at least
one widget remains; it PUTs the whole layout and invalidates the router.

Sections below describe each widget's data.

## 1. Headline KPI row

`MetricTileGroup` with four tiles built from the live metrics:

| Tile                   | Metric key           | Direction                         |
| ---------------------- | -------------------- | --------------------------------- |
| Faturamento            | `totalSold`          | up is good                        |
| Margem de contribuição | `contributionMargin` | up is good                        |
| CAC                    | `cac`                | down is good (an increase is red) |
| Recompra               | `repurchaseRate`     | up is good                        |

Each tile shows the variation against the comparison window ("vs 13/07 –
11/08") and the fidelity seal derived from the data sources (see §6).

## 2. "Resumo do período"

`IndicatorCarousel` with the ten indicators — Total vendido · Pedidos ·
Ticket médio · Taxa de conversão · Investimento em marketing · ROI · CAC ·
CPA · Lucro líquido · Clientes. The selected chip drives the big number, its
fidelity note and a `TimeSeriesChart` (solid = current period, dashed =
comparison) bucketed by `por`.

Formulas (`dashboardMetrics.ts`, unit-tested):

- Total vendido = paid revenue; Pedidos = paid orders; Ticket médio =
  revenue ÷ orders; Clientes = distinct buyers.
- Taxa de conversão = store orders ÷ sessions (null for the marketplace channel).
- Investimento em marketing = ad spend + platform fee + `SALES_MARKETING`
  cost rules (cost engine, `money` module).
- ROI = (revenue − investment) ÷ investment (multiplier); CAC = investment ÷
  new customers; CPA = investment ÷ orders — all null for the marketplace
  channel, which has no paid media.
- Margem de contribuição = (revenue − COGS − COGS-category rules −
  investment) ÷ revenue; Lucro líquido = that contribution − operational rules.
- Recompra = paid orders that are the customer's 2nd+ order ÷ paid orders.

## 3. "Vendas por origem"

`DonutBreakdown` of paid revenue by traffic source: `utm_source / utm_medium`
for the store, channel name (Mercado Livre, Shopee) for marketplaces.

## 4. "Resumo financeiro"

`DataTable` matrix: one row per metric (the ten above plus Margem de
contribuição and Recompra), one column per bucket of the period, values
formatted by unit, "Exportar CSV" with raw numbers. Scrolls horizontally when
the period has many buckets.

## 5. "Precisa da sua atenção" — alerts derived from the data

Module `src/modules/alerts`: `alertsService.ts` gathers the facts through the
orders, marketing and products contracts and `alertRules.ts` (tested) decides.
The windows are fixed relative to `PROTOTYPE_TODAY`: the last 7 days against
the 7 before, and the stock at the pace of the last 30 days. Every alert links
to the screen and tab that explains it.

| Alert (Prax name)                   | Rule                                                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Queda de vendas                     | paid revenue of the last 7 days fell ≥ 15% against the 7 before                                       |
| Queda de tráfego                    | sessions fell ≥ 15% on the same windows                                                               |
| Queda de vendas do produto          | up to 2 products with ≥ 10 units the week before that fell ≥ 40%, biggest first                       |
| Risco de baixo estoque              | variants selling ≥ 10 units / 30 days whose stock covers < 14 days; the one that runs out first named |
| Variantes importantes indisponíveis | among the top 10% variants by 90-day units, the ones with zero stock                                  |

"Queda de conversão do produto" needs per-product sessions, which the seed
does not have; it joins when that table exists. Thresholds live in
`alertThresholds`. The block reads "Nenhum alerta no momento." when nothing
fires. Alerts are recomputed on every load — there is no read/resolved state
yet (the Prax bell drawer with ABERTOS · RESOLVIDOS · PREFERÊNCIAS is a
follow-up).

## 5b. "Marco de maturidade", "Recomendações em aberto"

The maturity criteria (`milestone_criterion`) with progress bars and the
"N de M critérios" count (achieved ÷ total, the same number the sidebar
shows); the open recommendations not tied to a pillar (`recommendation`
with `pillar_id` null and `done_at` null).

## 6. Fidelity per metric

`dashboardFidelity.ts` maps each metric to the data sources it depends on
(sales → Bling + Loja; conversion → Loja + Google Analytics; paid-media
metrics → Meta Ads + Google Ads) and takes the weakest: connected = A, error
or manual import = B, not connected = C. Metrics that use the cost rules the
client informs by hand are capped at B. The note names the culprit ("Meta
Ads sem sincronizar (há 6 dias)"). This is the per-metric degradation that
replaces the competitor's full-screen "connect a source" gate.

## 7. Errors

A failed loader renders `RequestError` ("Falha na requisição") with a retry
that invalidates the router.
