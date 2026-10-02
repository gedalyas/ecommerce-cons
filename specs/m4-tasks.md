# M4 — tasks

Plan: [m4-plan.md](m4-plan.md). One commit per slice.

- [x] A1 Unknown cost and stock never become zero: migration `inventory_known` (`stock_qty`
      nullable + `stock_updated_at`, `last_sale_at` derived from orders, `ImportKind.PRODUCTS`
      declared); `costCoverage` / `costCoverageNotice` (contracts/orders) and
      `stockSourceNotice` / `productsCostCoverage` (contracts/products), tested; DRE, Dashboard,
      Produtos and Pedidos leave cost-dependent figures empty; untracked stock out of rupture,
      coverage, lists and alerts; notices on Dinheiro (Visão, DRE) and Produtos (Resumo, Lista,
      Estoque); Logística note fixed (2026-10-02)
- [x] A2 Products spreadsheet: `PRODUCTS` import kind (`sku*, produto, custo, estoque,
categoria, preco`), `productsWriteService` writes variant cost/price/stock and product
      name/category, creates unknown SKUs, fills the cost of uncosted order items; undo through
      `VARIANT` / `ITEM_COST` entries; later order items without a cost take the variant's;
      "Importar planilha de produtos" on the cost and stock notices (2026-10-02)
- [ ] A3 Bling brings cost, stock and category; ML/Amazon items without SKU keyed by listing
- [ ] B1 Métricas, Metas, Gestão ready to release
- [ ] B2 Clientes, Influenciadores, Dinheiro fixes
- [ ] B3 Release: smoke per screen, default released screens, boards and specs
