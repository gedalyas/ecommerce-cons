# Growth plan — the meeting of 2026-09-22

Status: **approved 2026-09-23, in execution** — board in `growth-tasks.md`.

## Goal

Deliver the depth of information of the agency Looker Studio report Davi studied ("[Vorr]
Dashboard - Painel de Growth", 8 pages: Visão Geral, Meta Ads, Meta Ads (Loja), Google Ads,
Google Analytics, Venda por canal, Funil de investimento, Reunião Semanal), with the product's
design, and with numbers that are right. That report reads "Valor vendido" from GA4 and the ad
platforms; this product does not.

The nine points of the meeting, and the stage that answers each:

| #   | Meeting point                                                                         | Stage |
| --- | ------------------------------------------------------------------------------------- | ----- |
| 1   | "Relatório" button next to the period filter; the user builds and schedules it        | G5    |
| 2   | Dashboard "Indicadores em destaque": ROAS instead of Margem de contribuição           | G1    |
| 3   | Connections the Bling way: niches, logos, id/token field, "Testar", help per platform | G2    |
| 4   | Bling is where sales come from; without it, say what each source pulls and conflicts  | G0/G2 |
| 5   | CAC as a percentage                                                                   | G1    |
| 6   | Tooltips that explain metrics (CAC, ROAS…)                                            | G1    |
| 7   | Meta Ads and Google Ads never feed sales                                              | G0    |
| 8   | Amazon has 3 integrations, Mercado Livre has 2                                        | G2    |
| 9   | Marketing as complete as the Looker report                                            | G4    |

## The revenue rule (decided 2026-09-22)

- **Revenue — every "vendido", ticket, ROAS, CAC% — comes from exactly two kinds of source:**
  an **ERP** connector (Bling first; any other ERP we map later) or a **spreadsheet** the AI
  reads (G3). A storefront alone (Shopify, Nuvemshop…) is not a revenue source: it does not
  see what is sold on Amazon, Mercado Livre, TikTok Shop, Shopee.
- **Investment comes from the ad platforms** (Meta, Google, TikTok) — spend, impressions,
  clicks, and the platform's own conversion counts as efficiency metrics.
- **The value an ad platform attributes to itself is never shown as sales** — no "Valor
  vendido Meta", no campaign ROAS from `attributedRevenue`.
- **Every data kind is optional and has one source per store** (Davi, 2026-09-23). A connector
  offers data kinds (vendas, produtos, estoque, clientes, investimento, tráfego, social); when
  connecting, the user ticks which ones to pull. Shopify may be the products source of a store
  whose ERP is weak; the spreadsheet is always an alternative. Choosing a second source for a
  kind that already has one is blocked with the conflict explained (G2), so the same sale or
  product is never counted twice. Sales (vendas) accept only an ERP or the spreadsheet.
- **Some data is produced by the product itself** (Davi, 2026-09-23) — a kind's source may be
  `system` instead of a connector: products and customers derived from the order items, costs
  and goals registered on their screens, campaign stage/channel tags, manual entries. The
  source picker offers "Gerado no sistema" where the product can build the kind from data it
  already owns, and says from what ("a partir dos itens dos pedidos").

## ROAS when the store sells in several places (Davi, 2026-09-23)

A single store ROAS mixes sales no ad drove (a Mercado Livre sale is not the fruit of a Meta
campaign that sends people to the site). The ERP already knows the **sales channel** of every
order (Bling `loja.id` → `GET /canais-venda`), so ROAS is computed **per sales channel**, with
the investment that serves that channel:

- **Investment → channel map.** Each ad account (or campaign, when an account serves several
  channels) is assigned a destination channel by the staff, on the same screen where they tag
  the funnel stage by hand (G4). Defaults: Meta Ads, Google Ads, TikTok Ads → the store's own
  site; Mercado Ads → Mercado Livre; Amazon Ads → Amazon; Shopee Ads → Shopee.
- **ROAS do canal** = sales of that channel (ERP/spreadsheet) ÷ investment mapped to it.
  E.g. "ROAS Site 4,2x" (site sales ÷ Meta + Google), "ROAS Mercado Livre 9,8x" (ML sales ÷
  Mercado Ads). A channel with sales and no mapped investment shows "sem investimento", not ∞.
- **ROAS por plataforma dentro do canal** is not computed (no reliable attribution); instead
  each platform shows its share of the channel's investment and its cost per conversion.
