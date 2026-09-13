# Data module — task board

Checklist companion to `data-module-plan.md`. Tick tasks as they land
(`[x]`), add a short note after the task when something changed along the
way. Keep this file and the plan in sync.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped

Status: **Stage 0.5 — gap analysis and mapping written (`specs/architecture.md`), waiting for approval before moving files** — last updated 2026-09-12

---

## Stage 0 — Foundations

### Schema and seed

- [x] Add `Order` model (channel, source, utm_*, financial status, gateway,
      processing method, totals, discounts, coupon codes, geography,
      sales platform, `orderNumberForCustomer`) — table `sales_order`
      (`order` is reserved in SQL)
- [x] Add `OrderItem` model (product, variant, sku, qty, unit price, unit cost)
- [x] Add `Customer` model with aggregate fields (first/last order, count,
      total spent, days since last purchase, R/F/M scores, segment)
- [x] Add `Product` + `ProductVariant` models (category, subcategory, brand,
      collection, price, cost, stock, last sale)
- [x] Add `TrafficDaily` model (date, source, sessions, users, view item,
      add to cart, begin checkout) — per-product sessions deferred to Stage 4
      (needs its own table)
- [x] Add `AdSpendDaily` model (platform, campaign/adset/ad, spend,
      platform fee **separate**, impressions, clicks, conversions) — region
      breakdown deferred to the backlog (regional views)
- [x] Add `CostExpense` model (category, subcategory, business unit,
      frequency enum incl. per-order / % per order / % of ad spend,
      value, start/end)
- [x] Run `prisma migrate dev` (additive; keep existing 10 models) —
      `20260911012913_data_module_facts`
- [x] Build deterministic seed generator (seeded RNG) — `prisma/seed-analytics.ts`:
      18 months, ~32k orders, ~27k customers, 78 products / 133 variants.
      More orders than planned because R$ 487k/month at a R$ 268 ticket
      forces ~1.8k orders/month
- [x] Reconcile seed aggregates with existing headline fixtures — ago/26:
      revenue R$ 493k (fixture 487k), ticket R$ 259, CAC ≈ R$ 60, ROAS 3,1x,
      repeat orders 14,9%, conversion 1,87%, CMV 49%, stockouts 6%
- [x] `npm run db:reset` works end-to-end with the new seed

### Global period

- [x] Define search-param schema (`inicio`, `fim`, `por`, `comparar`) on the
      root route with validation + defaults (últimos 30 dias, dia, período anterior)
      — `src/lib/period.ts`, validated in `src/routes/__root.tsx`. "Today" is
      pinned to `REFERENCE_TODAY = 2026-09-10` so defaults match the dataset
- [x] `usePeriod()` hook (reads/writes params, resolves comparison window) —
      `src/hooks/use-period.ts`
- [x] `PeriodSelector` pattern: presets list, groupBy select, compare select,
      dual-month calendar for custom range
- [x] Period preserved across route changes (link-shareable) —
      `retainSearchParams` + `stripSearchParams(defaults)` on the root

### Server conventions

- [x] `src/server/db.ts` (memoized PrismaClient + adapter) — step 0 of
      `data-layer-migration.md`
- [x] Shared types: `MetricValue { value, unit, previous, variation }`,
      `Envelope<T> { current, previous }`, `SeriesPoint`, `BreakdownSlice` —
      `src/lib/metrics.ts`
- [x] Helper that resolves the period into the two windows and the bucket
      list for `por` — `src/server/analytics/period.ts` (`fillSeries` zero-fills)
- [x] First server function `getOrdersOverview` returning the envelope —
      `src/features/orders/api.ts` → `src/server/analytics/orders.ts`
- [x] Enum mapping at the boundary (Prisma UPPER → Portuguese labels in the
      query layer; no Prisma types reach screens)

### Base patterns (design-system)

- [x] `KpiCard` + `metricToTile` — MetricValue → MetricTile with computed
      variation, `goodWhen` direction and configurable comparison label
- [x] `DataTable` — pagination (10/20/50/100), sort, TOTAL row, empty state
      "Não há dados disponíveis para os filtros selecionados." (client-side;
      server-side paging comes with Pedidos › Lista)
- [x] CSV export helper (pt-BR separators, BOM for Excel) — `src/lib/csv.ts`
- [x] `TimeSeriesChart` — solid current, dashed previous, tooltip via format.ts
- [x] `DonutBreakdown` — share + legend table
- [x] `IndicatorCarousel` — scrollable chips → selected big number + series
- [~] Error/empty variants — empty state done in DataTable/DonutBreakdown;
  "falha na requisição" block pending (route error boundary still generic)

### Formatting

- [x] `formatVariation(value)` → "+8,2%" / "−3,4%"
- [x] `formatPeriodLabel(start, end, withYear?)` → "01/09 – 10/09"
- [x] `formatMultiplier(value)` → "3,10x"

### Stage exit

- [-] Dashboard shows the period selector — moved to Stage 1 (the dashboard
  still renders fixtures; adding the selector without live KPIs would mislead)
