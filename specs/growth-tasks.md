# Growth tasks

Board for `growth-plan.md`. Tick as work lands; one commit per task, checks green before each.

Status: **approved 2026-09-23 — G1 and G0 done (except the `system` source, which ships with the G2 picker); G2 in progress.**

## G1 — ROAS highlight, CAC%, metric tooltips

- [x] Contracts `glossary/metricGlossary.ts` (definition + formula per metric key) + test
      covering every dashboard metric and the Marketing investment/session pickers (ad metrics
      — CPM, CPC, CTR… — join with the G4 tabs)
- [x] `Metric.hint` + ⓘ in `MetricTile` / `MetricCard` (`MetricHintButton`: hover opens, click
      or tap pins); `metricToTile` takes the hint
- [x] ~~`DataTable` header hint; hints on the Marketing tiles~~ → moved to G4 (the Marketing tabs
      are rebuilt there)
- [x] Dashboard: `roas` metric key; headline Faturamento · ROAS geral · CAC · Recompra
- [x] CAC as percent (investment ÷ revenue, `cacPercent`) on dashboard, Marketing, Metas,
      Análise; Clientes keeps "CAC por cliente" in R$ for LTV/CAC; milestone renamed; specs updated

## G0 — One source per data kind; ROAS per channel

- [x] Contracts `dataKinds` + labels; catalog `provides` replaces `feeds` (sales only on ERP and
      spreadsheet); ERP first in the guided order; access and fidelity read the kinds; sync writes only the
      kinds the connector provides (`providesKind`), so Shopify, Nuvemshop, Mercado Livre and
      Amazon no longer write orders — their products/stock sync is future work (G2)
- [x] `system` source: products and customers without an owner are generated from the orders
      (shown as "Gerado no sistema" in the picker)
- [x] `StoreDataSource` + `Order.source` (the G0 migration); first source claims the exclusive
      kinds (sales, products, stock, customers, traffic), sync and imports write only what they
      own (409 on a conflicting import), disconnect releases; pure `dataSourceRules.ts` + test.
      Orders written before 2026-09-23 keep `source = null` and existing stores have no owner
      until their first sync or import claims one (the first to run wins; the G2 picker lets the
      store choose). Claims of disconnected connectors are dropped on the next claim.
      Follow-ups: audit entries for claim/release; a blocked sync records CONNECTION_SYNCED
      before its ERROR note
- [x] `attributedRevenue` out of every ROAS / vendido; campaign tables show efficiency only
      (best/worst by cost per conversion; dashboard paid media = spend × store revenue)
- [x] ROAS per sales channel: pure `channelRoas.ts` + test (`salesByChannel` from the ERP orders;
      ad investment points at the site by default); dashboard "ROAS do site" with MER below and
      the per-channel ROAS in its ⓘ. Editable map (ad account / campaign → channel) comes with
      the staff "Campanhas" list in G4
- [x] Decision `2026-09-23-sales-from-erp-and-roas-per-channel.md`

## G2 — Connections the Bling way

- [x] Catalog: Bling niche names (+ Social commerce), logos (Simple Icons + monogram), new
      entries Tiny, Omie, Shopee, Magalu, TikTok Shop, Mercado Ads, Amazon Ads, Shopee Ads
- [ ] Catalog: `credentialFields` and modalidade per marketplace (Amazon MFN / FBA Classic / FBA
      Onsite; ML próprio / Full); sales channel groups modalities. Bling has no credential
      field: OAuth with the Bling-generated app ID (confirmed 2026-09-24)
- [x] Connector drawer: Conectar · O que puxa (owner per kind) · Ajuda (`connectorGuides.ts`,
      marketplace modalities explained)
- [ ] `POST /connectors/:key/test` + `testCredentials?` per provider
- [x] Source picker in "O que puxa": "Usar esta integração" / "Deixar de usar", date cut
      (`since`, migration `store_data_source_since`), "Gerado no sistema" for products/customers
      without an owner, `DATA_SOURCE_CHANGED` activity
- [x] Conflicts as pure rules (`conflictingOwner`, `choiceProblem`, `blockedKinds`) + tests; enforced
      on import (409), on sync (ERROR note) and on the source choice (422)

## G3 — Spreadsheet read by AI

- [ ] Upload CSV/xlsx (worker thread for xlsx), header + sample → model → column mapping
- [ ] Pure mapping applier + test; preview, edit, remembered mapping per store; undo

## G4 — Marketing at the Looker depth

