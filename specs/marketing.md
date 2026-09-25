# Marketing (`/marketing`)

Module: `src/modules/marketing`. The route validates
`?aba=geral|meta|google|site|canais|funil|visao|resumo|campanhas|descontos|regioes|social` plus the tab controls
(`marketingSchema.ts`: `incluirTaxa`, `metricaInvest`, `metricaSessoes`,
`base`, `utm`, `nivel`, `plataforma`, `metricaAds`); defaults are stripped
from the URL. `MarketingScreen` is a union on `aba`. The `TabBar` reads
**Visão · Resumo · Campanhas · Descontos · Regiões · Social**; the period and channel controls
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

## Visão geral (`?aba=geral`, the default)

First slice of G4 (`growth-plan.md`, the Looker coverage). Payload `MarketingGeneral` from
`marketingGeneralService.ts` (pure `generalMetrics.ts`, tested); honours the global channel on sales.

1. **KPIs with Δ** — Vendido (ERP/spreadsheet orders), Investido (ad spend + platform fee when
   "Incluir taxa"), ROAS do site (site sales ÷ the investment of the campaigns tagged to the site on Funil de
   investimento, the same split as the dashboard tile — also in the year number and the line), MER (all sales ÷ investido + marketing cost
   lines, the same lines for the comparison period), Pedidos, Ticket médio, Conversão (site orders ÷
   sessions), Sessões — each with its glossary ⓘ.
2. **Ano e projeção do mês** — Vendido no ano (investido as a note), ROAS do site no ano, and the
   month-end run-rate of vendido and investido (`monthEndProjection`: month-to-date ÷ days elapsed ×
   days in month, on the API clock).
3. **Vendido × investido** — `ComboChart` bars Vendido and Investido, line ROAS do site; `serie`
   picks the last 12 months (Mensal) or the period at its granularity (No período). Buckets
   without ad spend leave a gap in the line, never a zero.
4. **Sessões × taxa de conversão** — bars Sessões and Novos usuários, line Conversão; same picker.
5. **Funil do site** — Sessões → Visualizar item → Carrinho → Checkout → Pedidos → Pedidos pagos,
   each with the pass-through from the step above and the Δ vs the comparison (`FunnelSteps`).
6. **Mídia por plataforma** — per ad platform: Investido, CPC, Conversões informadas (the
   platform's count, never a sale) and Custo por conversão, each with Δ.

The consulting pillars moved to the **Pilares** tab (`?aba=visao`).

## Meta Ads (`?aba=meta`)

The Meta Ads account seen alone (G4). Payload `MarketingPlatformTab` from `platformTabService.ts`
(queries in `adsDepthService.ts`, pure `adDepth.ts`, tested); the same payload serves the Google Ads
tab. Conversions are the platform's own count — never a sale; sales stay with the ERP or the
spreadsheet.

1. **Conta** — `conta` filters one ad account (`todas` by default); the select shows only with
   two or more accounts and resets the drill.
2. **KPIs with Δ** — Investido, Alcance, CPM, CTR, CPC, Conversões, Custo por conversão, Custo por
   sessão (spend ÷ paid sessions), each with its glossary ⓘ.
3. **Investido × custo por conversão** and **Sessões pagas × custo por sessão** — `ComboChart`,
   `serie` Mensal (12 months) or No período. Paid sessions are GA4 sessions whose source is the
   platform's (`meta`, `facebook`, `instagram`, `fb`, `ig`) and whose medium is paid (`cpc`,
   `paid-social`, `paid`, `ppc`…).
4. **Do anúncio ao carrinho** — Impressões → Cliques no link → Visualizações da página → Sessões
   pagas → Adições ao carrinho.
5. **Leads e conversas** — leads, conversations started and cost per lead.
6. **Campanhas / Conjuntos / Anúncios** — `nivel` picks the level; clicking a campaign opens its
   ad sets (`campanha`), clicking an ad set opens its ads (`conjunto`); "Ver todas as campanhas"
   clears the drill. Columns: investment, impressions, reach, CPM, link clicks, CTR, CPC, page
   views, carts, conversions, cost per conversion, Δ cost per conversion (vs the comparison),
   leads, conversations; CPM, CTR, CPC, conversions and cost per conversion are heat-shaded;
   ads show the creative thumbnail. Total row and CSV export.

## Google Ads (`?aba=google`)

Same payload and component as Meta Ads (`platformTab(clientId, "GOOGLE", input)`), with the Google
layout (`platformLayouts.ts`):

1. **KPIs with Δ** — Investido, Impressões, Parcela de impressões, CTR, CPC, Conversões, Custo por
   conversão, Custo por sessão. Impression share = Σ impressions ÷ Σ eligible impressions, both
   only over rows that report eligible impressions (Search), so Performance Max never inflates it.