- **Total (MER)** = all sales ÷ all investment — shown as a secondary number with its
  tooltip ("retorno geral, inclui vendas que não vieram de anúncio"), never as "o ROAS".
- The dashboard headline "ROAS" is the ROAS of the channel that receives most investment
  (usually Site), labelled with the channel; the tile's tooltip lists the other channels.
- Marketplace ad platforms (Mercado Ads, Amazon Ads, Shopee Ads) become catalog entries
  feeding investment; they are needed for marketplace ROAS and come after Meta/Google.

## Decisions already taken (2026-09-22)

- **CAC% = marketing investment ÷ revenue of the period** (media + platform fees + the
  sales/marketing cost lines, the same investment the dashboard already sums). The R$ per new
  customer stays available only where a screen is about customers (Clientes › LTV e CAC).
- **Scheduled report = e-mail with a short summary in the body + PDF attached.**
- **Connections are hybrid:** id/token field + "Testar" where the platform offers it (Bling API
  key, VTEX app key, Tray, Nuvemshop…); OAuth "Conectar" kept where it is the only way (Meta,
  Google), inside the same card layout, with the help tab and "Testar" after connecting.

## Stages

### G1 — Quick wins: ROAS highlight, CAC%, metric tooltips

- Contracts: `shared/metricGlossary.ts` — one entry per metric key the UI shows
  (`{ label, definition, formula }`, pt-BR), test that every dashboard / marketing metric key
  has an entry. CAC: "Quanto do faturamento foi gasto para trazer vendas: investimento em
  marketing ÷ faturamento. 10% = R$ 10 de marketing a cada R$ 100 vendidos." ROAS: "Quanto
  voltou em vendas para cada R$ 1 em anúncios: faturamento ÷ investimento em anúncios."
- `Metric` tile gets an optional `hint`; `MetricTile` renders a lucide `Info` icon with the
  existing `Tooltip` (tap-to-open on phones); `metricToTile` fills it from the glossary.
  `DataTable` column headers accept the same hint.
- Dashboard: `roas` joins `dashboardMetricKeys` (multiplier, goodWhen up); headline becomes
  Faturamento · ROAS · CAC · Recompra. Until G0 lands it is the store-wide figure labelled
  "ROAS geral"; G0 turns it into the ROAS of the most-invested channel.
- CAC becomes `percent` = investment ÷ revenue everywhere it is "CAC" (dashboard, Marketing
  Visão/Resumo/Regiões, Metas, Análise driver tree); `goodWhen` down; bands/milestones that
  compared R$ CAC (e.g. "CAC menor que 1/3 do LTV") are rewritten or moved to the customers
  screen's R$ figure. Specs `dashboard.md`, `marketing.md`, `goals.md` updated.

### G0 — One source per data kind; ad platforms never feed sales

- Contracts: closed set `dataKinds` (`sales`, `products`, `stock`, `customers`,
  `ad_spend`, `traffic`, `social`) with labels; each catalog entry lists the kinds it
  **can** provide (Bling: vendas, produtos, estoque, clientes; Shopify: produtos, estoque,
  clientes, tráfego do site; Meta: investimento; GA4: tráfego…). `sales` only on ERPs and the
  spreadsheet.
- Database: `StoreDataSource (clientId, kind, source)` unique per `(clientId, kind)`; the
  connection flow writes the kinds the user ticked; `Order.source` (connector key or
  `spreadsheet` / `manual_csv`) recorded on every write, backfilled by the service.
- Sync writes only the kinds the connection owns (a Shopify connected for products never
  writes orders); metrics read orders only from the store's `sales` source.
- Orders keep the ERP's **sales channel** (Bling `loja.id` → canal) as a first-class
  dimension — it drives ROAS per channel.
- Remove `attributedRevenue` from every ROAS / "vendido" computation (`deriveAdRow`, dashboard
  `paidMedia`, regions); campaign tables show investment, impressions, CPM, CTR, clicks, CPC,
  platform conversions and cost per conversion. The column stays in the database (raw data).
