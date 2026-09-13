# Data module — development plan

Goal: match or beat Prax Analytics on the **DADOS** module (see
`prax-analytics-documentacao-completa.md`, sections 4–10, 20–21), adapted to
our product. This plan breaks that into sequential development stages; each
stage ships value on its own and unlocks the next.

## Where we stand vs. Prax

| Capability       | Prax                                                                                              | Us today                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Data grain       | 7 fact entities (order, item, customer, product, session, ad spend, cost)                         | Pre-computed presentation metrics only (10 dashboard-shaped models) |
| Period selection | 4 global URL params + presets + comparison                                                        | None — period baked into copy ("agosto de 2026")                    |
| Comparison       | `{ current, previous }` envelope computed server-side                                             | Hardcoded delta strings in fixtures                                 |
| Tables           | Paginated, sortable, filterable, CSV, TOTAL row                                                   | Hand-rolled `<ul>` lists                                            |
| Charts           | Time series w/ comparison, donut, funnel, treemap, choropleth                                     | One static LineChart                                                |
| Screens          | Painel, Marketing (5 tabs), Pedidos (4), Recompra (2), Clientes RFM, Produtos (3), Financeiro (2) | 1 dashboard + 4 pillar sections + conexões + assistente             |

## What we keep as differentiators (Prax does not have these)

- **Fidelity seal (A/B/C)** on every metric — data confidence is our identity.
- **Consulting layer**: pillars, recommendations with owner/due date,
  maturity milestones. Prax shows numbers; we say what to do about them.
- **Assistant** already integrated in the shell.

The data module goes **under** this layer, not instead of it: every new data
screen keeps fidelity badges and can feed recommendations.

## Information architecture

Keep the 4 consulting areas as the top navigation. Add data screens as new
routes (English file ↔ Portuguese URL in `src/routes.ts`):

| New URL               | Route file      | Prax equivalent                            |
| --------------------- | --------------- | ------------------------------------------ |
| `/pedidos`            | `orders.tsx`    | Pedidos (Resumo · Aprovação · Lista)       |
| `/produtos`           | `products.tsx`  | Produtos (Resumo · Lista · Estoque)        |
| `/clientes`           | `customers.tsx` | Clientes (RFM) + Recompra                  |
| `/dinheiro` (extend)  | `money.tsx`     | Financeiro (DRE + Custos)                  |
| `/marketing` (extend) | `marketing.tsx` | Marketing (Resumo · Campanhas · Descontos) |
| `/` (extend)          | `dashboard.tsx` | Painel de Controle                         |

Tabs within a screen use a `?aba=` search param (Portuguese values).

---

## Stage 0 — Foundations (expensive-to-change decisions first)

Prax's own architecture lessons (doc §22) all live here. Nothing user-visible
yet except the period selector on the dashboard.

1. **Fact schema** (`prisma/schema.prisma`, additive migration): `Order`,
   `OrderItem`, `Customer`, `Product` + `ProductVariant`, `TrafficDaily`
   (sessions/users/funnel events per day per source), `AdSpendDaily`
   (platform, campaign/adset/ad hierarchy, spend, platform fee separate,
   impressions, clicks, region), `CostExpense` (category, subcategory,
   business unit, frequency incl. per-order/percentage modes, validity
   window). Field list: competitor doc §20.1.
2. **Seed generator**: plausible 18 months of Loja Aurora data at order
   grain (~4–6k orders, ~2k customers, ~80 products), generated
   deterministically (seeded RNG) in `prisma/seed.ts` so aggregates roughly
   reconcile with the existing headline fixtures.
3. **Global period params in the URL** via TanStack Router search params:
   `inicio`, `fim`, `por` (dia/semana/mes/ano), `comparar`
   (nenhum/periodo-anterior/mes-anterior/ano-anterior). Shared
   `usePeriod()` hook + `PeriodSelector` pattern (presets: hoje, ontem,
   esta semana, este mês, últimos 30/90 dias, últimos 12 meses, ano até
   hoje, custom range).
4. **Server-function conventions** (`src/modules/<x>/<x>Service.ts`): every query
   returns `{ current, previous }`; scalar metrics are objects
   `{ value, unit, variation }`, never bare numbers. One server function
   per visual block so cards load and fail independently.
5. **Base patterns** in `src/shared/ui/`: `KpiCard` (extends
   MetricTile with computed variation), `DataTable` (pagination, sort,
   TOTAL row, CSV export), `TimeSeriesChart` (solid = current, dashed =
   previous), `DonutBreakdown`, `IndicatorCarousel` (chips → big number +
   series). All within token constraints.
6. **`src/shared/utils/format.ts` additions**: `formatVariation`, `formatPeriodLabel`,
   `formatMultiplier` ("0,00x").

Deliverable: dashboard gains a working period selector; a hidden dev route
proves one end-to-end query (orders by date with comparison envelope).

## Stage 0.5 — Architecture alignment (added 2026-09-12)

