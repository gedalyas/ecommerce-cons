# Shopify

Categoria: e-commerce. Alimenta pedidos, produtos, clientes.

## Registro

- Desde **jan/2026** não se cria "custom app" pelo admin da loja; todo app nasce no **Dev
  Dashboard** (ou Partner Dashboard) e é instalado por OAuth.
- Distribuição: **custom** (instalação em lojas nomeadas por link, sem listagem) ou
  **pública** (App Store, exige revisão). Começar com custom.
- Escopos: `read_orders` (só últimos **60 dias**), `read_all_orders` (histórico — precisa
  de **aprovação**, ~7 dias úteis), `read_products`, `read_customers`.

## Autenticação (OAuth, token offline)

1. `https://{shop}.myshopify.com/admin/oauth/authorize?client_id=…&scope=…&redirect_uri=…&state=…`
   (padrão "domínio + OAuth": pedimos o `{shop}`).
2. Callback com `code`, `hmac`, `shop` — validar o HMAC com o client secret.
3. `POST https://{shop}.myshopify.com/admin/oauth/access_token` com `client_id`,
   `client_secret`, `code` → `access_token` **offline (não expira)**, `scope`.

Chamadas: `X-Shopify-Access-Token: {token}`, versão da API na URL (`/admin/api/2026-07/`).

## Dados que usamos

Preferir **GraphQL Admin API** (a REST está em desativação para apps novos).

| Recurso  | Query                            | Campos                                                                                                                                                                                                                                                                                                                                                                            | Incremental         |
| -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Pedidos  | `orders(query: "updated_at:>…")` | `name`, `createdAt`, `processedAt`, `displayFinancialStatus`, `totalPriceSet`, `subtotalPriceSet`, `totalDiscountsSet`, `totalShippingPriceSet`, `customer{email, displayName}`, `shippingAddress{city, provinceCode}`, `lineItems{sku, title, quantity, originalUnitPriceSet, variant{id, product{id}}}`, `discountCodes`, `paymentGatewayNames`, `customerJourneySummary` (UTM) | cursor (`pageInfo`) |
| Produtos | `products`                       | `title`, `productType`, `variants{sku, price, inventoryItem.unitCost, inventoryQuantity}`                                                                                                                                                                                                                                                                                         | `updated_at`        |
| Clientes | `customers`                      | `email`, `displayName`, `numberOfOrders`, `amountSpent`                                                                                                                                                                                                                                                                                                                           | `updated_at`        |

## Limites

GraphQL: custo por pontos (bucket de 1 000, recarga 50/s por loja). Bulk operations para o
backfill grande.

## Webhooks

`orders/create`, `orders/updated`, `orders/paid` via `webhookSubscriptionCreate`; HMAC em
`X-Shopify-Hmac-Sha256`. Obrigatórios para apps: `customers/data_request`,
`customers/redact`, `shop/redact` (LGPD/GDPR).

## A confirmar

- Se a distribuição custom cobre o número de lojas que a consultoria atende.
- Versão da API a fixar e a data de sunset da REST.

## Fontes

- <https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/generate-app-access-tokens-admin>
- <https://ezapps.io/blogs/shopify-oauth-access-tokens-guide>
- <https://shopify.dev/docs/api/admin-graphql>
