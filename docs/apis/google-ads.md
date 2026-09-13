# Google Ads API

Categoria: mídia paga. Alimenta `ad_spend_daily` por campanha/grupo/anúncio e por região.

## Registro

- **Projeto no Google Cloud** com a tela de consentimento OAuth (externa) e credenciais
  OAuth (client id/secret, redirect URI).
- O acesso à Google Ads API agora segue o **projeto Cloud** (developer tokens em
  desativação, set/2026): pedir **Basic access** pela página "Google Ads API" do projeto
  (verificação de marca + revisão automática) → 15 000 operações/dia; **Standard** depois
  (ilimitado).
- Uma conta **administrador (MCC)** da consultoria facilita: os clientes vinculam a conta
  deles ao MCC e um único login autoriza tudo (`login-customer-id`).

## Autenticação (OAuth Google)

1. `https://accounts.google.com/o/oauth2/v2/auth?client_id&redirect_uri&response_type=code&scope=https://www.googleapis.com/auth/adwords&access_type=offline&prompt=consent&state`
2. Callback `code` → `POST https://oauth2.googleapis.com/token` → `access_token` (1 h) +
   `refresh_token` (indefinido; some se o app estiver em "testing" por mais de 7 dias ou
   após 6 meses sem uso).
3. Chamadas com `Authorization: Bearer`, `developer-token` (enquanto existir) e
   `login-customer-id` (MCC).

## Dados que usamos

`POST https://googleads.googleapis.com/v19/customers/{customer_id}/googleAds:searchStream`
com GAQL:

```
SELECT segments.date, campaign.id, campaign.name, ad_group.id, ad_group.name,
       ad_group_ad.ad.id, ad_group_ad.ad.name, metrics.cost_micros, metrics.impressions,
       metrics.clicks, metrics.conversions, metrics.conversions_value
FROM ad_group_ad WHERE segments.date BETWEEN '2026-08-01' AND '2026-08-31'
```

Região: `FROM geographic_view` com `segments.geo_target_region`. `cost_micros / 1e6` =
gasto. Listar contas acessíveis: `customers:listAccessibleCustomers`.

## Limites

Basic: 15 000 operações/dia por projeto; `searchStream` conta 1 operação por request.

## A confirmar

- Cronograma exato do sunset do developer token e o que muda no cabeçalho.
- Se a consultoria terá MCC (recomendado).

## Fontes

- <https://developers.google.com/google-ads/api/docs/api-policy/access-levels>
- <https://ppc.land/google-drops-developer-tokens-from-ads-api-access-decisions/>
- <https://developers.google.com/google-ads/api/docs/query/overview>
