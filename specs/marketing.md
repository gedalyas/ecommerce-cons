# Marketing (`/marketing`)

Module: `src/modules/marketing`. The route validates
`?aba=visao|resumo|campanhas|descontos|regioes` plus the tab controls
(`marketingSchema.ts`: `incluirTaxa`, `metricaInvest`, `metricaSessoes`,
`base`, `utm`, `nivel`, `plataforma`, `metricaAds`); defaults are stripped
from the URL. `MarketingScreen` is a union on `aba`. The `TabBar` reads
**Visão · Resumo · Campanhas · Descontos · Regiões**; the period and channel controls
sit above it on every tab.

## Composition root

Marketing is read by money (ad spend behind the DRE) and by customers (ad
spend behind CAC), so it cannot import either. The route loader fetches
what the screen needs from those modules and hands it over:

- `getMarketingCostLines` (money contract) — the "Vendas e marketing" cost
  rules accrued over the period, one line per subcategory and business unit
  (`MarketingCostLine`). They travel inside the `getMarketingScreen` input
  as `custos`.
- `getRetentionSummary` (customers contract) — Recompra 90 dias and LTV 12
  meses for the Retenção pillar (Visão only).

**Investment** everywhere on the screen = paid media (`ad_spend_daily`
spend, plus the platform fee when "Incluir taxa da plataforma" is on) plus
those cost lines. Cost lines with business unit BOTH are split between
e-commerce and marketplace by revenue share.

## Business rules (`marketingRules.ts`, tested)

One file holds the rules that move with the market, not with a screen:

- **ROAS quality bands**: alto above 5x, médio from 2x to 5x, baixo below 2x
  (`roasQuality`).
- **Funnel benchmarks** (Prax §5.1 ranges, percent): Sessões → Visualizar item
  15–40 · Visualizar item → Carrinho 35–55 · Sessões → Carrinho 6–17,1 ·
  Sessões → Checkout 1,6–3,5 · Sessões → Pedidos pagos 0,5–1,4 · Carrinho →
  Checkouts 16,1–35,4 · Checkouts → Pedidos captados 32,2–62,8 · Pedidos
  captados → Pedidos pagos 81,1–91,8. `benchmarkVerdict` returns abaixo /
  dentro / acima.
- **LTV/CAC reference** 3 (`ltvCacReference`), also read by Clientes.
- **Channel bucket** of a UTM medium (`channelOf`): paid-social/cpc → Mídia
  paga · organic → Orgânico · social → Social · crm → E-mail · referral →
  Referência · otherwise Direto; marketplace orders bucket as Marketplace.

## Visão (`?aba=visao`)

The five pillars of the section (seeded from `marketingFixture.ts`) with the KPIs the
data module already covers replaced by live values
(`marketingScreenService.ts` › `marketingOverview`, current vs comparison):

| Pillar    | KPI                         | Formula                                                            |
| --------- | --------------------------- | ------------------------------------------------------------------ |
| Conversão | Taxa de conversão           | paid store orders ÷ sessions                                       |
| Conversão | Ticket médio                | paid revenue ÷ paid orders (respects the channel toggle)           |
| Conversão | Abandono de carrinho        | (add to cart − paid store orders) ÷ add to cart                    |
| Aquisição | CAC                         | investment ÷ customers whose first paid order is in the window     |
| Aquisição | ROAS geral                  | paid revenue ÷ investment                                          |
| Aquisição | Investimento em mídia       | investment (media + fee + cost lines)                              |
| Aquisição | Participação do maior canal | revenue share of the largest origem / meio (the label is the note) |
| Retenção  | Recompra 90 dias, LTV 12 m  | injected from customers                                            |

Presença e criativos and Canais paralelos stay on the seeded values. The
orange banner names the first data source in `ERROR` with its sync label
("Meta Ads não sincroniza há 6 dias"); no banner when every source is fine.

## Resumo (`?aba=resumo`)

1. **Desempenho por canal** — E-commerce · Marketplace · Total with
   Investimento · Receita · ROI · ROAS · CPA · Conversão. The "Incluir taxa
   da plataforma" checkbox (`incluirTaxa`, default on) folds the fee into the
   spend. Marketplace has no sessions (conversion —) and, in the seed, no
   marketing cost lines (investment R$ 0, CPA —). CSV.
