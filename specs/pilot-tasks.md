# Pilot tasks

Board for `pilot-plan.md`. Tick as work lands; one commit per task, checks green before each.

Status: **P0–P1 done, P2 next** (2026-09-13). Davi's side is tracked in the Trello card "MVP para o
cliente parceiro testar".

## P0 — Deploy on a provider's URLs

Decided: web on **Vercel**, API + worker + Postgres on **Railway** (2026-09-13).

- [x] `apps/api/Dockerfile` runs `prisma migrate deploy` → `dist/seed.mjs` (the admin
      upsert, bundled by `build.mjs` from `packages/database/prisma/seed.ts`) → the API;
      `prisma` became a runtime dependency of `packages/database` so the CLI exists in the
      `--omit=dev` image; the API listens on the provider's `PORT` when set (`API_PORT`
      otherwise)
- [x] `apps/api/railway.json` (Dockerfile, health check `/api/v1/health`, watch paths) and
      `apps/api/railway.worker.json` (same image, start `node apps/api/dist/worker.mjs`)
- [x] Web: nitro preset `vercel` when `VERCEL=1` (node-server otherwise);
      `apps/web/vercel.json` installs and builds from the repo root with Root Directory
      `apps/web`, output `.vercel/output`; `.vercel` gitignored
- [x] `docs/deploy.md`: Railway (Postgres, `api`, `worker`, variables), Vercel (root
      directory, env), first use, common errors, what changes when a domain arrives
- [x] Local check: API image boots in production mode against the dev Postgres (migrations,
      admin, health 200); worker boots from the same image; `VERCEL=1` build emits
      `.vercel/output` with the server function

## P1 — Mercado Livre

- [x] Catalog: `mercado_livre` (new `marketplace` kind, label "Marketplace"), docs sheet
      `docs/apis/mercado-livre.md`, env `MERCADO_LIVRE_APP_ID/CLIENT_SECRET/AUTH_URL/API_URL`
- [x] `mercadoLivreProvider`: authorize → code exchange (`user_id` + `/users/me` nickname as
      the label), refresh 10 min before expiry with the rotated pair, `orders/search` by
      `date_last_updated` in 90-day chunks and pages of 50, shipment fetched per order and
      stored inside the raw payload; pure `mercadoLivreOrders` (status map, refunded from
      payments, UF from `BR-XX`, synthetic buyer e-mail because the API sends none) + test
- [x] Stub `mercadolivre_stub.mjs` (:4016) + `e2e_mercadolivre.mjs`: Conectar → callback →
      READY "LOJA_PARCEIRA" → 3 orders on /pedidos (PAID, PAID, CANCELLED, source Mercado
      Livre) → manual sync 202 → READY
- [x] Fix from P0 found here: the dev `.env` has `PORT=8080` for the web, so `API_PORT`
      wins over `PORT` and `PORT` only applies when `API_PORT` is unset (Railway)

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
