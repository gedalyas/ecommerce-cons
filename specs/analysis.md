# Métricas (`/metricas`)

Module: `src/modules/analysis`. The route validates `?metrica=<key>` (default `totalSold`) on
top of the global period params; defaults are stripped from the URL. Sidebar entry under
"Dados". The screen turns the dashboard into a diagnosis: one metric, a verdict, the comparison
window, the time series and the drivers that explain the result.

## The fourteen metrics

Total vendido · Pedidos · Sessões · Conversão · Ticket médio do pedido · Taxa de recompra ·
Taxa de desconto · Taxa de cancelamento e reembolso · ROAS · ROI · CPA · CAC · CPS (custo por
sessão) · CPC (custo por clique). Every value comes from `computeValues` (`driverTrees.ts`,
tested) over the facts of a window: paid revenue and orders, captured orders, repeat orders,
items, discounts, product revenue, sessions / users / new users, ad spend + platform fee,
clicks, impressions, buyers / new buyers, and the "Vendas e marketing" cost rules. Cancellation
is approximated as captured orders that are not paid (pending included).

## Driver trees (`driverTrees.ts`)

The AI does not discover the drivers: each metric has a tree defined in code, calculated in both
periods, and the text is written from it. The section title follows the nature of the metric —
**"O que impulsionou isso"** for result metrics, **"Sinais relacionados"** for efficiency ones.

| Metric           | Drivers                                                            |
| ---------------- | ------------------------------------------------------------------ |
| Total vendido    | Sessões · Conversão · Ticket médio · Taxa de desconto              |
| Pedidos          | Sessões · Conversão · Taxa de recompra · Novos clientes            |
| Sessões          | Investimento em anúncios · Cliques · CPC · Proporção de novas      |
| Conversão        | Pedidos · Sessões · Proporção de novas sessões · Desconto · Ticket |
| Ticket médio     | Itens por pedido · Taxa de desconto · Pedidos                      |
| Taxa de recompra | Clientes recorrentes · Novos clientes · Clientes compradores       |
| Taxa de desconto | Descontos · Total vendido · Pedidos · Ticket                       |
| Cancelamento     | Pedidos captados · Pedidos pagos · Ticket                          |
| ROAS             | Investimento em anúncios · Total vendido · Conversão · Ticket      |
| ROI              | Investimento total · Total vendido · CPA                           |
| CPA              | Investimento total · Pedidos · Conversão · CPC                     |
| CAC (%)          | Investimento total · Total vendido · ROAS · CPA                    |
| CPS              | Investimento total · Sessões · CPC                                 |
| CPC              | Investimento em anúncios · Cliques · CTR                           |

Each metric also carries three levers (the recommendations of the second paragraph): traffic,
checkout and bundles for revenue; page speed, PDP clarity and traffic quality for conversion;
budget reallocation and landing pages for ROAS; post-sale flows, loyalty and second-purchase
coupons for repurchase, and so on.

## Page

1. **Controls** — metric `Select` + `PeriodSelector`; "Baixar PDF" prints the page.
2. **Context line** — "Período analisado: … · Comparado com …" (the comparison window comes
   from the global `comparar` param; "Sem comparação" when it is `nenhum`).
3. **Analysis card** (`narrative.ts`, tested) — verdict badge (Positivo / Neutro / Negativo:
   direction of the variation against the metric's `goodWhen`, ±2% neutral band), benchmark
   badge (conversion uses the Prax sessions → paid range, ROAS the quality bands, otherwise
   "Benchmark indisponível"), a title with the variation, a diagnosis paragraph (the move, the
   two strongest drivers with before → after, the market reading) and a levers paragraph. A
   footnote says the text is rule-generated from the driver tree; with an AI key the same tree
   would become natural language.
4. **Headline KPI** — the metric in capitals, the value, the variation, and the
   `TimeSeriesChart` with the comparison as a dashed line.
5. **Drivers** — one tile per driver: value, variation and the previous value, green when it
   moved in the good direction for the metric, orange otherwise.

Server function: `getAnalysisScreen` (GET). Small currency values (under R$ 10, e.g. CPC) are
formatted with cents by `formatMetric`.