Before any new screen, align the folder architecture with the one the team
uses in its other systems, using a reference document generated there
(`specs/architecture-reference.md`, owner: Davi). Two things matter most:
how import cycles are prevented (tooling, not convention) and how files talk
to each other through contracts (ownership, naming, client/server boundary).
Output: `specs/architecture.md` with the mapping for this stack, lint rules
enforcing it, and the Stage 0 files moved into the new layout. Doing it now
costs one small move; doing it after Stage 6 would cost six.

## Stage 1 — Painel de Controle (upgrade `/`)

Competitor doc §4. Keep alerts/milestones/recommendations; replace the static
KPI row and chart with live queries.

- Indicator carousel: Total vendido · Pedidos · Ticket médio · Taxa de
  conversão · Investimento em marketing · ROI · CAC · CPA · Lucro líquido ·
  Clientes — each with time series and comparison.
- "Vendas por origem" (donut/bars from UTM fields on orders).
- "Resumo financeiro" matrix table (metric × time bucket), CSV.
- Fidelity badges wired to source status (Conexões) — **better than Prax**:
  they gate the whole screen; we degrade per-metric with the A/B/C seal.

## Stage 2 — Pedidos (`/pedidos`)

Competitor doc §6. Highest practical value in Brazil, cheap to build once
Stage 0 exists.

- **Resumo**: captured vs. paid revenue, approval rate, KPI carousel,
  revenue by channel/source table.
- **Aprovação**: three donut+series blocks (status de pagamento, método,
  gateway) with dynamic filters — structure is trivially replicable.
- **Lista**: transactional table with search, filters, pagination, CSV, and
  per-order cost/profit/margin (depends on `OrderItem.unitCost`).

## Stage 3 — Custos + DRE (extend `/dinheiro`)

Competitor doc §10 — "the engine of the financial model". Unlocks margin,
profit and CAC-real everywhere else, so it comes before Products/RFM.

- Cost registry CRUD: category/subcategory taxonomy, 8 frequencies
  (including per-order %, % of ad spend), validity window, business unit.
  First real write path (schema step 5 of `data-layer-migration.md`).
- Managerial DRE: Receita → Custos → Lucro bruto → Despesas de marketing →
  Margem de contribuição → Despesas operacionais → Lucro líquido, as a
  metric × time matrix with CSV.
- Existing Dinheiro pillars start reading derived values instead of fixtures.

## Stage 4 — Produtos (`/produtos`)

Competitor doc §9. Connects to our Logística area (stock pillars).

- **Lista**: ABC curve + full product table (sessions, conversion, revenue,
  cost, margin, share).
- **Estoque** (snapshot, no period selector): velocity, days-to-stockout,
  projected stockout date, stock value, lost revenue since stockout,
  stockout cost/day — the "justifies the subscription" metrics.
- **Resumo**: top/bottom sellers, inventory risk, out-of-stock, bought
  together.
- Logística pillar KPIs (ruptura, cobertura) become derived.

## Stage 5 — Clientes + Recompra (`/clientes`)

Competitor doc §7–8. The bridge from analysis to action ("if you build only
one thing beyond basic dashboards, build this").

- Customer aggregate table (one row per customer: identity, first/last
  order, count, total, R/F/M quintile scores, segment label) — computed at
  seed/refresh time, not per-request.
- RFM treemap + filterable customer table (segment, geography, products
  bought, coupons, ranges) with CSV — the export feeds campaign lists.
- Recompra: purchase-order-number as first-class concept
  (`row_number() over (partition by customer order by created_at)`, capped
  at 7+), repurchase rate, intervals between orders, LTV/CAC block.
- Feeds the Retenção pillar in Marketing and the assistant's context.

## Stage 6 — Marketing data (extend `/marketing`)

Competitor doc §5. Last because it depends on `AdSpendDaily` fixtures being
credible.

- **Resumo**: channel performance table, investment breakdown, marketing
  funnel with benchmark ranges (start with public sector benchmarks +
  Loja Aurora's own historical average — doc §13 says that's 80% of the
  value), sales by UTM.
- **Campanhas**: platform table → chart selection, best/worst campaigns,
  ROAS quality bands (>5 alto / 2–5 médio / <2 baixo) centralized in one
  module (`src/modules/marketing/qualityBands.ts`).
- **Descontos**: coupon KPIs + coupon table (new customer vs. subsidized
  recurring).
- Existing Marketing pillars become derived.

## Cross-cutting rules

- Every stage follows `data-layer-migration.md` conventions: server-only db
  module, enums mapped at the boundary, pt-BR copy / English keys.
- ROAS bands, funnel benchmarks and any market constants live in one
  server module, never in screens.
- No new colors/type sizes: charts use accent green for current series,
  `text-secondary` for comparison, orange only for warning states.
- Validate each stage with `npm run typecheck` + `npm run build`.

## Out of scope (Prax modules we are NOT copying now)

Metas, Benchmark de mercado, Planos de ação kanban, WhatsApp automations,
MCP server, multi-store, connectors/ingestion (our Conexões screen stays a
mock until there is a real client). The narrative AI analysis (doc §11) is
attractive but belongs to the assistant roadmap, after Stage 5 — the
driver-tree pattern (metric = precomputed drivers, AI only writes the text)
is the right way to build it when we get there.
