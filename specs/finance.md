# Dinheiro (`/dinheiro`): Visão, DRE and Custos

Module: `src/modules/money`. The route loader calls `getMoneyScreen` with the
global params plus `?aba=visao|dre|custos` (`moneySchema.ts`); the payload is
`MoneyScreen`, a union on `aba`. Header and pillars keep the section anatomy
of `sections.md`; the controls row (`PeriodSelector` + `ChannelToggle`) and the
`TabBar` sit between the header and the content.

## Visão (`?aba=visao`)

The two pillars of the section (Organização, Custos e taxas) read from the
`section`/`pillar` tables (seeded from `moneyFixture.ts`), with four KPIs replaced by live DRE indicators of the
period: Margem de contribuição, CMV, Taxas e custos de venda (the selling-cost rules over
revenue — it was labelled "Taxa média do adquirente", which it never measured alone) and Custo de
frete / pedido (the shipping rules accrued on each business unit's own orders: a marketplace
freight rule counts on the marketplace orders, an e-commerce one on the store's). They carry
fidelity B ("calculado sobre pedidos pagos e as regras de custo informadas
pelo cliente"). The other KPIs (caixa livre, ciclo de caixa, despesa fixa /
receita) stay on the seeded values until their sources exist.

## DRE (`?aba=dre`)

1. **Indicadores gerenciais** — `MetricTileGroup` with Margem bruta, Margem
   de contribuição, Margem líquida, CMV, Taxas e custos de venda, Marketing
   sobre receita, Custo de frete por pedido; each compared with the previous
   window (`computeDreIndicators`, tested).
2. **Análise financeira** — `DataTable` matrix: one row per DRE line, a
   "Período" column with the total and its variation, then one column per
   bucket; CSV. Lines (`computeDre`, tested):

   ```
   Receita total
     Receita de produtos              (product revenue − discounts, PAID)
     Receita de frete
   Custos totais
     CMV                              (Σ qty × unit cost of PAID items)
     Checkout, gateway, frete, impostos e marketplace   (COGS-category rules)
   = Lucro bruto
   Despesas de marketing              (ad spend + platform fee + SALES_MARKETING rules)
   = Margem de contribuição
   Despesas operacionais              (OPERATIONAL rules)
   = Lucro líquido
   ```

   **Unknown cost.** When less than 90% of the item revenue of the window (or bucket) has a
   unit cost, CMV is null and so are Custos totais, Lucro bruto, Margem de contribuição and
   Lucro líquido, with their margins ("—", never a 100% margin). From 90% up the lines use the
   known costs.
   Visão and DRE show a warning above the content (`costCoverageNotice` from
   `ordersAggregate.costCoverage`): "Cadastre o custo dos produtos…" or "Só N% da receita de
   produtos tem custo cadastrado…" / "o CMV fica um pouco abaixo do real" — decision
   `decisions/2026-10-02-unknown-cost-and-stock-are-not-zero.md`.

## Custos (`?aba=custos`)

The registry that feeds the DRE, the margins and the profit everywhere.

- Table (CSV): Nome · Descrição · Início · Fim · Canal · Categoria ·
  Subcategoria · Frequência · Valor, with edit and delete actions.
- **"Adicionar custo ou despesa"** dialog (`CostForm.tsx`, react-hook-form +
  zod, `costInputSchema` validated on both sides): Nome (≤ 75) · Descrição
  (≤ 250) · Unidade de negócio (E-commerce · Marketplace · Ambos) · Categoria
  (Custo de mercadorias vendidas · Vendas e marketing · Operacional) ·
  Subcategoria (dependent list, `costTaxonomy.ts`) · Frequência (Diário ·
  Semanal · Mensal · Anual · Não recorrente · Por pedido · Percentual por
  pedido · Percentual do gasto em ads) · Valor (R$ or %) · Início / Fim.
- Writes: `createCostRule`, `updateCostRule`, `deleteCostRule` (POST server
  functions, CSRF middleware); the screen invalidates the router after each.
- Leaving the form with unsaved changes opens "Descartar alterações não
  salvas?" → Continuar editando / Sair sem salvar (`useBlocker`); the browser
  `beforeunload` prompt covers reloads.

## Cost engine (`costEngine.ts`, tested)

`expandCosts(rules, window, activity)` prorates DAILY/WEEKLY/MONTHLY/YEARLY by
the days the rule is active inside the window, charges ONE_TIME when its
start is inside, applies PER_ORDER and PERCENT_PER_ORDER to the orders and
revenue of the rule's business unit, and PERCENT_OF_AD_SPEND to the ad spend.
The result is the three DRE lines (cogs, salesMarketing, operational).

## Errors

A failed loader renders `RequestError` with a retry; a failed write shows an
inline message inside the dialog and keeps the form open.