2. **Investimento por categoria** — `DonutBreakdown`: Meta Ads · Google Ads
   · TikTok Ads · Taxa das plataformas (when included) · every cost line
   (Agência, E-mail marketing…), largest first.
3. **Investimento × métrica** — `ComboChart`: bars of media investment per
   bucket, line of `metricaInvest` (Total vendido · Investimento · ROAS ·
   ROI · CPA · CAC). CAC per bucket uses the new buyers of that bucket.
4. **Sessões × métrica** — bars of sessions or users (`base`), line of
   `metricaSessoes` (Total vendido · Taxa de conversão · Receita por sessão ·
   Custo por sessão).
5. **Funil de conversão** — six steps as bars: Sessões · Visualizar item ·
   Adicionado ao carrinho · Checkouts · Pedidos · Pedidos pagos (store
   orders captured and paid).
6. **Taxas de conversão** — the eight ratios with Período · Média da loja
   (the store's whole history up to today) · Referência de mercado ·
   Situação badge (Abaixo in orange, Acima in green, Dentro muted).
7. **Vendas por UTM** — `utm` picks Canal · Origem · Origem / meio ·
   Campanha; rows with Pedidos · Receita · Participação · Ticket médio.
   Marketplace orders appear by channel name in every dimension. CSV.

## Campanhas (`?aba=campanhas`)

Everything comes from `ad_spend_daily` (`adsService.ts`); the ratios are
derived once in `deriveAdRow` (`marketingMetrics.ts`): ROAS = attributed
revenue ÷ spend, CPA = spend ÷ conversions, CPM, CPC, CTR.

1. **Por plataforma** — one row per platform plus Total: Investimento ·
   Receita atribuída · ROAS (with the quality badge) · Conversões · CPA ·
   Impressões · CPM · Cliques · CPC · CTR. The fee checkbox is shared with
   Resumo. CSV.
2. **Plataformas no tempo** — `MultiSeriesChart`, one line per platform of
   `metricaAds` (the same ten metrics).
3. **Melhores e piores campanhas** — top 3 and bottom 3 by ROAS among the
   campaigns with spend in the period, each with ROAS and spend.
4. **Campanhas / Conjuntos de anúncios / Anúncios** — `plataforma` (Todas ·
   Meta · Google · TikTok) and `nivel` pick the rows; child levels show the
   parent names. Paged locally (10 per page), sortable, CSV of every row.

## Descontos (`?aba=descontos`)

Paid orders with at least one code in `discount_codes` (`discountsService.ts`).

1. **KPIs** (current vs comparison): Pedidos com cupom · Participação nos
   pedidos · Desconto concedido · Receita com cupom · Desconto médio
   (discounts ÷ gross) · Ticket médio com cupom · Ticket médio sem cupom.
2. **Desconto concedido × receita com cupom** — `DualSeriesChart` per bucket.
3. **Cupons** — one row per code: Pedidos · Primeiras compras (orders that
   were the customer's first, i.e. the new customers the coupon brought) ·
   Receita · Desconto concedido · Desconto médio · Ticket médio. CSV.

## Regiões (`?aba=regioes`)

Where the media converts best, by UF. Media comes from `ad_spend_region_daily`, the geographic
breakdown of the paid media per day and platform (seeded by splitting each day's platform
totals across the 27 UFs with the store's regional weights and a ROAS factor per state); sales
are the paid store orders by delivery UF, with buyers, new buyers and repeat orders.
`regionPerformance.ts` (tested) joins the two and derives the ratios.

1. **Big numbers** — Gasto total · ROAS geral (with the quality band) · Melhor ROAS · Pior
   ROAS (among states with spend).
2. **Mapa** — `BrazilTileMap` coloured by `mapa` (ROAS · Total vendido · Gasto total · CAC);
   the "Incluir taxa da plataforma" checkbox is shared with the other tabs.
3. **Desempenho regional** — Estado · Investimento Meta · Google · TikTok · Gasto total ·
   Total vendido · ROAS · CPM · CPC · CPA · CAC · Clientes · Ticket médio · Taxa de recompra,
   with a total row. CSV.

## Fidelity

Traffic-based figures (conversion, funnel, sessions) are level A on the
seed but level B in production copy because of mobile tracking loss; media
figures are level B while Meta Ads is out of sync; coupon figures are level
A (they come from the orders themselves).
