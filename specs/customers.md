# Clientes (`/clientes`)

Module: `src/modules/customers`. The route loader calls `getCustomersScreen`
with the global params plus `?aba=rfm|recompra|ltv-cac` and the RFM filter
panel (`customersSchema.ts`). `CustomersScreen` is a union on `aba`; defaults
are stripped from the URL. Header: "Clientes"; the `TabBar` reads **Clientes
(RFM) · Recompra · LTV e CAC**. The period/channel controls appear on
Recompra and LTV e CAC only — **RFM works on the whole base**.

## Clientes (RFM) (`?aba=rfm`)

This is the screen that connects analysis with action: the filtered list is
the audience of a campaign.

1. **Filter panel** (`RfmFilters.tsx`, `rfmWhere` in `rfmService.ts`):
   Segmentos RFM · Origem (first order's UTM source or marketplace) · Dias sem
   comprar (bands até 30 / 31–60 / 61–90 / 91–180 / 181+) · Gateway · Método ·
   Estado · Cidade · Comprou / Não comprou (products; stackable through
   multi-select) · Cupons with the **Incluir quem usou / Excluir quem usou**
   toggle · Compras entre · Primeira compra entre · Última compra entre ·
   Total vendido (min/max, hint with the base's range) · Pedidos (min/max).
   Every list offers only values that exist in the base. "Limpar filtros"
   resets them.
2. **Distribuição por segmento** — `TreemapChart`; the toggle switches the
   area between clientes and total vendido. "Recalcular segmentos" runs
   `refreshCustomerSegments` (POST): it recomputes first/last order, counts,
   totals, days since last purchase, R (recency quintile), F (orders, capped at
   5), M (spend quintile) and the label for every customer in chunks of 500
   (24k customers ≈ 2 s), reproducing the seed exactly.
3. **Clientes** table — Nome · E-mail · Telefone · Segmento RFM · Pedidos ·
   Total vendido · Última compra · Origem · Cidade / UF; server-side paging
   and sorting; "Exportar CSV" downloads the whole filtered set (up to 5.000).

Segment rules (`rfmSegments.ts`, tested): Campeões (R≥4, F≥3, M≥4) · Não
pode perder (R≤2, F≥3) · Leais (F≥3) · Potenciais leais (R≥4, F=2) · Novos
(R≥4) · Promissores (R=3, F=1) · Precisam de atenção (R=3) · Em risco (F=2)
· Perdidos (R=1) · Hibernando.

## Recompra (`?aba=recompra`)

KPIs are phrased as the business question, in three blocks (`repurchaseMetrics.ts`, tested):

- **Receita** — Quanto é o total vendido? · em pedidos de recompra? · taxa
  de recompra sobre o total vendido?
- **Pedidos** — Quantos pedidos? · de recompra? · taxa sobre o total?
- **Clientes** — Quantos clientes compraram? · mais de uma vez? · taxa? ·
  Quantas vezes um cliente compra ao longo da vida? (lifetime average of
  paid orders per buyer)

Then: **Intervalo entre compras** (average days from the first paid order to
the 2nd … 7º ou mais, among the orders of the period), **Quanto eu vendi
neste período?** (series with comparison), **compra vs. recompra** donut,
and two bar charts by order number: receita and ticket médio.

The order number is a first-class concept: `row_number()` over each
customer's paid orders across the whole history, capped at 7 in the screens.

## LTV e CAC (`?aba=ltv-cac`)

- **KPIs** — Lifetime value (ticket médio × frequência de compra), CAC por
  cliente (investimento em marketing ÷ novos clientes, in R$ — the one place the per-customer
  figure stays, because LTV/CAC needs it; everywhere else CAC is a percentage of revenue; investment = ad spend +
  platform fee + `SALES_MARKETING` cost rules), LTV/CAC with the market
  reference "saudável ≥ 3", Frequência de compra, Novos clientes.
- **Charts** — LTV × CAC por cliente no tempo, CAC por cliente × novos clientes
  (dual axis), CAC por cliente × CPA, and **Taxa de retenção por número de pedidos** (share of
  customers who reach the n+1th order).
- CAC and LTV/CAC carry fidelity B (Meta Ads out of sync + informed costs).

## Marketing › Retenção

`getRetentionSummary` (customers contract) returns Recompra 90 dias (repeat
paid orders ÷ paid orders in the last 90 days) and LTV 12 meses (average
revenue of customers acquired in the last 12 months). The **route**
`/marketing` loads it and passes it to `Marketing` as `MarketingRetention`, a
shape the marketing module declares itself — marketing never imports
customers, because customers already depends on marketing (the ad spend
behind CAC) and the cycle ratchet would fail.

## Data flow

`routes/customers.tsx` → `getCustomersScreen` → `customersScreenService.ts`
→ `rfmService.ts` (filters, table, segments, refresh) and
`repurchaseService.ts` (ranked orders, LTV/CAC with the money cost engine
and the marketing ad spend through their the API module `contract.ts`).
