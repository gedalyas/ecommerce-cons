# Mercado Livre — API de vendas

Categoria: marketplace. Alimenta `order` (pedidos com `sales_platform = MARKETPLACE`, canal
"Mercado Livre").

## Registro

- Aplicação em <https://developers.mercadolivre.com.br/devcenter> (conta do desenvolvedor,
  não precisa ser a conta vendedora). Campos: nome, descrição, **URL de callback**
  (`https://<api>/api/v1/connectors/mercado_livre/callback`), escopos `read` + `offline_access`
  (para o refresh token). Sem revisão manual para leitura de pedidos.
- Cada vendedor autoriza a aplicação uma vez ("Conectar" no produto); o token é do vendedor.

## Autenticação (OAuth 2.0, authorization code)

1. `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=<app id>&redirect_uri=…&state=…`
2. Callback com `code` → `POST https://api.mercadolibre.com/oauth/token`
   (`grant_type=authorization_code`, `client_id`, `client_secret`, `code`, `redirect_uri`) →
   `access_token` (**6 horas**), `refresh_token` (uso único, rotacionado a cada refresh,
   validade 6 meses) e `user_id` do vendedor.
3. Refresh: `POST /oauth/token` com `grant_type=refresh_token` — devolve um novo par.
4. Chamadas com `Authorization: Bearer`.

## Dados que usamos

- `GET /users/me` → `nickname` (rótulo da conexão).
- `GET /orders/search?seller=<user_id>&order.date_last_updated.from=…&order.date_last_updated.to=…&sort=date_asc&offset=0&limit=50`
  — a busca já devolve o pedido completo: `status` (`paid`, `confirmed`,
  `payment_required`, `payment_in_process`, `partially_paid`, `cancelled`, `invalid`),
  `date_created`, `last_updated`, `total_amount`, `coupon`, `buyer` (id, nickname, nome —
  **sem e-mail**), `payments[]` (status, `payment_type`, `shipping_cost`), `order_items[]`
  (item id/título/`seller_sku`, quantidade, `unit_price`), `shipping.id`.
- `GET /shipments/{id}` → `receiver_address.city.name` e `state.id` (`BR-SP`).

## Limites

Busca de pedidos paginada por `offset`/`limit` (máx. 51 por página); janelas de data longas
respondem lento — o provider varre blocos de 90 dias. Cotas por aplicação são generosas
(milhares de chamadas por minuto); 429 quando estourar.

## A confirmar

- Se `buyer.email` volta em algum caso (hoje o cliente recebe um e-mail sintético
  `<buyer id>@comprador.mercadolivre.com.br`).
- Nome da categoria (`category_id` é um código `MLB…`; hoje entra como "Sem categoria").
- Reembolsos: `payments[].status = refunded` é o sinal usado.

## Fontes

- <https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao>
- <https://developers.mercadolivre.com.br/pt_br/gerenciamento-de-vendas>
- <https://developers.mercadolivre.com.br/pt_br/envios>

## No código

Implementado em `apps/api/src/modules/connectors/mercadoLivreProvider.ts` (P1, 2026-09-13):
OAuth com refresh rotacionado 10 min antes de expirar, `orders/search` por
`date_last_updated` em blocos de 90 dias e páginas de 50, envio anexado ao pedido antes de
guardar em `raw_record`; mapper puro `mercadoLivreOrders.ts`. Testado contra
`mercadolivre_stub.mjs` (:4016).
