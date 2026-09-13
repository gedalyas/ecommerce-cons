# Nuvemshop (Tiendanube)

Categoria: e-commerce (loja virtual). Alimenta pedidos, produtos, clientes.

## Registro

- Conta de **parceiro** em <https://partners.nuvemshop.com.br> → "Apps" → criar app: nome,
  URL de redirecionamento, escopos (`read_orders`, `read_products`, `read_customers`).
- O app recebe `app_id` (client id) e `client_secret`.
- Para uso só com clientes da consultoria não é preciso publicar na loja de apps.

## Autenticação (OAuth 2.0, authorization code)

1. O lojista abre `https://www.nuvemshop.com.br/apps/{app_id}/authorize?state={csrf}` (o
   padrão "domínio + OAuth" da Prax: o domínio da loja serve para mostrar ao usuário; o
   fluxo em si é pelo `app_id`).
2. Redireciona para a nossa URL com `?code=…&state=…` — o `code` vale **5 minutos**.
3. `POST https://www.nuvemshop.com.br/apps/authorize/token` com JSON
   `{ client_id, client_secret, grant_type: "authorization_code", code }`.
4. Resposta `{ access_token, token_type: "bearer", scope, user_id }` — `user_id` **é o id da
   loja** (`store_id`) usado em todas as URLs.
5. O access token **não expira**; só é invalidado ao gerar outro ou quando o lojista
   desinstala o app. Guardar cifrado; não há refresh.

Cabeçalhos em toda chamada: `Authentication: bearer {access_token}` (a Nuvemshop usa o
cabeçalho `Authentication`, não `Authorization` — confirmar) e `User-Agent: E-commerce
Insights (contato@…)` (obrigatório).

## Dados que usamos

Base: `https://api.nuvemshop.com.br/v1/{store_id}`.

| Recurso  | Endpoint         | Campos que mapeamos                                                                                                                                                                                                                                                                                                               | Incremental                                                         |
| -------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Pedidos  | `GET /orders`    | `id`, `number`, `created_at`, `paid_at`, `payment_status`, `status`, `total`, `subtotal`, `discount`, `shipping_cost_customer`, `gateway`, `payment_details.method`, `customer{email,name}`, `shipping_address{city,province}`, `products[]{product_id, variant_id, sku, name, quantity, price}`, `coupon[]`, `landing_url` (UTM) | `updated_at_min` / `updated_at_max`, `page` + `per_page` (máx. 200) |
| Produtos | `GET /products`  | `id`, `name`, `categories`, `variants[]{id, sku, price, cost, stock}`                                                                                                                                                                                                                                                             | `updated_at_min`                                                    |
| Clientes | `GET /customers` | `id`, `name`, `email`, `total_spent`, `last_order_id`                                                                                                                                                                                                                                                                             | `updated_at_min`                                                    |

Mapeamento de `payment_status` → nosso `FinancialStatus`: `paid` → PAID, `pending` →
PENDING, `authorized` → AUTHORIZED, `voided` → CANCELLED, `refunded` → REFUNDED (confirmar
a lista completa).

## Limites

Rate limit por loja (bucket; cabeçalhos `x-rate-limit-*`) — confirmar valores; tratar 429
esperando `x-rate-limit-reset`.

## Webhooks

`POST /webhooks` com `event` (`order/created`, `order/paid`, `order/updated`,
`product/updated`…) e `url`. Assinatura HMAC no cabeçalho `x-linkedstore-hmac-sha256`
(confirmar). Úteis para pedidos em tempo real; o backfill continua por `GET /orders`.

## A confirmar

- Nome exato do cabeçalho de autenticação (`Authentication` vs `Authorization`).
- Valores do rate limit e o máximo de `per_page`.
- Lista completa de `payment_status` e `status`.

## Fontes

- <https://tiendanube.github.io/api-documentation/authentication>
- <https://dev.nuvemshop.com.br/en/docs/developer-tools/nuvemshop-api>
- <https://tiendanube.github.io/api-documentation/resources/order>

## No código

Implementado em `apps/api/src/modules/connectors/nuvemshopProvider.ts` (K2, 2026-09-13): OAuth, backfill por `updated_at_min` em páginas de 200, sync incremental com sobreposição de 1 dia. Cabeçalho enviado: `Authentication` **e** `Authorization` (os dois, até confirmar qual a API aceita).
