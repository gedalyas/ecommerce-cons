# Google Analytics 4 — Data API

Categoria: analytics. Alimenta `traffic_daily` (sessões, usuários, eventos do funil por
origem/mídia) e a atribuição "Vendas por GA4".

## Registro

- Mesmo projeto Google Cloud do Google Ads; ativar **Google Analytics Data API** e
  **Admin API** (para listar propriedades).
- Escopo `https://www.googleapis.com/auth/analytics.readonly` (sensível → verificação da
  tela de consentimento, um processo só para Ads + GA4).

## Autenticação

OAuth Google igual ao Google Ads (mesmo client, escopos somados). Na tela de conexão listar
as propriedades: `GET https://analyticsadmin.googleapis.com/v1beta/accountSummaries` e
guardar o `property_id` escolhido.

## Dados que usamos

`POST https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runReport`

```json
{
  "dateRanges": [{ "startDate": "2026-08-01", "endDate": "2026-08-31" }],
  "dimensions": [{ "name": "date" }, { "name": "sessionSource" }, { "name": "sessionMedium" }],
  "metrics": [{ "name": "sessions" }, { "name": "totalUsers" }, { "name": "newUsers" }],
  "limit": 100000
}
```

Para os eventos do funil por dia/origem, um segundo `runReport` com a dimensão `eventName`
e a métrica `eventCount`, filtrado em `view_item`, `add_to_cart`, `begin_checkout`,
`purchase`, pivotado para as colunas de `traffic_daily`. Receita por origem (atribuição
GA4): `purchaseRevenue` e `transactions` por `sessionSourceMedium` / `sessionCampaignName`.

Relatórios de profundidade (um `runReport` cada, por bloco de 31 dias):

| Relatório | Dimensões                                  | Métricas                                                                                                                   | Vira                                                                                                                               |
| --------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Sessões   | `date`, `sessionSource`, `sessionMedium`   | `sessions`, `totalUsers`, `newUsers`, `engagedSessions`, `screenPageViews`, `userEngagementDuration`, `ecommercePurchases` | `traffic_daily`                                                                                                                    |
| Páginas   | `date`, `pagePath`                         | `screenPageViews`, `sessions`, `engagedSessions`, `userEngagementDuration`                                                 | `traffic_page_daily` (caminho sem query string)                                                                                    |
| Itens     | `date`, `itemId`, `itemName`               | `itemsViewed`, `itemsAddedToCart`, `itemsPurchased`                                                                        | `traffic_item_daily` — o `itemId` deve ser o **SKU** (é por ele que a tabela de produtos casa com o ERP); "(not set)" é descartado |
| Público   | `date`, `userGender` / `userAgeBracket`    | `sessions`, `engagedSessions`, `totalUsers`, `ecommercePurchases`                                                          | `traffic_audience_daily`                                                                                                           |
| Regiões   | `date`, `region` (filtro `countryId = BR`) | `sessions`, `screenPageViews`, `engagedSessions`, `ecommercePurchases`                                                     | `traffic_region_daily` com a UF ("State of Sao Paulo" → SP, "Federal District" → DF)                                               |

A propriedade escolhida só sincroniza se ainda estiver entre as que o token enxerga.

## Limites

Cota por propriedade (tokens por dia/hora); `runReport` até 100 000 linhas; dados de hoje
mudam por até 48 h — re-sincronizar os últimos 3 dias a cada rodada.

## A confirmar

- Quais eventos do funil a loja realmente dispara (nomes customizados são comuns).

## Fontes

- <https://developers.google.com/analytics/devguides/reporting/data/v1/basics>
- <https://developers.google.com/analytics/devguides/config/admin/v1>

## No código

Implementado em `ga4Provider.ts` (K4): propriedades de `accountSummaries`, dois `runReport` por bloco (sessões e eventos do funil) pivotados em `traffic_daily`.