- [x] Dev-only route renders the envelope with comparison — `/dev/pedidos`
      (`src/routes/dev-orders.tsx`, `src/features/orders/dev.tsx`)
- [x] `npm run typecheck` + `npm run build` green

---

## Stage 0.5 — Architecture alignment (before any new screen)

The current layout (`features/` + `design-system/` + `server/` + `lib/`) was
not validated against the folder architecture the team uses elsewhere. Align
it now, while only Stage 0 sits on top of it, instead of refactoring five
stages later. Focus: cycle prevention and file-to-file communication through
contracts.

- [x] Run the architecture-documentation prompt on the reference system and
      save the result as `specs/architecture-reference.md` (owner: Davi) —
      3.170 lines, arko_frontend + arko_backend, delivered 2026-09-12
- [x] Gap analysis: reference layers/rules vs. this repo, listed per rule with
      "same / different / missing" and the files affected — appendix of
      `specs/architecture.md` (20 rules: 8 missing, 10 different, 2 kept as-is)
- [~] Proposed mapping for this stack (React 19 + TanStack Start + Prisma):
  target tree, layer diagram, where contracts live, alias policy,
  server-only guarantee — written to `specs/architecture.md`; **awaiting
  approval** before moving anything
- [ ] Enforce cycles and boundaries with tooling, not convention (ESLint
      boundaries / `import/no-cycle` / dependency-cruiser — whichever the
      reference uses), wired into `npm run lint`
- [ ] Barrel (`index.ts`) policy decided and applied (design-system currently
      re-exports everything from `patterns/index.ts`)
- [ ] Contract convention: naming, ownership (producer / consumer / neutral
      folder), how the client/server boundary validates input and types
      output; `src/lib/metrics.ts`, `src/lib/period.ts` and
      `features/orders/api.ts` re-shaped to follow it
- [ ] Move the Stage 0 files to the new layout (schema/seed untouched);
      `npm run typecheck`, `npm run lint`, `npm run build` green; `/dev/pedidos`
      still renders
- [ ] Update `CLAUDE.md` (Architecture section), `src/design-system/README.md`,
      `specs/conventions.md` and the file references in `data-module-plan.md`
- [ ] Record what is enforced by lint vs. what is convention only

---

## Stage 1 — Painel de Controle (`/`)

- [ ] Period selector on the dashboard header (moved from Stage 0)
- [ ] "Falha na requisição" error block for data cards (moved from Stage 0)
- [ ] Remove the `/dev/pedidos` proving ground once its blocks live in a real screen
- [ ] Server functions: `getDashboardOverview` (all 10 scalars),
      `getDashboardMetricByDate(metric)`, `getSalesBySource`,
      `getFinancialOverview` (metric × bucket matrix, paginated)
- [ ] Indicator carousel with the 10 metrics (Total vendido, Pedidos, Ticket
      médio, Taxa de conversão, Investimento em marketing, ROI, CAC, CPA,
      Lucro líquido, Clientes)
