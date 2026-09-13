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

## Limites

Cota por propriedade (tokens por dia/hora); `runReport` até 100 000 linhas; dados de hoje
mudam por até 48 h — re-sincronizar os últimos 3 dias a cada rodada.

## A confirmar

- Quais eventos do funil a loja realmente dispara (nomes customizados são comuns).

## Fontes

- <https://developers.google.com/analytics/devguides/reporting/data/v1/basics>
- <https://developers.google.com/analytics/devguides/config/admin/v1>
