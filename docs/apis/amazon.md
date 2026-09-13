# Amazon — Selling Partner API (SP-API)

Categoria: marketplace. Alimenta `order` (pedidos com `sales_platform = MARKETPLACE`, canal
"Amazon").

## Registro

- A consultoria precisa de um **perfil de desenvolvedor** no Seller Central
  (Apps e Serviços → Desenvolver aplicativos → registrar-se como desenvolvedor: formulário de
  uso de dados, revisão da Amazon — **dias a semanas**). Tipo: aplicativo público (para
  vendedores terceiros).
- Depois, **criar o app SP-API**: nome, papéis (**Selling Partner Insights** ou pelo menos o
  papel de pedidos), **Login with Amazon** (um "security profile" gera `client_id` e
  `client_secret`), **OAuth Redirect URI** (`https://<api>/api/v1/connectors/amazon/callback`),
  e o `application_id` (`amzn1.sp.solution.…`).
- Enquanto o app está em **rascunho** (não publicado), a URL de consentimento leva
  `version=beta` (`AMAZON_APP_DRAFT=true`) e só vendedores da mesma conta/testadores
  conseguem autorizar.
- Sem SigV4/IAM desde 2023: a chamada só precisa do token LWA.

## Autenticação (Login with Amazon, authorization code)

1. `https://sellercentral.amazon.com.br/apps/authorize/consent?application_id=…&state=…&redirect_uri=…[&version=beta]`
   (o vendedor entra no Seller Central dele e autoriza).
2. Callback com `spapi_oauth_code`, `selling_partner_id` e `state`.
3. `POST https://api.amazon.com/auth/o2/token` (`grant_type=authorization_code`, `code`,
   `redirect_uri`, `client_id`, `client_secret`) → `access_token` (**1 h**) + `refresh_token`
   (longa duração, não rotaciona).
4. Refresh: mesmo endpoint com `grant_type=refresh_token`.
5. Chamadas com o header `x-amz-access-token`.

## Dados que usamos

Região **NA** (`https://sellingpartnerapi-na.amazon.com`) — o marketplace Brasil
(`A2Q3Y263D00KWC`) fica nela.

- `GET /orders/v0/orders?MarketplaceIds=…&LastUpdatedAfter=…&LastUpdatedBefore=…&MaxResultsPerPage=100`
  → `Orders[]` (`AmazonOrderId`, `PurchaseDate`, `LastUpdateDate`, `OrderStatus`, `OrderTotal`,
  `PaymentMethodDetails`, `ShippingAddress` com **só cidade/UF/CEP/país** sem token restrito),
  `NextToken` para a próxima página. `LastUpdatedBefore` precisa ser ≥ 2 min no passado.
- `GET /orders/v0/orders/{id}/orderItems` → `OrderItems[]` (`ASIN`, `SellerSKU`, `Title`,
  `QuantityOrdered`, `ItemPrice` total da linha, `ShippingPrice`, `PromotionDiscount`).
- Dados pessoais do comprador (nome, e-mail, endereço completo) exigem **Restricted Data
  Token** e o papel de PII aprovado: o piloto não usa — cada pedido vira um cliente sintético
  (`<order id>@comprador.amazon.com.br`).

## Limites

`getOrders`: 0,0167 req/s (1 por minuto) com burst 20; `getOrderItems`: 0,5 req/s com burst 30. O provider gasta o burst e depois espaça as chamadas (`AMAZON_ORDERS_INTERVAL_MS`,
`AMAZON_ITEMS_INTERVAL_MS`) — um backfill de 18 meses com muitos pedidos leva horas, e é
normal. 429 → `QuotaExceeded`.

## Webhooks

Notifications API (`ORDER_CHANGE`) via SQS/EventBridge — não usada no piloto.

## A confirmar

- Se `PaymentMethodDetails` traz "Pix"/"Boleto" no Brasil (hoje o padrão é cartão).
- Nome de categoria (a API de pedidos não traz; hoje "Sem categoria").
- Se o papel de pedidos basta ou se a Amazon exige "Selling Partner Insights".

## Fontes

- <https://developer-docs.amazon.com/sp-api/docs/registering-your-application>
- <https://developer-docs.amazon.com/sp-api/docs/authorizing-selling-partner-api-applications>
- <https://developer-docs.amazon.com/sp-api/docs/orders-api-v0-reference>
- <https://developer-docs.amazon.com/sp-api/docs/sp-api-endpoints>

## No código

Implementado em `apps/api/src/modules/connectors/amazonProvider.ts` (P2, 2026-09-13): URL de
consentimento (com `version=beta` em rascunho), troca do `spapi_oauth_code` guardando o
`selling_partner_id`, refresh 10 min antes de expirar, `getOrders` por `LastUpdatedAfter`
com `NextToken` e `getOrderItems` por pedido, ambos com ritmo (burst + intervalo); mapper
puro `amazonOrders.ts` (status, UF por nome do estado, preço unitário = linha ÷ quantidade).
Testado contra `amazon_stub.mjs` (:4017).
