# Pedidos (`/pedidos`)

Module: `src/modules/orders`. The route loader calls `getOrdersScreen` with the
global params (`?inicio&fim&por&comparar&canal`) plus the screen's own
(`ordersSchema.ts`): `aba`, the filters (`origem`, `status`, `gateway`,
`metodo`, `cupom`, `uf`, `cidade`, `busca`) and the list paging (`pagina`,
`porPagina`, `ordenar`, `direcao`). Only the active tab's data travels
(`OrdersScreen` is a discriminated union on `aba`). Defaults are stripped
from the URL, so a plain `/pedidos` is the Resumo of the last 30 days.

Header: title "Pedidos", subtitle "Captura, aprovação e detalhe dos pedidos
de {período} · Loja Aurora". Controls row: `PeriodSelector` + `ChannelToggle`.
Then the `TabBar`: **Resumo · Aprovação · Lista · Regiões**.

## Resumo (`?aba=resumo`)

1. **Indicadores** — `IndicatorCarousel` with nine chips; the selected one
   drives the big number and a `TimeSeriesChart` with the comparison window:

   | Indicator           | Formula (`ordersSummaryMetrics.ts`, tested) |
   | ------------------- | ------------------------------------------- |
   | Receita capturada   | Σ total of every order created              |
   | Receita paga        | Σ total of PAID orders                      |
   | Taxa de aprovação   | paga ÷ capturada                            |
   | Pedidos pagos       | count of PAID orders                        |
   | Ticket médio        | paga ÷ pedidos pagos                        |
   | Itens por pedido    | Σ items ÷ pedidos pagos                     |
   | Total de descontos  | Σ discounts of PAID orders                  |
   | Desconto por pedido | descontos ÷ pedidos pagos                   |
   | Frete               | Σ shipping of PAID orders                   |

2. **"De onde vêm as minhas vendas?"** — `DonutBreakdown` of paid revenue by
   source and a `DataTable` (CSV) with Canal · Origem · Total capturado ·
   Total pago · Taxa de aprovação · Pedidos pagos · Ticket médio · Itens
   vendidos · Total de descontos · Desconto médio por pedido. Source is
   `utm_source / utm_medium` for the store and the channel name for marketplaces.

## Aprovação (`?aba=aprovacao`)

Where revenue gets stuck. Filters (status, gateway, método) offer only the
values present in the period (`ordersFilterOptions`), then:

1. **Taxa de aprovação ao longo do tempo** — paid ÷ captured per bucket, with
   the comparison window dashed.
2. Three identical blocks — **Status de pagamento**, **Método de pagamento**,
   **Gateway de pagamento** — each a donut of the captured share plus a table
   (CSV): Valor · Total capturado · Total pago · Taxa de aprovação · Pedidos ·
   Pedidos pagos. Labels come from `ordersLabels.ts` (Pago, Pendente, …;
   Cartão de crédito, Pix, Boleto).

## Lista (`?aba=lista`)

Transactional level. Search "Buscar por pedido, cliente ou e-mail" (submits on
Enter/Buscar; matches order number, customer name or email), every filter as
a `MultiSelect`, and a `DataTable` in remote mode (server-side paging
10/20/50/100 and sorting by pedido, data, total, itens, custo, lucro bruto,
margem). Columns: Pedido · Data · Canal · Origem · Status · Cliente · E-mail ·
Telefone · Total vendido · Itens · Custo · Lucro bruto · Margem. Custo is Σ
qty × unit cost of the items; Lucro bruto = total − custo; Margem = lucro ÷
total. "Exportar CSV" calls `getOrdersExport` and downloads the whole result
(up to 5.000 rows).

## Regiões (`?aba=regioes`)

Where the paid revenue comes from, by delivery address (`regionsService.ts`, rows shaped by
`regionRows.ts`, tested). Filters: Estado and Cidade (the same multi-selects of the list),
plus the channel toggle.

1. **Overview tiles** — Estados com venda · Cidades com venda · Maior estado (share of the
   paid total) · Top 3 estados (concentration).
2. **Mapa de pedidos por estado** — `BrazilTileMap` (`shared/ui`): a tile cartogram of the 27
   UFs in their approximate geographic positions, coloured in five intensity levels by the
   paid total; the tooltip shows the value. A tile map replaces the choropleth on purpose: no
   GeoJSON, no map library, and every state is readable at phone width.
3. **Pedidos por estado** and **Pedidos por cidade** — the same family of columns as Prax:
   Total pago · % do total pago · Total captado · Taxa de aprovação · Pedidos pagos · Pedidos
   captados · Ticket médio · Clientes · Itens · Itens por pedido · Total de descontos ·
   Desconto por pedido pago. Sortable, CSV.

## Data flow

`routes/orders.tsx` → `getOrdersScreen` (`ordersController.ts`) →
`ordersScreenService.ts` (Resumo, Aprovação, filters, Lista) →
`ordersService.ts` (aggregates, buckets, the shared `ordersWhere` filter
builder). `useOrdersSearch` patches the route search; any filter change
resets the page to 1.

## Navigation

The sidebar has a "Dados" group with Pedidos. The mobile bottom nav keeps its
six consulting items; data screens are reached from the sidebar (≥ md) and
from links. Revisit when Produtos and Clientes land.

## Errors

A failed loader renders `RequestError` with a retry.
