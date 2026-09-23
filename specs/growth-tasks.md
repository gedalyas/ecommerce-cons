# Growth tasks

Board for `growth-plan.md`. Tick as work lands; one commit per task, checks green before each.

Status: **approved 2026-09-23 — G1 done, G0 in progress.**

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

- [ ] Contracts `dataKinds` + labels; catalog lists the kinds each platform can provide;
      `system` as a source for the kinds the product derives itself
- [ ] `StoreDataSource` + `Order.source` (migration; backfill in the service); sync writes
      only the kinds a connection owns; pure `dataSourceRules.ts` + test
- [x] `attributedRevenue` out of every ROAS / vendido; campaign tables show efficiency only
      (best/worst by cost per conversion; dashboard paid media = spend × store revenue)
- [ ] Investment → channel map (ad account, campaign override) + pure `channelRoas.ts` + test;
      dashboard ROAS = most-invested channel, MER as secondary
- [ ] Decision `2026-09-23-sales-from-erp-and-roas-per-channel.md`

## G2 — Connections the Bling way

- [ ] Catalog: niche, logo, `credentialFields`, modalidade per marketplace (Amazon MFN / FBA Classic / FBA
      Onsite; ML próprio / Full); sales channel groups modalities
- [ ] Connector drawer: Conectar · O que puxa · Ajuda (`connectorGuides.ts`)
- [ ] `POST /connectors/:key/test` + `testCredentials?` per provider
- [ ] "Dados a puxar" checkboxes per connection with the current owner of each kind
- [ ] Pure `sourceConflicts.ts` + test; enforced on connect and on kind changes

## G3 — Spreadsheet read by AI

- [ ] Upload CSV/xlsx (worker thread for xlsx), header + sample → model → column mapping
- [ ] Pure mapping applier + test; preview, edit, remembered mapping per store; undo

## G4 — Marketing at the Looker depth

Acceptance: every row of the coverage table in `growth-plan.md` › G4, following the product's rules
(sales never from a marketing channel). Meta Ads and Google Ads always observable separately.

- [ ] Provider data: GA4 (funnel events, source/medium, pages, items, demographics, region),
      Meta (ad set/ad, thumbnails, reach, engagement, link clicks, carts, purchases, leads,
      messaging, several accounts), Google (ad group, keyword, impression share, campaign type);
      order UTM kept where the ERP/spreadsheet offers it
- [ ] Shared: glossary hints on every Marketing tile and `DataTable` header, Δ% on every KPI, heat-shaded tables with totals, window toggle (7/14/30/90 dias,
      3/6 meses, ano), platform filter, last-sync stamp
- [ ] Visão geral (YTD, month-end projection, monthly/daily combos, site funnel, products, one
      card per platform)
- [ ] Meta Ads tab (KPIs, charts, campanha → conjunto → anúncio, account filter, leads and
      messages, creatives)
- [ ] Google Ads tab (KPIs, charts, campanha → grupo → palavra-chave, comparison with Δ, campaign
      type)
- [ ] Site (GA4) tab (KPIs, charts, demographics, pages, regions)
- [ ] Vendas por canal tab (window toggle; sessions from GA4, sales from the ERP)
- [ ] Staff "Campanhas" list: funnel stage + destination channel tagged by hand
- [ ] Funil de investimento tab (stage KPIs, lines, CPA per platform, creatives by stage)
- [ ] Per-platform vendido/ROAS by UTM on ERP/spreadsheet orders with coverage (when a source
      brings UTM)

## G5 — Relatório

- [ ] TopBar "Relatório" button on the dashboard; builder Sheet with sections, templates,
      preview
- [ ] PDF rendering in the worker (decision on the library) + "Baixar PDF"
- [ ] Schedules (weekly/monthly, hour, recipients) + pg-boss cron + e-mail with attachment;
      audit entries