- Investment → channel map (`AdChannelAssignment` per ad account, campaign override) with
  the defaults above; pure `channelRoas.ts` + test (per-channel ROAS, MER, "sem
  investimento"); pure `dataSourceRules.ts` + test (who may own which kind).
- Decision record `decisions/2026-09-23-sales-from-erp-and-roas-per-channel.md`.

### G2 — Connections the Bling way

- Catalog grouped by **niche** (ERP · Hubs · Marketplaces · Lojas virtuais · Anúncios ·
  Analytics · Redes sociais · Planilha), searchable, a card per platform with its **logo**
  (SVG in `apps/web/public/connectors/`), status and the feeds it provides.
- **Variants are modalities, not separate cards** — one card per marketplace with a
  "modalidade" choice (Amazon MFN / FBA Classic / FBA Onsite; Mercado Livre próprio / Full),
  see _Marketplace variants_; each modality has its own help section.
- Connector detail drawer with tabs **Conectar** (id/token/domain fields from a per-connector
  `credentialFields` list, or the OAuth button) · **O que puxa** (feeds, what it becomes in the
  product, conflicts) · **Ajuda** (step-by-step tutorial, pt-BR, from contracts
  `connectorGuides.ts`, with links to the platform pages).
- **Testar**: `POST /connectors/:key/test` calls the provider's cheapest authenticated
  endpoint with the typed credentials and answers `{ ok, accountLabel }` or a Portuguese
  error; nothing is stored on a failed test. Providers gain `testCredentials?`.
- **Data kinds to pull**: the drawer lists the kinds the platform offers as checkboxes, each
  marked with its current source ("Vendas: Bling"); a kind already owned is unchecked with
  the reason, and switching it is an explicit "usar esta fonte para produtos" that releases
  the old one.
- **Conflict check**: pure `sourceConflicts.ts` (+ test) — two sources for one kind, sales
  from a non-ERP, two variants of the same marketplace feeding the same channel — answers the
  warning shown in the drawer; the API enforces it on connect and on kind changes.

### G3 — Spreadsheet read by AI (revenue without an ERP)

- Upload on Conexões › Planilha: CSV and `.xlsx` (and `.xls` if cheap), any column layout.
- The API extracts the header + a sample of rows and asks the model to map columns to the
  order shape (number, date, status, total, channel, discount, freight, customer, items),
  returning a mapping — not the data. The mapping is applied by pure code, previewed, edited
  by the user if needed, and remembered per store for the next upload of the same layout.
- Reuses the imports pipeline (rate limit, byte ceiling, type check, content check, row cap,
  undo); `.xlsx` parsing runs in a worker thread as `decisions/2026-09-13-csv-import-without-worker.md`
  anticipated. New file-input rules go through the CLAUDE.md pipeline order.

### G4 — Marketing at the Looker depth

New Marketing structure (tabs; every KPI with Δ% vs the previous period, tables with heat
shading and totals, fixed-window toggles 7/14/30/90 days where the Looker used them):

- **Visão geral** — Vendido, Investido, ROAS por canal (+ MER), Pedidos, Ticket médio, Taxa de conversão; the
  same for the year to date; **projection to month end** (run-rate of vendido and investido);
  Vendido × Investido + ROAS line (monthly and daily); Sessões + Novos usuários × Taxa de
  conversão (monthly and daily); **site funnel** Sessões → Visualizações de produto → Carrinho
  → Checkout → Compras (GA4 events); canais by origem/mídia; produtos (vistos, carrinhos,
  compras, taxas); investimento por plataforma (Meta/Google/TikTok) with share.
- **Meta Ads** — KPIs (investido, impressões, alcance, CPM, cliques no link, CPC, CTR,
  sessões, custo por sessão, carrinhos, compras, custo por compra, leads, conversas iniciadas,
  custo por lead); campanha → conjunto → anúncio drill-down with filters; creatives with
  thumbnail; several ad accounts per store (the Looker had e-commerce and physical-store
  accounts).
- **Google Ads** — KPIs (investido, impressões, parcela de impressões, cliques, CPC, CTR,
  conversões, custo por conversão); campanha → grupo → palavra-chave; campaign type
  (PMax, Search, Shopping, Display, YouTube).
- **Site (GA4)** — sessões, sessões engajadas, usuários, novos usuários, visualizações de
  página, duração média, taxa de engajamento, taxa de rejeição; páginas mais visitadas;
  gênero e faixa etária (sessões and purchases); regiões.
- **Funil de investimento** — investment by funnel stage (Topo / Meio / Fundo) per platform,
  share per stage, daily/monthly lines, creatives per stage, CPA by platform. The stage is
  **tagged by hand by the staff** (Davi, 2026-09-23) on a "Campanhas" settings list per store
  — stage (Topo/Meio/Fundo) and destination channel per campaign, new campaigns flagged
  "sem etapa" until tagged; untagged spend shows as its own slice.
- Descontos, Regiões and Social stay.
- Data work: GA4 provider pulls events funnel, source/medium, pages, items, demographics,
  region; Meta provider pulls ad set / ad level, creative thumbnail, link clicks, landing page
  views, add-to-cart and purchase counts, leads, messaging; Google provider pulls ad group,
  keyword, impression share, campaign type. New daily tables per grain; providers verified
  against their stubs.
- "Reunião semanal" is not a tab: it is a report template in G5.

### G5 — "Relatório": build, download, schedule

- Button **Relatório** in the TopBar next to the `PeriodSelector` on the dashboard.
- Builder (a `Sheet`): pick sections (KPIs, Vendido × Investido, funil, canais, Meta,
  Google, produtos, funil de investimento…), period, templates ("Reunião semanal", "Fechamento
  do mês"); preview; **Baixar PDF** now.
- **Automação**: frequency (semanal with weekday / mensal with day), hour, recipients (the
  user; staff may add the store's users), on/off. Stored per user and store; a pg-boss cron
  per schedule renders the PDF in the worker and sends the e-mail (summary in the body + PDF
  attached). Mailer gains attachments. Audit entries for create/edit/delete.
- PDF rendered server-side from the same numbers the screens use (library choice recorded in
  a decision; `@react-pdf/renderer` is the lead candidate — no headless browser in the worker).

## Order of work

G1 → G0 → G2 → G3 → G4 → G5. G1 is small and visible; G0 must land before any new screen
shows revenue; the report comes last because it assembles sections the other stages build.
Real connections stay on hold until the company's domain (2026-09-20); everything here is
verified against the stubs and the dev seed.

## Marketplace variants (researched in Bling's help center, 2026-09-23)

- **Amazon — 3 sales-channel modalities**: **MFN** ("Amazon", seller stores and ships; NF-e
  from the ERP), **FBA Classic** (stock in Amazon's warehouse, Amazon ships and issues the
  NF-e; invite-only; stock cannot be pushed), **FBA Onsite** (Amazon operates from the
  seller's warehouse; stock not synced). **DBA** is a logistics add-on (Amazon only delivers)
  on top of MFN or Onsite, not a sales channel. A product sits in one program at a time.
- **Mercado Livre — the "2"**: the main **Mercado Livre** channel (orders, products, stock,
  prices, fees, SAC) and the **Faturador do Mercado Livre** (SP only; imports the NF-e ML
  issues — required for **Full**). **Full** is a fulfillment branch inside the main
  integration (stock owned by ML, cannot be synced); **Mercado Envios / Flex** are logistics.
  Not confirmed which pair was meant in the meeting — ask whoever raised it.
- Same pattern elsewhere: Shopee, Shein and Magalu have a channel + their own logistics +
  fulfillment orders inside the channel; Dafiti has WS and Milkrun.
- Bling groups its 250+ integrations by niche (Vendas online, Gestão de entregas, Gestão de
  estoques, Gestão de redes sociais, Gestão financeira, Dashboards e BI…) and sub-group
  (Marketplace, Plataforma de e-commerce, Hub, Social Commerce, Logística de marketplace,
  Plataforma de envio, Transportadora, WMS, CRM…).

**What it means here.** The variants differ in _who owns stock and issues the NF-e_, not in
sales: through Bling every modality arrives as an order with its channel. So:

- The **sales channel** dimension groups modalities under the marketplace ("Amazon" with
  modality FBA Classic / FBA Onsite / MFN; "Mercado Livre" with Full / próprio), so ROAS per
  channel stays "Amazon", and the modality is a filter.
- Direct marketplace connectors (used only for products/stock when there is no ERP) are
  **one catalog card per marketplace with a "modalidade" choice** — the Amazon SP-API returns
  `FulfillmentChannel` (AFN/MFN) per order and ML flags Full shipments, so one OAuth covers
  all modalities; the choice tells the product that FBA/Full stock is the marketplace's
  (read-only, never "ruptura" alerts from our side). The help tab explains each modality.
- Catalog niches follow Bling's names where they fit: ERP · Hub · Marketplace · Plataforma
  de e-commerce · Social Commerce · Anúncios · Analytics · Redes sociais · Planilha.

## Open questions

1. Which Mercado Livre pair was meant in the meeting (channel + Faturador, or channel +
   Mercado Envios)? It does not change the model above.

Answered 2026-09-23: existing storefront/marketplace connectors stay, every data kind is
optional per store; funnel stage is tagged by hand by the staff; ROAS is per sales channel
(see above), not one store figure.