2. The same two combo charts; **Do anúncio ao site** — Impressões → Cliques → Sessões pagas → Custo
   por sessão. No leads block.
3. **Campanhas / Grupos de anúncios / Anúncios** — campaign type column (`campaignTypeLabelOf`:
   Pesquisa, Performance Max, Shopping…, an unknown type shown as sent), Δ investimento, Δ
   conversões and Δ custo por conversão vs the comparison, impression share heat-shaded.
4. **Palavras-chave** — `ad_keyword_daily` grouped by ad group + keyword + match type (Exata,
   Frase, Ampla), honouring the account, campaign and ad group opened above; CTR, CPC, conversions
   and cost per conversion, heat-shaded, CSV.

## Site (`?aba=site`)

The store's site as GA4 sees it. Payload `MarketingSiteTab` from `siteTabService.ts` (pure
`siteMetrics.ts`, tested). All site traffic, every source; the global channel does not apply.
Purchases here are GA4 counts ("compras informadas"), never revenue.

1. **KPIs with Δ** — Sessões, Sessões engajadas, Usuários, Novos usuários, Visualizações, Duração
   média (duration ÷ sessions, shown as "1 min 23 s"), Taxa de engajamento (engaged ÷ sessions),
   Taxa de rejeição (100 − engagement).
2. **Sessões × engajamento** (bars sessions and engaged, line engagement rate) and **Usuários ×
   novos usuários** (line: % of new), Mensal (12 months) or No período.
3. **Público** — gender and age tables: sessions, engagement, compras informadas, compras por
   sessão; GA4 values labelled in Portuguese (`audienceValueLabelOf`).
4. **Páginas mais visitadas** — top 50 by page views: views, sessions, engagement, average
   duration; CSV.
5. **Regiões** — per state: sessions, views, engagement, compras informadas, compras por sessão; CSV.

## Vendas por canal (`?aba=canais`)

