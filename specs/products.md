# Produtos (`/produtos`)

Module: `src/modules/products`. The route loader calls `getProductsScreen`
with the global params plus `?aba=resumo|lista|estoque`, the catalog filters
(`categoria`, `subcategoria`, `marca`, `colecao`) and the Estoque chips
(`estoque`, `janela`) — `productsSchema.ts`. `ProductsScreen` is a union on
`aba`; defaults are stripped from the URL.

Header: "Produtos · Vendas, curva ABC e estoque · {período}". Controls row
(`PeriodSelector` + `ChannelToggle`) on Resumo and Lista; **Estoque has no
period** — it is a snapshot with fixed sales windows. Then the `TabBar`.

## Resumo (`?aba=resumo`)

1. **KPIs** — Receita de produtos (product revenue net of discounts), Itens
   vendidos, Valor médio por item, Itens por pedido; compared with the
   previous window.
2. **Volume de vendas · 20 mais vendidos / 20 menos vendidos** — Nome ·
   Quantidade · Total vendido · Margem (products with at least one unit sold).
3. **Risco de estoque** — variants that hit zero within 15 days at the
   30-day pace: Produto · Variante · SKU · Estoque · Vendas diárias estimadas ·
   Dias para zerar · Data estimada de falta.
4. **Produtos fora de estoque** — stock = 0: Dias desde a última venda ·
   Última venda · Receita perdida (historical pace × price × days out).
5. **Produtos comprados juntos** — pairs in the same paid order of the
   period: Produto 1 · Produto 2 · Vezes comprados juntos · Valor médio do
   pacote.

Every table exports CSV.

## Lista (`?aba=lista`)

Catalog filters (`MultiSelect`), then:

1. **Análise ABC** — three tiles (products, revenue and share per class).
   `classifyAbc` (tested) sorts by revenue and cuts the cumulative share at
   80% (A) and 95% (B); products without revenue are C.
2. **Produtos** table — Nome · Classe · Categoria · Saúde do estoque (OK /
   Risco / Sem estoque, from the window's velocity) · Unidades vendidas ·
   Total vendido · % das vendas · Lucro · Preço médio · Custo · Margem.
   Sessões and Taxa de conversão por produto are a **data pending**: they
   need GA4 by product page, which the model does not carry yet.

## Estoque (`?aba=estoque`)

Chips **Estoque** (Todos · Risco de estoque · Maior velocidade · Sem estoque)
and **Mais vendidos** (Todos os tempos · 90 · 30 · 7 dias, the sort window),
plus the catalog filters. One row per variant (`deriveInventory`, tested):

| Column                              | Formula                                                      |
| ----------------------------------- | ------------------------------------------------------------ |
| Vendas desde o início / 90 / 30 / 7 | units of PAID orders in each window up to `PROTOTYPE_TODAY`  |
| Velocidade                          | sold30 ÷ 30 (sold90 ÷ 90 when the last 30 days sold nothing) |
| Dias para zerar                     | estoque ÷ velocidade                                         |
| Fim de estoque                      | hoje + dias para zerar                                       |
| Valor do estoque                    | estoque × custo unitário                                     |
| Potencial de receita                | estoque × preço                                              |
| Receita perdida desde ruptura       | dias desde a última venda × velocidade histórica × preço     |
| Custo de ruptura/dia                | velocidade histórica × (preço − custo)                       |

## Logística

`inventoryHealthFor` (products the API module `contract.ts`) feeds the Logística
pillars: **Ruptura de estoque** = variants with stock 0 ÷ variants (A, from
the ERP balance) and **Cobertura de estoque** = total stock ÷ Σ daily
velocity (B). The other Logística KPIs stay on fixtures.

## Data flow

`routes/products.tsx` → `getProductsScreen` → `productsScreenService.ts`
(assembles the tab from the pure core) → `productsService.ts` (catalog
sales, inventory facts, bought-together pairs, filter options). Summary KPIs
reuse `ordersAggregate` through the orders the API module `contract.ts`.

## Estoque do marketplace (Full / FBA)

Every order records who shipped it (`sales_order.fulfillment`: SELLER or MARKETPLACE; null when the
source does not say — CSV and Bling today). Mercado Livre sets MARKETPLACE for Full
(`shipment.logistic_type = fulfillment`) and Amazon for FBA (`FulfillmentChannel = AFN`). A variant
whose last 30 days sold at least half through the marketplace is **estoque do marketplace**
(`isMarketplaceStock` in contracts, tested): the marketplace owns and refills that stock, so it
never raises the stockout alerts (`lowStockRiskAlert`, `keyVariantsUnavailableAlert`), stays out of
Resumo's "em risco" and "sem estoque" lists, and the Estoque table shows it in the column
**Estoque de quem** ("Do marketplace (Full / FBA)" / "Da loja"). A later write that does not know who
shipped (a CSV, a re-sync without the shipment) keeps the value already recorded. Gap: Bling orders
do not carry it yet, so a store whose sales come only from Bling never marks marketplace stock until
the Bling mapper reads its logistics field.
