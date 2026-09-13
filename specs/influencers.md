# Influenciadores (`/influenciadores`)

Module: `src/modules/influencers`. The route validates `?status=ACTIVE|PAUSED|ARCHIVED`
(default ACTIVE) and `busca` on top of the global period. Sidebar entry under "Dados".
The hub registers creator partnerships, their remuneration rules and the coupons that attribute
orders to them, and measures the ROI of each one.

## Model

`influencer` (name, `@handle`, status, notes) with N `influencer_rule` rows (type, value, start,
end, ceiling per period, notes, position) and N `influencer_coupon` rows (code, active from,
active until). Rule types, as in Prax: Taxa fixa · Recorrente diária · semanal · mensal · Por
pedido (fixo) · Por pedido (% dos produtos) · Por pedido (% do total). The seed creates three
partnerships: two active ones on the existing coupons INSTA10 and AMIGA15, one paused.

## Analytics (`influencersService.ts`, cost in `influencerCost.ts`, tested)

- **Revenue side** — paid orders whose `discount_codes` contain one of the partnership's coupons,
  as long as the coupon is active inside the period: Total de vendas (orders), Receita total,
  Receita de frete, Receita de produtos, Clientes, Novos clientes (first order of the customer),
  Taxa de recompra (orders that were a second or later purchase ÷ orders).
- **Cost side** — the rules applied over the period, clipped to each rule's validity: a fixed fee
  counts when its start date falls inside the period; recurring rules accrue per active day
  (÷ 7 for weekly, ÷ 30,44 for monthly); per-order rules multiply the attributed orders; the
  percent rules apply to product revenue or total revenue; the ceiling caps the rule's amount.
- **ROI** = (Receita total − Custo total) ÷ Custo total.

## Screen

1. **Controls** — `PeriodSelector`, search by name or identifier (Enter or blur), "Adicionar".
2. **Status tabs** — Ativo · Pausado · Arquivado with the count of each.
3. **Table** — Nome (with the handle) · Cupons · Total de vendas · Receita total · Custo total ·
   ROI · Receita de frete · Receita de produtos · Clientes · Novos clientes · Taxa de recompra,
   a Total row, CSV, and per-row edit and delete actions.
4. **Form** ("Adicionar / Editar influenciador", `InfluencerForm.tsx`) — Nome (120) ·
   Identificador · Status · Observações; **Remuneração**: stackable rules (type, value in R$ or
   %, início, término, limite por período, observações); **Códigos de desconto**: stackable
   coupons (código, ativo desde, ativo até). Zod validation with Portuguese messages; leaving
   with unsaved changes asks for confirmation. Saving replaces the rules and coupons of the
   partnership.
5. **Delete** — confirm dialog; orders are not touched.

Server functions: `getInfluencersScreen` (GET), `createInfluencerFn`, `updateInfluencerFn`,
`deleteInfluencerFn` (POST).
