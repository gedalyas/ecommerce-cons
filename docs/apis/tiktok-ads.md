# TikTok Ads — Marketing API

Categoria: mídia paga. Alimenta `ad_spend_daily`.

## Registro

- App em <https://business-api.tiktok.com> (TikTok for Business Developers), com revisão
  do app e escopos de relatório (Ads Management read / Reporting).

## Autenticação (OAuth)

1. `https://business-api.tiktok.com/portal/auth?app_id=…&state=…&redirect_uri=…`
2. Callback com `auth_code` → `POST /open_api/v1.3/oauth2/access_token/` (`app_id`,
   `secret`, `auth_code`) → `access_token` (longa duração; confirmar validade) +
   `advertiser_ids`.

## Dados que usamos

`GET /open_api/v1.3/report/integrated/get/` com `report_type=BASIC`,
`data_level=AUCTION_AD`, `dimensions=["ad_id","stat_time_day"]`,
`metrics=["spend","impressions","clicks","conversion","complete_payment_roas"…]`,
`start_date`/`end_date`, paginação `page`/`page_size`.

## A confirmar

- Validade/renovação do token; escopos mínimos para leitura; nomes de campanha/grupo nas
  dimensões (`campaign_name`, `adgroup_name`).

## Fontes

- <https://business-api.tiktok.com/portal/docs>
