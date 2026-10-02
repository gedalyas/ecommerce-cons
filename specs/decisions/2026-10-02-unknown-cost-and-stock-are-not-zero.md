# 2026-10-02 — An unknown cost or stock is not zero

## Contexto

No connector brings a product cost (`unit_cost` is null for Bling, Shopify, Nuvemshop, Mercado
Livre and Amazon) and none brought stock: `product_variant.stock_qty` was `NOT NULL` and every
variant created by an order started at 0. The queries summed `coalesce(unit_cost, 0)` and read
`stock_qty = 0` as "out of stock". On a real store this showed Margem 100%, CMV R$ 0,
Lucro = receita, Ruptura 100%, every product "Sem estoque", and the stockout alert firing for the
whole catalog — the screens were wrong in the most convincing way, which blocked releasing
Produtos, Dinheiro and Logística to the pilots (M4).

## Decisão

- **Cost.** `ordersAggregate` returns `costCoverage` (share of item revenue whose cost is known)
  and `cogs: null` when that share is under **90%** (`minimumCostCoverage`). A null CMV empties the lines
  that depend on it — Custos totais, CMV, Lucro bruto, Margem de contribuição, Lucro líquido,
  their margins, and the Dashboard's Lucro líquido / Margem de contribuição — shown as "—" with
  "Cadastre o custo dos produtos" (or "Só N%… cadastre o custo dos demais"). From 90% to 100%
  the figures use the known costs and a notice says the CMV is slightly understated. A product or an order whose items are not all costed has no
  cost, profit or margin.
- **Stock.** `stock_qty` is nullable and new variants start at null; `stock_updated_at` records
  when a source last informed it. A variant with unknown stock leaves rupture, coverage, the
  "em risco" / "sem estoque" lists and the stock alerts; `InventoryHealth.untracked` counts it
  and the screens say "Sem fonte de estoque" when nothing is tracked.
- **Last sale** is derived from the paid orders (`max(placed_at)`) in the inventory query; the
  `last_sale_at` column, written only by the seed, is dropped.

## Por quê

Below 90% the known CMV is too small a part to subtract from the whole revenue: one costed SKU
out of a R$ 100 mil month would show a 99% margin. Above it the error is a few points and the
notice says so; demanding 100% would blank the DRE for good over a gift or an unmatched listing.

A blank with a reason makes the client inform the cost; a confident wrong number makes them
distrust (or worse, believe) the product. Deriving the last sale from orders keeps it right
after an import is undone, which a stored column would not.

## Alternativas descartadas

- **Estimate the missing cost** (extrapolate the known CMV share to the uncovered revenue): looks
  complete but invents a number per store; kept as a possible later option behind an explicit
  label.
- **Treat a partially costed product as costed** (sum only the known items): understates the
  cost and overstates the margin silently.
- **Keep `stock_qty` NOT NULL with a sentinel (-1)**: every reader would need to know the
  sentinel; null is what Prisma, the API and the UI already treat as "unknown".
