# Meta Ads (Facebook / Instagram) — Marketing API

Categoria: mídia paga. Alimenta `ad_spend_daily` (campanha → conjunto → anúncio) e, mais
tarde, insights orgânicos do Instagram/Facebook.

## Registro

- App em <https://developers.facebook.com> (tipo Business), produtos **Marketing API** e
  **Facebook Login for Business**.
- **Verificação do negócio** (Business Verification) da consultoria + **App Review** das
  permissões `ads_read` e `read_insights` (e `business_management` para listar contas de
  outros negócios). Sem revisão o app só acessa contas do próprio Business Manager (modo
  desenvolvimento) — serve para testar com a loja piloto.
- Regra 2026: o "Marketing API Access Tier" pede ≥ 500 chamadas em 15 dias com < 15% de
  erro para subir de tier; a revisão não exige mais gravação de tela.
- URLs de política de privacidade e termos publicadas no site.

## Autenticação (OAuth via Facebook Login)

1. `https://www.facebook.com/v21.0/dialog/oauth?client_id=…&redirect_uri=…&state=…&scope=ads_read,read_insights`
2. Callback com `code` → `GET https://graph.facebook.com/v21.0/oauth/access_token?client_id&redirect_uri&client_secret&code` → token de usuário **curto**.
3. Trocar por **long-lived** (60 dias): `GET /oauth/access_token?grant_type=fb_exchange_token&fb_exchange_token=…`.
4. Antes de expirar, renovar (o usuário precisa estar ativo) — ou usar **system user** do
   Business Manager da consultoria quando ela mesma gerencia as contas (token sem
   expiração).

## Dados que usamos

Base: `https://graph.facebook.com/v21.0`.

| Recurso             | Endpoint                                                                                                                                                                                      | Campos                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Contas de anúncio   | `GET /me/adaccounts?fields=id,name,currency,timezone_name`                                                                                                                                    | escolher a conta da loja na tela de conexão                                                          |
| Insights diários    | `GET /act_{id}/insights?level=ad&time_increment=1&fields=campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,clicks,actions,action_values&time_range={since,until}` | `spend`, `impressions`, `clicks`, `actions[purchase]`, `action_values[purchase]` (receita atribuída) |
| Insights por região | `…/insights?breakdowns=region`                                                                                                                                                                | `spend` por UF (`ad_spend_region_daily`)                                                             |

Janela de atribuição: definir `action_attribution_windows` (`7d_click`, `1d_view`) para
bater com o painel do cliente. Taxa de serviço (`platform_fee`) não vem da API — vem da
fatura, informada à parte.

## Limites

Rate limit por conta de anúncio e por app (cabeçalho `x-business-use-case-usage`); pedir
insights assíncronos (`POST /insights` → `report_run_id`) para períodos longos.

## A confirmar

- Se a consultoria opera como agência (system user, contas no próprio BM) ou se cada
  cliente autoriza a própria conta (App Review obrigatória).
- Versão da Graph API a fixar.

## Fontes

- <https://developers.meta.com/blog/updates-to-ads-management-standard-access-feature/>
- <https://developers.facebook.com/docs/marketing-api/insights>
- <https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived>
