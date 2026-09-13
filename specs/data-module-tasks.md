# Data module — task board

Checklist companion to `data-module-plan.md`. Tick tasks as they land
(`[x]`), add a short note after the task when something changed along the
way. Keep this file and the plan in sync.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped

Status: **Stage 4 done (2026-09-12) — Produtos live; Stage 5 (Clientes + Recompra) is next** — last updated 2026-09-12

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
      — `src/shared/utils/period.ts`, validated in `src/routes/__root.tsx`. "Today" is
      pinned to `REFERENCE_TODAY = 2026-09-10` so defaults match the dataset
- [x] `usePeriod()` hook (reads/writes params, resolves comparison window) —
      `src/shared/hooks/usePeriod.ts`
- [x] `PeriodSelector` pattern: presets list, groupBy select, compare select,
      dual-month calendar for custom range
- [x] Period preserved across route changes (link-shareable) —
      `retainSearchParams` + `stripSearchParams(defaults)` on the root

### Server conventions

- [x] `src/shared/dependencies/prismaClient.ts` (memoized PrismaClient + adapter) — step 0 of
      `data-layer-migration.md`
- [x] Shared types: `MetricValue { value, unit, previous, variation }`,
      `Envelope<T> { current, previous }`, `SeriesPoint`, `BreakdownSlice` —
      `src/shared/models/types/metric.types.ts` + `src/shared/utils/metricFormat.ts`
- [x] Helper that resolves the period into the two windows and the bucket
      list for `por` — `src/shared/utils/periodWindow.ts` (`fillSeries` zero-fills)
- [x] First server function `getOrdersOverview` returning the envelope —
      `src/modules/orders/ordersController.ts` → `ordersService.ts`
- [x] Enum mapping at the boundary (Prisma UPPER → Portuguese labels in the
      query layer; no Prisma types reach screens)

### Base patterns (shared/ui)

- [x] `KpiCard` + `metricToTile` — MetricValue → MetricTile with computed
      variation, `goodWhen` direction and configurable comparison label
- [x] `DataTable` — pagination (10/20/50/100), sort, TOTAL row, empty state
      "Não há dados disponíveis para os filtros selecionados." (client-side;
      server-side paging comes with Pedidos › Lista)
- [x] CSV export helper (pt-BR separators, BOM for Excel) — `src/shared/utils/csv.ts`
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
      (`src/routes/devOrders.tsx`, `src/modules/orders/OrdersDev.tsx`)
- [x] `npm run typecheck` + `npm run build` green

---

## Stage 0.5 — Architecture alignment (before any new screen)

The layout at the time (`features/` + `design-system/` + `server/` + `lib/`) was
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
- [x] Proposed mapping for this stack (React 19 + TanStack Start + Prisma):
      target tree, layer diagram, where contracts live, alias policy,
      server-only guarantee — `specs/architecture.md`, approved 2026-09-12
- [x] Enforce cycles and boundaries with tooling, not convention — the
      reference's `no-restricted-imports` patterns in `eslint.config.js`;
      dependency-cruiser graph + `scripts/checkCycles.ts` (Tarjan) as
      `npm run check:cycles`, cap 0
- [x] Barrel (`index.ts`) policy decided and applied — no barrels; every
      `index.ts` deleted, `shared/ui` is flat, `contract.ts` is the one
      hand-written exception
- [x] Contract convention: producer owns; `contract.ts` per module;
      `<x>Controller.ts` (server fns) → `<x>Service.ts` (Prisma) →
      `<x>.types.ts`; `metrics.ts` split into `shared/models/types/metric.types.ts` + `shared/utils/metricFormat.ts`; orders module re-shaped
- [x] Move the Stage 0 files to the new layout (schema/seed untouched) —
      four commits; typecheck, lint (0 warnings), cycles (0), tests, build
      green; all routes incl. `/dev/pedidos` render
- [x] Update `CLAUDE.md` (Architecture section), `src/shared/ui/README.md`,
      `specs/conventions.md`, `design-system.md`, `data-layer-migration.md`,
      the other specs' paths and `data-module-plan.md`
- [x] Record what is enforced by lint vs. what is convention only —
      `specs/architecture.md` §8; decision in
      `specs/decisions/2026-09-12-modules-contracts-cycle-ratchet.md`
- [x] CI: `.github/workflows/ci.yml` (typecheck, lint 0 warnings, cycles 0,
      tests, prettier, build)
- [x] Vitest with the first colocated tests (period, metricFormat, cyclicFiles)

---

## Stage 1 — Painel de Controle (`/`)

- [x] Period selector on the dashboard header + `ChannelToggle` (canal as a
      global search param)
- [x] "Falha na requisição" error block — `shared/ui/RequestError.tsx`, used as
      the dashboard route `errorComponent`
- [x] Remove the `/dev/pedidos` proving ground
- [x] Server function `getDashboardOverview` returns scalars, series, source
      breakdown and the matrix in one payload (one loader instead of Prax's
      5–9 calls); facts come from `orders`, `customers`, `marketing`, `money`
      and `connections` through their `contract.server.ts`