- [ ] "Vendas por origem" block (UTM source/medium)
- [ ] "Resumo financeiro" matrix table with CSV
- [ ] Channel toggle (E-commerce / Marketplace) as a search param
- [ ] Keep alerts, milestone, recommendations — wire headline KPIs to queries
- [ ] Fidelity badge per metric derived from `DataSource` status (per-metric
      degradation instead of Prax's full-screen gate)
- [ ] Update `specs/dashboard.md`

---

## Stage 2 — Pedidos (`/pedidos`)

- [ ] Route `orders.tsx` ↔ `/pedidos` in `src/routes.ts`, sidebar entry,
      bottom nav decision
- [ ] Tabs via `?aba=resumo|aprovacao|lista`
- [ ] **Resumo**: KPI carousel (Receita capturada, Receita paga, Taxa de
      aprovação, Pedidos, Ticket médio, Itens por pedido, Descontos,
      Desconto por pedido, Frete)
- [ ] **Resumo**: "De onde vêm as vendas" donut + table by channel/source
- [ ] **Aprovação**: three donut+series blocks (status de pagamento, método,
      gateway)
- [ ] **Aprovação**: dynamic filter endpoints (only values present in period)
- [ ] **Lista**: transactional DataTable — search (pedido/cliente/email),
      filters (canal, origem, status, gateway, método, cupom, UF, cidade)
- [ ] **Lista**: custo / lucro bruto / margem per order from `OrderItem.unitCost`
- [ ] CSV on Lista and on the source table
- [ ] Write `specs/orders.md`

---

## Stage 3 — Custos + DRE (extend `/dinheiro`)

- [ ] Tabs on Dinheiro: `?aba=visao|dre|custos` (keep pillars in `visao`)
- [ ] Cost taxonomy constants (3 categories × subcategories from doc §10.2)
- [ ] Cost registry table (Nome · Descrição · Início · Fim · Canal ·
      Categoria · Subcategoria · Frequência · Valor)
- [ ] "Adicionar custo ou despesa" form with 8 frequencies + validity window
- [ ] Server functions with write path (`createCost`, `updateCost`,
      `deleteCost`) — CSRF middleware already in place
- [ ] Unsaved-changes guard on the form
- [ ] Cost engine: expand recurring/per-order/percentage costs into daily
      amounts for any window
- [ ] DRE query: Receita → Custos → Lucro bruto → Despesas de marketing →
      Margem de contribuição → Despesas operacionais → Lucro líquido
- [ ] DRE matrix table (metric × bucket) with CSV
- [ ] Indicadores gerenciais KPI row
- [ ] Dinheiro pillars (Margem de contribuição, CMV, taxa do adquirente,
      custo de frete/pedido) read derived values
- [ ] Update `specs/sections.md` (money) + write `specs/finance.md`

---

## Stage 4 — Produtos (`/produtos`)

- [ ] Route `products.tsx` ↔ `/produtos`, tabs `?aba=resumo|lista|estoque`
- [ ] ABC classification query (cumulative revenue Pareto, A/B/C)
- [ ] **Lista**: product DataTable (classe ABC, categoria, saúde do estoque,
      sessões, unidades, conversão, total vendido, % vendas, lucro, preço
      médio, custo, margem) + filters (categoria, subcategoria, marca,
      coleção) + CSV
- [ ] **Estoque** (no period selector): velocity, dias para zerar, data de
      fim de estoque, valor do estoque, potencial de receita, receita
      perdida desde ruptura, custo de ruptura/dia; fixed sales windows
      (total / 90 / 30 / 7 dias)
- [ ] **Estoque**: chip filters (risco · maior velocidade · sem estoque)
- [ ] **Resumo**: KPIs (receita de produtos, itens vendidos, valor médio por
      item, itens por pedido)
- [ ] **Resumo**: top/bottom 20 by volume, by conversion, inventory risk,
      out of stock, bought together
- [ ] Logística pillars (Ruptura, Cobertura de estoque) read derived values
- [ ] Write `specs/products.md`

---

## Stage 5 — Clientes + Recompra (`/clientes`)

- [ ] Route `customers.tsx` ↔ `/clientes`, tabs `?aba=rfm|recompra|ltv-cac`
- [ ] Customer aggregate refresh job (seed-time + callable): counts, totals,
      recency, R/F/M quintiles, segment label (Campeões, Leais, Em risco,
      Hibernando, …)
- [ ] `orderNumberForCustomer` populated (`row_number()` per customer,
      capped at 7+ in queries)
- [ ] **RFM**: treemap by segment (size = customers, toggle = revenue)
- [ ] **RFM**: customer DataTable (nome, email, telefone, segmento, pedidos,
      total) + CSV — this export is the campaign list
- [ ] **RFM**: filter panel — compras entre, primeira compra, última compra,
      comprou/não comprou produto (stackable rules), segmentos, origem,
      dias sem comprar, gateway/método, UF/cidade, cupons (incluir/excluir),
      range sliders (total vendido, pedidos) fed by min/max endpoints
- [ ] **Recompra**: KPIs phrased as business questions (receita, pedidos,
      clientes blocks)
- [ ] **Recompra**: intervals between orders (2nd … 7th+), compra × recompra
      donut, revenue and AOV by order number
- [ ] **LTV e CAC**: LTV, CAC, LTV/CAC (≥ 3 reference), frequência, novos
      clientes; LTV×CAC over time, CAC×novos clientes, CAC×CPA, retention
      by order number
- [ ] Marketing Retenção pillar (Recompra 90 dias, LTV 12 meses) derived
- [ ] Write `specs/customers.md`

---

## Stage 6 — Marketing data (extend `/marketing`)

- [ ] Tabs on Marketing: `?aba=visao|resumo|campanhas|descontos`
- [ ] Centralized business rules module: ROAS quality bands (>5 / 2–5 / <2),
      funnel benchmark ranges, LTV/CAC reference
- [ ] **Resumo**: channel performance table with "incluir taxa da
      plataforma" toggle (requires platform fee stored separately)
- [ ] **Resumo**: investment breakdown by category (from `CostExpense`)
- [ ] **Resumo**: investment vs metric and sessions vs metric combo charts
- [ ] **Resumo**: 6-step funnel + conversion table (period × store
      historical average × benchmark range)
- [ ] **Resumo**: sales by UTM (canal / origem / origem-meio / campanha)
- [ ] **Campanhas**: platform table → chart selection; level tabs
      (campanha / conjunto / anúncio); best/worst campaigns; full
      paginated table with CSV
- [ ] **Descontos**: KPIs + coupon table (novos clientes vs recorrentes) + CSV
- [ ] Marketing pillars (Conversão, Aquisição) read derived values
- [ ] Update `specs/sections.md` (marketing) + write `specs/marketing.md`

---

## Backlog (post-Stage 6, not scheduled)

- [ ] Narrative AI analysis per metric with driver trees (doc §11)
- [ ] Alerts derived from data (queda de vendas, risco de estoque…)
- [ ] Metas with 6 inputs / 8 derived
- [ ] Regional views (choropleth by UF) for orders and ROAS
- [ ] Influencer hub
