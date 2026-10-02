# M4 — Make the locked screens usable for the pilots

## Context

Davi (2026-09-29): "quero deixar funcional primeiro, depois focar na parte de vender". Only
Marketing and Pedidos are released; nine screens show "Em desenvolvimento". The screen-by-screen
survey found that the main problem is not per screen, it is **data no integration writes**:

- **Product cost:** every connector mapper (Bling, Shopify, Nuvemshop, Mercado Livre, Amazon)
  writes `unit_cost = null`; only the orders CSV can carry a cost and no screen asks for it. The
  `coalesce(..., 0)` turned "unknown" into zero → Margem 100%, CMV 0, Lucro = receita (Produtos,
  Dinheiro/DRE, Dashboard).
- **Stock:** nothing wrote `product_variant.stock_qty` (born 0, never changed) → on a real store
  every product showed "Sem estoque", Logística showed Ruptura 100% / Cobertura 0 dias with the
  false note "sincronizado da plataforma", and the stockout alert fired for everything.
  `last_sale_at` was written only by the seed.
- Category always the default (Bling/ML/Amazon); ML/Amazon items without SKU collapse into one
  product ("ML"/"AMZ").

Per screen: Métricas, Metas, Gestão nearly ready; Clientes and Influenciadores need small fixes
(one calculation error in Influenciadores); Produtos, Dinheiro and Logística need real cost and
stock; the Assistente is an entire mock and stays locked.

Decisions this plan follows: Bling is the sales source (2026-09-22); one source per data kind
per store (2026-09-23); the AI-read spreadsheet accepts any layout (G3).

## Slices — 6 commits

### Task A — Real cost and stock (the one M4 migration is born in A1)

**A1 — "Unknown" never becomes zero.** Migration `inventory_known`: `stock_qty` nullable,
`stock_updated_at`, `last_sale_at` dropped (derived from the orders), `ImportKind.PRODUCTS`
declared (offered from A2). Unknown cost: CMV, profit and margins only from items with a cost,
with the coverage; no cost at all → "—" and "Cadastre o custo dos produtos". Unknown stock: out
of rupture, coverage, "sem estoque", "em risco" and the alerts. Decision
`decisions/2026-10-02-unknown-cost-and-stock-are-not-zero.md`.

**A2 — Products spreadsheet: cost, stock, category.** The **Produtos** import kind on the
existing pipeline (`sku*, produto, custo, estoque, categoria`, free mapping + G3 suggestion).
Writes variant cost, stock (+ date) and category; a new cost fills `order_item.unit_cost` of the
orders that had none. Undoable (new `UndoRecorder` entity).

**A3 — Bling brings cost, stock and category.** The Bling provider reads products (`precoCusto`,
category) and balances (`/estoques/saldos`) on sync, per integration/account; pure mapper +
test against the stub; `docs/apis/bling.md`. ML/Amazon items without SKU are keyed by the
listing id.

### Task B — Fixes to release (no migration)

**B1 — Métricas, Metas, Gestão.** Coverage notice when a metric lacks its source (no GA4 →
conversion/sessions; no Ads → ROAS/CPA/CAC); remove the "com uma chave de IA…" promise; Metas
years relative to the current year, suggestion from the last 12 months; Gestão "Concentração de
receita" computed (`topChannelShare`), empty state "seu consultor preenche estes indicadores".

**B2 — Clientes, Influenciadores, Dinheiro.** Coupons count only inside each coupon's window, a
shared code is not summed twice, empty-state hint, notice that Bling/Amazon carry no coupon;
synthetic marketplace e-mails out of the audience export, Origem = marketplace without UTM;
"Taxa média do adquirente" renamed to what it measures, marketplace freight in the cost per
order.

**B3 — Release.** Smoke of every screen on a store with connector/spreadsheet data only and on
an empty one; pilot board and specs say what is ready; the ready screens join the default
released set for a new store. Per-store release stays with staff in /admin.

### Task C — A real assistant: its own plan after B (stays locked).

## Verification (per slice)

`typecheck`, `lint` (caps api 15 / web 7), `check:cycles 0`, `test`, `format:check`, `build`;
smoke on a store with only spreadsheet/connector orders (no cost, no stock): no 100% margin, no
100% rupture, no false "sem estoque"; after the products spreadsheet (A2) or the Bling stub sync
(A3) the numbers appear; empty store without errors; web at 1280/390. `db-reviewer` on A1/A2,
`security-auditor` on A2/A3, `check-design-system` on the screens.
