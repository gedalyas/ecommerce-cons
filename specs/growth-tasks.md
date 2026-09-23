# Growth tasks

Board for `growth-plan.md`. Tick as work lands; one commit per task, checks green before each.

Status: **approved 2026-09-23 — G1 next.**

## G1 — ROAS highlight, CAC%, metric tooltips

- [ ] Contracts `shared/metricGlossary.ts` (label, definition, formula per metric key) + test
      covering every dashboard and marketing metric key
- [ ] `Metric.hint` + info icon with `Tooltip` in `MetricTile` (tap on phones); `metricToTile`
      fills it; `DataTable` header hint
- [ ] Dashboard: `roas` metric key; headline Faturamento · ROAS · CAC · Recompra
- [ ] CAC as percent (investment ÷ revenue) on dashboard, Marketing, Metas, Análise; LTV/CAC
      milestone rewritten; specs updated

## G0 — One source per data kind; ROAS per channel

- [ ] Contracts `dataKinds` + labels; catalog lists the kinds each platform can provide;
      `system` as a source for the kinds the product derives itself
- [ ] `StoreDataSource` + `Order.source` (migration; backfill in the service); sync writes
      only the kinds a connection owns; pure `dataSourceRules.ts` + test
- [ ] `attributedRevenue` out of every ROAS / vendido; campaign tables show efficiency only
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

- [ ] Provider data: GA4 (funnel events, source/medium, pages, items, demographics, region),
      Meta (ad set/ad, thumbnails, link clicks, carts, purchases, leads, messaging), Google
      (ad group, keyword, impression share, campaign type)
- [ ] Visão geral (YTD, month-end projection, monthly/daily combos, site funnel, canais,
      produtos)
- [ ] Meta Ads tab · Google Ads tab · Site (GA4) tab
- [ ] Staff "Campanhas" list: funnel stage + destination channel tagged by hand
- [ ] Funil de investimento (untagged spend as its own slice)
- [ ] Δ% on every KPI, heat-shaded tables with totals, 7/14/30/90 toggles

## G5 — Relatório

- [ ] TopBar "Relatório" button on the dashboard; builder Sheet with sections, templates,
      preview
- [ ] PDF rendering in the worker (decision on the library) + "Baixar PDF"
- [ ] Schedules (weekly/monthly, hour, recipients) + pg-boss cron + e-mail with attachment;
      audit entries