Acceptance: every row of the coverage table in `growth-plan.md` › G4, following the product's rules
(sales never from a marketing channel). Meta Ads and Google Ads always observable separately.

- [x] Data model (migration `marketing_depth`): ad spend gains account, campaign type, reach, link
      clicks, landing page views, add to cart, leads, messages, eligible impressions (share =
      Σ impressions ÷ Σ eligible), thumbnail;
      new ad_keyword_daily, traffic_page_daily, traffic_item_daily, traffic_audience_daily,
      traffic_region_daily, campaign_tag (+ FunnelStage, AudienceDimension closed sets); traffic
      gains engaged sessions, page views, duration, purchases (a count). Dev seed fills them
      (`seedMarketing.ts`, second deterministic RNG so the existing data does not move)
- [x] Connectors 1/4 — write path: ad spend and traffic rows carry the new fields; ad spend replaced
      per (plataforma, conta, dia) — a spreadsheet row (no account) replaces the whole day, a
      connector row its account plus the spreadsheet rows of that day; undo snapshots carry the new
      fields; `SyncContext.writeKeywords` / `writeTrafficDetail` (pages normalised, items, audience,
      regions) honour the owner and the date cut
- [x] Connectors 2/4 — Meta: account, reach, link clicks, landing page views, carts, leads,
      conversations, campaign type (from the objective), thumbnails, several accounts ("Todas as
      contas"); stub-tested with two accounts
- [ ] Connectors 3/4 — Google Ads: campaign type (PMax…), impression share → eligible impressions,
      keywords with match type (stub-tested)
- [ ] Connectors 4/4 — GA4: engagement, page views, duration, purchases; pages, items (SKU),
      audience, regions → UF (stub-tested)
- [x] Shared: last-sync stamp under the tabs (`tabSources`: the connected sources each tab reads,
      in error in orange); the window toggle is the global period presets (CLAUDE.md)
- [x] Shared: glossary hints on the older tabs (Resumo, Campanhas, Descontos, Regiões, Social) via
      `withHints`; a number whose formula differs from the glossary term (region and channel ROAS)
      stays without a hint
- [x] Visão geral (KPIs with Δ, YTD, month-end projection, monthly/daily combos, site funnel, one
      card per platform) — products table waits for the GA4 items data
- [x] Visão geral: product table (views, carts, purchases from GA4 items; units and revenue of site
      sales from the ERP; one row per product, matched by unique variant SKU, else product id)
- [x] Meta Ads tab (KPIs, charts, campanha → conjunto → anúncio, account filter, leads and
      messages, creatives) — thumbnails render once the Meta provider writes them
- [x] Google Ads tab (KPIs, charts, campanha → grupo → palavra-chave, comparison with Δ, campaign
      type)
- [x] Site (GA4) tab (KPIs, charts, demographics, pages, regions)
- [x] Vendas por canal tab (sessions from GA4, sales from the ERP) — the 7/14/30/90-day
      windows are the global period presets: a screen never renders its own period control
      (CLAUDE.md), so no tab toggle
- [x] Staff "Campanhas" list: funnel stage + destination channel tagged by hand — on the
      Funil de investimento tab (`PUT /marketing/campaign-tags`, audited); the channel tag feeds the
      channel ROAS in the funnel slice
- [x] Funil de investimento tab: stage KPIs, stage × platform table, stage lines, CPA Site ×
      Meta × Google (site investment = campaigns tagged to the site)
- [x] The channel tag feeds Vendas por canal and the dashboard's ROAS por canal (`channelInvestment`)
- [x] Dashboard headline "ROAS do site" on the tagged split (`siteAdInvestment`, window and
      buckets); MER stays all sales ÷ all investment, as the plan defines it
- [x] Marketing › Visão geral "ROAS do site" (KPI, year, monthly/daily line) on the same tagged
      split as the dashboard tile; the Pilares KPI stays "ROAS geral" (all sales ÷ all investment)
      by design
- [x] Funil de investimento: creatives by stage (top 3 ads by investment per stage; thumbnails
      once the Meta provider writes them)
- [ ] Per-platform vendido/ROAS by UTM on ERP/spreadsheet orders with coverage (when a source
      brings UTM)

## G5 — Relatório

- [ ] TopBar "Relatório" button on the dashboard; builder Sheet with sections, templates,
      preview
- [ ] PDF rendering in the worker (decision on the library) + "Baixar PDF"
- [ ] Schedules (weekly/monthly, hour, recipients) + pg-boss cron + e-mail with attachment;
      audit entries
