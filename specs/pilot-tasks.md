# Pilot tasks

Board for `pilot-plan.md`. Tick as work lands; one commit per task, checks green before each.

Status: **P0 next** (2026-09-13). Davi's side is tracked in the Trello card "MVP para o
cliente parceiro testar".

## P0 — Deploy on a provider's URLs

- [ ] `Dockerfile` at the root with targets `api`, `worker`, `web` (node 22, workspaces
      install, `npm run build`, prisma generate; the API image runs
      `prisma migrate deploy` then `node apps/api/dist/index.mjs`)
- [ ] `.dockerignore`; provider config (`railway.json` per service) that any provider can
      ignore; `/api/v1/health` as the health check
- [ ] `docs/deploy.md`: Railway step by step (project, Postgres, three services, variables
      from `.env.example`, first admin via `db:seed`, invite the partner), what changes when a
      domain arrives, how to read logs
- [ ] Local check: the three images build and boot against the dev Postgres

## P1 — Mercado Livre

- [ ] Catalog: `mercado_livre` (`marketplace` kind + label "Marketplace"), docs sheet
      `docs/apis/mercado-livre.md`, env `MERCADO_LIVRE_APP_ID/CLIENT_SECRET/AUTH_URL/API_URL`
- [ ] `mercadoLivreProvider` (authorize, code exchange, refresh with rotation, seller id,
      `orders/search` chunked by `date_last_updated`) + pure `mercadoLivreOrders` with test
- [ ] Stub `mercadolivre_stub.mjs` (:4016) + `e2e_mercadolivre.mjs`: connect → backfill →
      orders on /pedidos with channel marketplace

## P2 — Amazon

- [ ] Catalog: `amazon`, docs sheet `docs/apis/amazon.md`, env
      `AMAZON_APP_ID/LWA_CLIENT_ID/LWA_CLIENT_SECRET/CONSENT_URL/TOKEN_URL/API_URL/MARKETPLACE_ID`
- [ ] `amazonProvider` (consent URL, `spapi_oauth_code` exchange, refresh, Orders v0 with
      `NextToken` and self-pacing, order items per order) + pure `amazonOrders` with test
- [ ] Stub `amazon_stub.mjs` (:4017) + `e2e_amazon.mjs`

## P3 — Instagram + Facebook organic

- [ ] Schema: `social_daily`, `social_post` (+ migration, enum parity if any), write service
      `writeSyncedSocial` in imports (undo not needed: connector-only)
- [ ] Catalog: `instagram` (`social` kind, `social` feed), docs sheet
      `docs/apis/instagram.md`; the Meta env is shared with Meta Ads
- [ ] `instagramProvider` (Facebook Login with the page/instagram scopes, long-lived token,
      pages as the settings picker, account insights + media insights + page insights in
      daily chunks) + pure `instagramRows` with test
- [ ] Web: "Social" tab on /marketing (followers, reach, engagement, top posts of the
      period), contracts `social` types + schema, API `GET /marketing?aba=social`
- [ ] Stub `instagram_stub.mjs` (:4018) + `e2e_instagram.mjs`

## P4 — First real connections (needs Davi's apps)

- [ ] Shopify, Bling, Google Ads + GA4, Meta Ads, Instagram, Mercado Livre, Amazon: connect
      with the partner, fix stub ↔ real drift, note it in the platform's sheet