One table, one row per sales channel (`salesChannelRows.ts`, tested; channels from
`channelsFromSales`: the store's own channels add up as **Site**, each marketplace apart). Sales
and orders come from the ERP or the spreadsheet (paid orders); the global channel filter keeps
the site or the marketplaces. Columns: Vendido, Δ vendido, Participação, Pedidos, Ticket médio, Δ
ticket, Sessões and Conversão (orders ÷ GA4 sessions, site only — "—" for marketplaces), Δ
conversão, Investimento (each campaign's spend goes to the channel the staff tagged on Funil de
investimento, Site by default; fee with "Incluir taxa") and
ROAS do canal ("—" without investment). Total row: all channels, its ROAS is the overall return.
The Looker's 7/14/30/90-day windows are the global period presets.

## Funil de investimento (`?aba=funil`)

Payload `MarketingInvestmentFunnel` from `investmentFunnelService.ts` (pure `funnelSummary.ts`,
tested): ad spend joined with `campaign_tag` (untagged → "Sem etapa", channel → Site), platform fee
with "Incluir taxa".

1. **KPIs with Δ** — Investimento total and one tile per stage (Topo, Meio, Fundo; "Sem etapa" only
   when it has investment) with its share of the total.
2. **Etapas por plataforma** — per stage, each platform's investment and its share inside the stage,
   the stage total and its share.
3. **Investimento por etapa** — one line per stage, Mensal (12 months) or No período.
4. **Custo por pedido: site × Meta × Google** — site: investment of the campaigns tagged to the site
   ÷ site orders from the ERP or the spreadsheet; Meta and Google: their investment ÷ the conversions
   they report. A bucket without orders or conversions leaves a gap. TikTok stays out of this chart
   (as in the agency report); its cost per conversion lives on the platform tabs.
5. **Criativos por etapa** — per stage, the 3 ads with the most investment (`topCreativesByStage`):
   thumbnail (placeholder until the platform sends it), name, platform · campaign · ad set,
   investment, CTR and cost per reported conversion.

Last block: **Etapa e canal de cada campanha** — every campaign with investment in the period
(all ad platforms, latest name), its investment, its funnel stage (Topo / Meio / Fundo / Sem
etapa) and the sales channel it feeds (Site or a marketplace the store sold on in the last 13
months; default Site). Staff edit both with a select per cell (`PUT /marketing/campaign-tags`
`{ platform, campaignId, stage, channel }` → 204; 403 for a client, 404 for a campaign the
store never ran, 422 for an unknown channel; audited as `CAMPAIGN_TAGGED`); the client sees
the same list read-only. A banner counts the campaigns without a stage and their share of the
investment (`untaggedSummary`).

## Pilares (`?aba=visao`)

The five pillars of the section (seeded from `marketingFixture.ts`) with the KPIs the
data module already covers replaced by live values
(`marketingScreenService.ts` › `marketingOverview`, current vs comparison):

| Pillar    | KPI                         | Formula                                                            |
| --------- | --------------------------- | ------------------------------------------------------------------ |
| Conversão | Taxa de conversão           | paid store orders ÷ sessions                                       |
| Conversão | Ticket médio                | paid revenue ÷ paid orders (respects the channel toggle)           |
| Conversão | Abandono de carrinho        | (add to cart − paid store orders) ÷ add to cart                    |
| Aquisição | CAC                         | investment ÷ revenue × 100 (percent, `cacPercent`)                 |
| Aquisição | ROAS geral                  | paid revenue ÷ investment                                          |
| Aquisição | Investimento em mídia       | investment (media + fee + cost lines)                              |
| Aquisição | Participação do maior canal | revenue share of the largest origem / meio (the label is the note) |
| Retenção  | Recompra 90 dias, LTV 12 m  | injected from customers                                            |
| Presença  | Seguidores                  | `social_daily` followers on the last synced day of the period      |
| Presença  | Alcance                     | `social_daily` reach summed over the period (Instagram + Facebook) |
| Presença  | Taxa de engajamento         | engagement ÷ reach of the period (the Social tab's rate)           |

The presence KPIs come from the Instagram/Facebook connector (P3); a store
without it shows "—". Canais paralelos stays on manual values. There is no
feature block inside a pillar any more (the mocked `CreativePresence` was
removed on 2026-09-20 — nothing fed it). The
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
   ROI · CPA · CAC). CAC per bucket is that bucket's investment ÷ its revenue (percent).
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
derived once in `deriveAdRow` (`marketingMetrics.ts`): CPA = spend ÷ conversions, CPM,
CPC, CTR. **No sales here** (decided 2026-09-22, `growth-plan.md`): the value an ad
platform attributes to itself stays in `ad_spend_daily.attributed_revenue` as raw data and is
never shown as revenue or used in a ROAS — sales and ROAS come only from the ERP or the
spreadsheet. Conversions are the platform's own count.

1. **Por plataforma** — one row per platform plus Total: Investimento ·
   Conversões · CPA ·
   Impressões · CPM · Cliques · CPC · CTR. The fee checkbox is shared with
   Resumo. CSV.
2. **Plataformas no tempo** — `MultiSeriesChart`, one line per platform of
   `metricaAds` (the same eight metrics; default Investimento).
3. **Melhores e piores campanhas** — `bestAndWorstByCost`: Melhores = the 3 cheapest
   costs per conversion among campaigns that converted; Piores = the campaigns that spent most
   without converting, then the most expensive conversions, never repeating a Melhor. Each
   line shows the cost per conversion (or "sem conversão") and the spend.
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
2. **Mapa** — `BrazilTileMap` coloured by `mapa` (ROAS · Total vendido · Gasto total · CAC %);
   the "Incluir taxa da plataforma" checkbox is shared with the other tabs.
3. **Desempenho regional** — Estado · Investimento Meta · Google · TikTok · Gasto total ·
   Total vendido · ROAS · CPM · CPC · CPA · CAC · Clientes · Ticket médio · Taxa de recompra,
   with a total row. CSV.

## Social (`?aba=social`)

Organic Instagram and Facebook, read from `social_daily` (one row per platform × account ×
day: followers, reach, engagement, posts) and `social_post` (one row per publication), both
written only by the Instagram/Facebook connector (`docs/apis/instagram.md`). `socialMetrics.ts`
(tested) derives the tab; `MarketingSocial.tsx` renders it.

1. **Redes sociais** — tiles Seguidores (latest value per account, summed) · Alcance ·
   Engajamento (likes + comments + saves + shares of the period's posts; Facebook's
   `page_post_engagements`) · Taxa de engajamento (engagement ÷ reach) · Publicações, each
   with the variation against the comparison window.
2. **Alcance no período** — `TimeSeriesChart` of reach per bucket, both windows.
3. **Por rede** — Rede · Seguidores · Alcance · Engajamento · Taxa · Publicações. CSV.
4. **Publicações que mais engajaram** — the 10 posts of the period by engagement then reach:
   caption (link to the permalink) · Rede · media type · Data · Alcance · Curtidas ·
   Comentários · Engajamento. CSV.

Empty store: zeros, "—" and the table empty messages pointing to Conexões.

## Fidelity

Traffic-based figures (conversion, funnel, sessions) are level A on the
seed but level B in production copy because of mobile tracking loss; media
figures are level B while Meta Ads is out of sync; coupon figures are level
A (they come from the orders themselves).
