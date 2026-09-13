# Dashboard (`/`)

Module: `src/modules/dashboard`. Route loader calls `getDashboardOverview`
with the global params (`?inicio&fim&por&comparar&canal`); the payload is
`DashboardOverview` (`dashboard.types.ts`). Alerts, milestone and
recommendations still come from `dashboardFixture.ts`.

Header: title "Dashboard", subtitle "Visão consolidada de {período} · Loja
Aurora". Below it the controls row: `PeriodSelector` + `ChannelToggle`.

Blocks, in order:

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

## 5. "Precisa da sua atenção", "Marco de maturidade", "Recomendações em aberto"

Unchanged from the prototype (fixtures): three alert rows linking to their
sections; the four maturity criteria with progress bars ("2 de 4 critérios"
still hardcoded — see `data-layer-migration.md` step 3); the open
recommendations list.

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
