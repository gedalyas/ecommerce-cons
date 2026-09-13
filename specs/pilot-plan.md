# Pilot plan — the MVP a partner client can test

Status: **approved 2026-09-13, in execution** — board in `pilot-tasks.md`; tracked for Davi in
the Trello card "MVP para o cliente parceiro testar" (board System-ecommerce-consulting).

## Goal

Put the product in front of one partner client — a store running **Shopify + Bling** with
Google Ads, GA4 and Meta Ads — with these sources working end to end: Shopify, Bling, Google
Ads (+ GA4), Meta Ads, **Instagram/Facebook organic**, **Mercado Livre** and **Amazon**. The
first five exist (`connectors-plan.md`, K0–K7, verified against stubs); the last three are
built in this round. The product is deployed on a provider's own URLs — no domain is bought
until the company has a name — and every platform app registers
`https://<api url>/api/v1/connectors/<key>/callback`; when a domain arrives only the URLs in
the apps and in the environment change.

Out of scope for the pilot: Nuvemshop, TikTok (both exist, no app yet), YouTube, and the
commercial round (`commercial-plan.md`, paused at B2 pending the CRM decision).

## Split of work

| Who    | What                                                                                                                                                           |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude | P0 deploy config + guide; P1 Mercado Livre; P2 Amazon; P3 Instagram/Facebook organic; P4 first real connections with the partner, fixing stub ↔ real API drift |
| Davi   | Provider account and deploy (URLs, env, SMTP); one app per platform (Shopify, Bling, Google, Meta with the Instagram permissions, Mercado Livre, Amazon)       |

## Stages

### P0 — Deploy on a provider's URLs

Containers for the three processes (`api`, `worker`, `web`) from one Dockerfile with a
target per process, `prisma migrate deploy` + `db:seed` as the release step of the API,
`/api/v1/health` as the health check, the env contract of `.env.example` mapped to the
provider's variables. Railway is the recommended provider (api + worker + web + Postgres in
one project, `*.up.railway.app` URLs); the Dockerfile is provider-neutral so Render or Fly
work with the same image. Guide in `docs/deploy.md`: create the project, add Postgres, three
services from the repo, variables, first admin, invite the partner.

Production differences already in the code: `SMTP_URL` is required (no file outbox),
`APP_URL` / `API_PUBLIC_URL` are the provider URLs, `CREDENTIALS_KEY` must be set once and
never rotated without re-connecting every source.

### P1 — Mercado Livre (marketplace orders)

Catalog entry `mercado_livre` (kind `marketplace`, feed `orders`), `docs/apis/mercado-livre.md`,
`mercadoLivreProvider.ts` + pure `mercadoLivreOrders.ts`. OAuth authorization code with PKCE
optional (`https://auth.mercadolivre.com.br/authorization`), token 6 h with refresh token
(single use, rotated), `GET /users/me` for the seller id, `GET /orders/search?seller=…&
order.date_last_updated.from=…` paged by `offset`/`limit` 50 (search window max 1 year
per call → chunked backfill), order detail already in the search payload (items, payments,
shipping id, buyer), `GET /shipments/{id}` for the state when needed. Status map: `paid` →
paid, `cancelled` → canceled, `payment_required`/`payment_in_process` → pending,
refunds via `mediations`/`payments.status = refunded`. Channel = marketplace. Stub on
:4016, e2e.

### P2 — Amazon (Selling Partner API)

Catalog entry `amazon` (kind `marketplace`, feed `orders`), `docs/apis/amazon.md`,
`amazonProvider.ts` + pure `amazonOrders.ts`. Login with Amazon: authorization on the
Seller Central consent URL (`https://sellercentral.amazon.com.br/apps/authorize/consent?
application_id=…&state=…&version=beta` while the app is in draft), callback with
`spapi_oauth_code` + `selling_partner_id`, exchange on `https://api.amazon.com/auth/o2/token`
→ access token 1 h + refresh token (long-lived). Orders v0 on
`https://sellingpartnerapi-na.amazon.com` (BR marketplace `A2Q3Y263D00KWC` is in the NA
region): `GET /orders/v0/orders?MarketplaceIds=…&LastUpdatedAfter=…` with `NextToken`,
rate 0.0167 rps burst 20 → the provider paces itself; `GET /orders/v0/orders/{id}/orderItems`
per order (0.5 rps). Status map: `Shipped`/`Unshipped`/`PartiallyShipped` → paid,
`Pending` → pending, `Canceled` → canceled. PII (buyer name/address) needs the restricted
data token — the pilot reads no PII: customer key = anonymised buyer email hash or the
order id. Stub on :4017, e2e.

### P3 — Instagram + Facebook organic

Catalog entry `instagram` (kind `social`, feed `social`), `docs/apis/instagram.md`,
`instagramProvider.ts` + pure `instagramRows.ts`. Same Meta app as Meta Ads, Facebook Login
with `pages_show_list`, `pages_read_engagement`, `instagram_basic`,
`instagram_manage_insights`; long-lived user token; `GET /me/accounts` → pages (settings
picker) → `instagram_business_account`; daily account insights (`reach`, `follower_count`,
`profile_views`, `accounts_engaged` — metric names per the current Graph version) and media
list with `like_count`, `comments_count`, `insights(reach, saved, shares)`; Facebook page
insights (`page_impressions`, `page_post_engagements`, `page_fans`). Data lands in a new
`social_daily` table (clientId × platform × account × day: followers, reach, impressions,
engagement, profile views, posts) plus `social_post` (per media: type, published at,
permalink, likes, comments, saves, shares, reach). A first screen "Social" under Marketing
(tab) shows the KPIs and the top posts of the period; the catalog card says what it feeds.
Stub on :4018, e2e.

### P4 — First real connections

With the provider deployed and the partner's apps registered: connect each source with the
partner, compare the real payloads with the stubs (headers, paging, field names, status
values), fix the mappers, and record every difference in the platform's `docs/apis/` sheet.
One commit per platform.

## Order

P0 first (Davi can start the provider account in parallel), then P1 → P2 → P3 (each is a
provider + mapper + stub + e2e, like K2–K6), then P4 as the partner's apps become available.