- [x] Indicator carousel with the 10 metrics + big number + comparison series;
      formulas in `dashboardMetrics.ts` (tested)
- [x] "Vendas por origem" block (UTM source/medium; marketplaces by channel)
- [x] "Resumo financeiro" matrix table with CSV (12 rows × buckets)
- [x] Channel toggle (Todos / E-commerce / Marketplace) as `canal` search param
- [x] Keep alerts, milestone, recommendations — headline KPIs (Faturamento,
      Margem de contribuição, CAC, Recompra) wired to the live metrics; the
      fixture 12-month chart was dropped (the period series replaces it)
- [x] Fidelity badge per metric derived from `DataSource` status —
      `dashboardFidelity.ts` (tested): weakest source wins, informed costs cap
      at B, the note names the culprit
- [x] Update `specs/dashboard.md`
- [x] Cost engine (`money/costEngine.ts`, tested) built early because Lucro
      líquido, ROI and CAC need it; Stage 3 adds the registry UI and the DRE
- [x] Two contracts per module (`contract.ts` + `contract.server.ts`) —
      recorded in `specs/architecture.md`

---

## Stage 2 — Pedidos (`/pedidos`)

- [x] Route `orders.tsx` ↔ `/pedidos`, sidebar "Dados" group; bottom nav
      unchanged (six consulting items) — revisit when Produtos/Clientes land
- [x] Tabs via `?aba=resumo|aprovacao|lista` (zod route schema, defaults
      stripped from the URL, one loader payload per tab)
- [x] **Resumo**: KPI carousel with the nine indicators + comparison series
      (`ordersSummaryMetrics.ts`, tested)
- [x] **Resumo**: "De onde vêm as minhas vendas?" donut + table by channel/source
- [x] **Aprovação**: approval-rate series + three donut+table blocks (status,
      método, gateway)
- [x] **Aprovação**: dynamic filter options (only values present in the period)
- [x] **Lista**: transactional DataTable in remote mode — search, every
      filter, server-side paging and sorting
- [x] **Lista**: custo / lucro bruto / margem per order from `OrderItem.unitCost`
- [x] CSV on Lista (whole result via `getOrdersExport`), on the source table
      and on the three approval tables
- [x] Write `specs/orders.md`

---

## Stage 3 — Custos + DRE (extend `/dinheiro`)

- [x] Tabs on Dinheiro: `?aba=visao|dre|custos` (pillars stay in `visao`)
- [x] Cost taxonomy constants (3 categories × subcategories from doc §10.2) —
      `costTaxonomy.ts`
- [x] Cost registry table (Nome · Descrição · Início · Fim · Canal ·
      Categoria · Subcategoria · Frequência · Valor) with edit/delete and CSV
- [x] "Adicionar custo ou despesa" dialog form with 8 frequencies + validity
      window (react-hook-form + zod, validated on both sides)
- [x] Server functions with write path (`createCostRule`, `updateCostRule`,
      `deleteCostRule`, POST) — first real writes of the product
- [x] Unsaved-changes guard on the form (`useBlocker` + confirm dialog +
      `beforeunload`)
- [x] Cost engine — built in Stage 1 (`costEngine.ts`, tested)
- [x] DRE: Receita → Custos → Lucro bruto → Despesas de marketing → Margem de
      contribuição → Despesas operacionais → Lucro líquido (`dre.ts`, tested)
- [x] DRE matrix table (line × bucket, period total with variation) with CSV
- [x] Indicadores gerenciais KPI row (7 ratios with comparison)
- [x] Dinheiro pillars (Margem de contribuição, CMV, taxa do adquirente,
      custo de frete/pedido) read the DRE indicators
- [x] Update `specs/sections.md` (money) + write `specs/finance.md`

---

## Stage 4 — Produtos (`/produtos`)

- [x] Route `products.tsx` ↔ `/produtos`, tabs `?aba=resumo|lista|estoque`;
      sidebar "Dados" entry
- [x] ABC classification (cumulative revenue Pareto 80/95) — `abcClassification.ts`, tested
- [x] **Lista**: product DataTable (classe ABC, categoria, saúde do estoque,
      unidades, total vendido, % vendas, lucro, preço médio, custo, margem) +
      filters (categoria, subcategoria, marca, coleção) + CSV. Sessões and
      conversão por produto are a data pending (no GA4 by product page yet)
- [x] **Estoque** (no period selector): velocity, dias para zerar, data de
      fim de estoque, valor do estoque, potencial de receita, receita perdida
      desde ruptura, custo de ruptura/dia; fixed sales windows (total / 90 /
      30 / 7 dias) — `inventoryMetrics.ts`, tested
- [x] **Estoque**: chip filters (risco · maior velocidade · sem estoque) +
      sales-window chips
- [x] **Resumo**: KPIs (receita de produtos, itens vendidos, valor médio por
      item, itens por pedido) with comparison
- [x] **Resumo**: top/bottom 20 by volume, inventory risk, out of stock,
      bought together (by conversion pending the product-page sessions)
- [x] Logística pillars (Ruptura, Cobertura de estoque) read the live stock
      position through `products/contract.server.ts`
- [x] Write `specs/products.md`

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
