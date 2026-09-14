# Instagram e Facebook (orgânico) — Graph API

Categoria: redes sociais. Alimenta `social_daily` (seguidores, alcance, engajamento e
publicações por dia e por conta) e `social_post` (cada publicação com curtidas, comentários,
salvamentos, compartilhamentos e alcance). Aparece na aba **Social** de Marketing.

## Registro

- **Mesmo app Meta do Meta Ads** (`docs/apis/meta-ads.md`), com o produto Facebook Login e as
  permissões adicionais no App Review: `pages_show_list`, `pages_read_engagement`,
  `read_insights`, `instagram_basic`, `instagram_manage_insights`. Pedir tudo junto com
  `ads_read` para passar por uma revisão só.
- Pré-requisitos do lado do cliente: a conta do Instagram precisa ser **profissional**
  (Business ou Creator) e estar **vinculada a uma Página do Facebook**; quem conecta precisa
  ser admin da Página.
- Callback: `https://<api>/api/v1/connectors/instagram/callback`.

## Autenticação

Facebook Login → código → token curto → token de longa duração (60 dias, renovado pelo
provider quando faltam 7 dias), igual ao Meta Ads. As chamadas de Página e Instagram usam o
**token da Página** (`access_token` de `GET /me/accounts`), não o do usuário.

## Dados que usamos

- `GET /me/accounts?fields=id,name,access_token,instagram_business_account{id,username}` —
  lista as Páginas; a escolhida vai em `Connection.settings.accountId` ("Configurar").
- Instagram (`<ig id>`):
  - `GET /<ig>?fields=followers_count` — seguidores hoje.
  - `GET /<ig>/insights?metric=reach,follower_count&period=day&since&until` — alcance e
    seguidores ganhos por dia (janela máx. 30 dias; `follower_count` só nos últimos 30 dias).
  - `GET /<ig>/media?fields=id,caption,media_type,media_product_type,timestamp,permalink,like_count,comments_count,insights.metric(reach,saved,shares)&since&until`
    — publicações com as métricas embutidas.
- Facebook (`<page id>`):
  - `GET /<page>/insights?metric=page_impressions_unique,page_post_engagements,page_fans&period=day`
  - `GET /<page>/posts?fields=id,message,created_time,permalink_url,shares,likes.summary(true),comments.summary(true),insights.metric(post_impressions_unique)`

Derivações: seguidores do Instagram por dia = contagem de hoje menos os ganhos posteriores ao
dia (dentro da janela sincronizada); engajamento diário do Instagram = soma de curtidas,
comentários, salvamentos e compartilhamentos das publicações do dia; do Facebook =
`page_post_engagements`.

## Limites

Rate limit por app e por usuário (200 chamadas × usuários/hora); insights por publicação
contam uma chamada cada quando não vêm embutidas. O provider varre blocos de 30 dias com 5
chamadas por bloco mais a paginação de mídia.

## A confirmar

- Nomes das métricas na versão do Graph em uso (`v21.0`): `shares` em mídia só existe para
  Reels/feed recentes; `page_fans` está em depreciação em favor de `page_follows`.
- Histórico de seguidores além de 30 dias (a API não dá; o valor é reconstruído).
- Stories e contas sem Página vinculada (fora do escopo).

## Fontes

- <https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/insights>
- <https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media/insights>
- <https://developers.facebook.com/docs/graph-api/reference/page/insights>
- <https://developers.facebook.com/docs/facebook-login/guides/access-tokens#pagetokens>

## No código

Implementado em `apps/api/src/modules/connectors/instagramProvider.ts` (P3, 2026-09-13) sobre
`metaGraph.ts` (compartilhado com Meta Ads): Páginas como seletor de conta, token da Página,
blocos de 30 dias com insights + mídia do Instagram e insights + posts da Página; mapper puro
`instagramRows.ts`; escrita em `imports/socialWriteService.ts`; leitura em
`marketing/socialService.ts` + `socialMetrics.ts`; tela `MarketingSocial.tsx`. Testado
contra as rotas orgânicas de `meta_stub.mjs` (:4013).
