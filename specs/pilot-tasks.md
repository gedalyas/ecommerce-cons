# Pilot tasks

Board for `pilot-plan.md`. Tick as work lands; one commit per task, checks green before each.

Status: **P0–P3, C1–C5 done (2026-09-13), M1–M3 done (2026-09-19), M5 done (2026-09-20)**.
**On hold since 2026-09-20: deploy and P4 (real connections) wait for the company's own
domain, so the platform apps are registered once with the final callback URL; meanwhile the
work continues on improvements inside the product.** Davi's side is tracked in the Trello card
"MVP para o cliente parceiro testar".

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

- [x] Catalog: `amazon` (marketplace), docs sheet `docs/apis/amazon.md`, env
      `AMAZON_APP_ID/LWA_CLIENT_ID/LWA_CLIENT_SECRET/CONSENT_URL/TOKEN_URL/API_URL/MARKETPLACE_ID`,
      `AMAZON_APP_DRAFT` (adds `version=beta`), `AMAZON_ORDERS_INTERVAL_MS` /
      `AMAZON_ITEMS_INTERVAL_MS`; the callback schema also accepts `spapi_oauth_code`
- [x] `amazonProvider`: consent URL, code exchange keeping `selling_partner_id` as the
      external id, refresh 10 min before expiry (refresh token does not rotate), `getOrders`
      by `LastUpdatedAfter` (before = now − 2 min) with `NextToken`, `getOrderItems` per
      order, both paced (burst then interval); pure `amazonOrders` (status map, UF from the
      state name, line price ÷ quantity, synthetic buyer without the restricted data token) + test
- [x] Stub `amazon_stub.mjs` (:4017) + `e2e_amazon.mjs`: Conectar → consent → callback →
      READY "Vendedor A1SELLERBR" → 3 orders (PAID, PENDING, CANCELLED) → manual sync

## P3 — Instagram + Facebook organic

- [x] Schema: enum `SocialPlatform` (INSTAGRAM, FACEBOOK; parity test in marketing),
      `social_daily` (client × platform × account × day) and `social_post` (client ×
      platform × external id); migration `20260913230000_social`; `writeSyncedSocial` in
      `imports/socialWriteService.ts` (upserts, no undo: connector-only),
      `SyncContext.writeSocial`, raw kind `social`
- [x] Catalog: `instagram` ("Instagram e Facebook", new `social` kind and feed), docs sheet
      `docs/apis/instagram.md`; the Meta env is shared with Meta Ads (`metaOf` registers both)
- [x] `metaGraph.ts` extracted from the Meta Ads provider (refactor commit) and
      `instagramProvider`: Facebook Login with the page + instagram scopes, long-lived token,
      Pages from `/me/accounts` as the account picker (auto-chosen when only one), page token
      for the calls, 30-day chunks with Instagram insights + media (insights embedded) and
      Facebook page insights + posts; pure `instagramRows` (followers walked back from today
      by the daily gains, engagement from the day's posts, captions trimmed) + test
- [x] Contracts `socialPlatforms` + label, `MarketingSocial` / `SocialAccountRow` /
      `SocialPostRow`, tab `social`; API `socialService` + pure `socialMetrics` (+ test) and
      `bucketOf` exported from `periodWindow`; web `MarketingSocial.tsx` (tiles, reach series,
      per-network table, top 10 posts) wired into the Marketing TabBar
- [x] Stub: organic routes added to `meta_stub.mjs` (:4013, same app as Meta Ads) +
      `e2e_instagram.mjs`: Conectar → callback → READY "Loja Exemplo · @lojaexemplo" → KPIs,
      series, accounts and top posts on `GET /marketing?aba=social` → the screen renders
      every block

## C — Connecting must be easy for the client

- [x] C1 Catalog `requirements` (pt-BR checklist per connector) + `domainHint`
      (placeholder + where to find it) shown in `ConnectDialog`; Shopify placeholder fixed
- [x] C2 Account choice in the flow: `needsAccount` on the summary, no backfill until chosen,
      `?escolher=true` opens the picker, "Escolher conta" as the row's primary action, settings
      save enqueues the backfill for a never-synced connection
- [x] C3 Callback reasons (`motivo`) with labels in contracts, `error` param from the
      platform handled as "cancelado", "Tentar de novo" in the banner
- [x] C4 Catalog grouped by kind in the guided order with a one-line hint per group
- [x] C5 "Reconectar" on ERROR rows (keeps the history: a re-authorised connection with a
      previous sync enqueues a sync, not a backfill) + e-mail to the store's users on the
      first ERROR (`connectionMail.ts`, tested; mailer injected into the connector deps and
      the worker)

## M — MVP scope: Marketing + Comercial, the rest "Em desenvolvimento"

Decision `decisions/2026-09-19-screens-released-per-store.md`; behaviour in `saas.md` ›
Released screens per store.

- [x] M1 Schema: enum `StoreScreen` + `Client.releasedScreens` (default `MARKETING, ORDERS`),
      parity test; `/me` and `/admin` carry the list (2026-09-19)
- [x] M2 API: `req.auth.release` from `resolveClient`, `createScreenGuards()` answering 403
      "Em desenvolvimento" on each screen's prefix; `PUT /admin/stores/:id/screens` for admin
      or the assigned consultant, audited as `STORE_SCREENS_RELEASED` (2026-09-19)
- [x] M3 Web: every tab visible to the client, the unreleased ones with a lock leading to
      `/em-desenvolvimento?tela=`; root guard redirects a locked path; assistant panel and
      FAB hidden when locked; staff sees everything with an eye-off mark; "Telas liberadas"
      column on `/admin` › Lojas (2026-09-19)
- [x] M4 Release Dinheiro / Logística / Gestão per pilot store as each screen matures — the
      M4 round (`m4-plan.md`) made every screen but the Assistente usable and new stores open
      them by default; pilot stores created before get them from staff in /admin (2026-10-02)
- [x] M5 No mock reaches the pilot client: the hardcoded `CreativePresence` block (fake
      Instagram feed, creatives, landing pages, "consistência 68%") and its `extra` plumbing
      removed; the "Presença e criativos" pillar reads Seguidores / Alcance / Taxa de
      engajamento live from `social_daily` (`marketingLiveKpis` + test) instead of manual
      values; CSV template examples no longer name "Aurora". The assistant's canned
      conversation stays (screen locked in the MVP) (2026-09-20)

## R — Every screen usable on a phone

Davi (2026-09-20): the pilot's users will use the product mostly on mobile, so every screen
must be responsive — desktop stays the reference, `max-sm:` / `max-md:` classes adapt it.
Audit tool: `mobile_audit.mjs` in the scratchpad (Playwright, 390 × 844, full-page shots
of every screen and tab + horizontal-overflow report).

- [x] R1 Tables: `DataTable` renders cards below `md` (title = first column, lead = first
      numeric column, the rest as label/value pairs; `mobile: "title" | "lead" | "hidden"`
      per column overrides it), a "Ordenar por" select + direction button replaces the
      header sort, the CSV export is icon-only on phones; `mobileLayout="scroll"` keeps
      the grid with a pinned, capped first column (the DRE); pure `dataTableRules` +
      test. Also: TabBar fades the edge that hides tabs (`useScrollFadeX`,
      `scroll-fade-*`), `SegmentedControl` wraps on phones (the RFM treemap toggle now
      uses it instead of a copy), pillar headers keep their actions top-right, tile
      labels take two lines instead of truncating, an odd last tile spans the row, RFM
      range filters stack, the goals plan actions fill the width, 404 in Portuguese
      (2026-09-20)
- [x] R2 Navigation on phones: the bottom bar shows Dashboard · Marketing · Pedidos ·
      Dinheiro · Mais, and "Mais" opens a bottom `Sheet` (new primitive) with every
      screen the sidebar has — store switcher, Áreas, Dados, Infraestrutura, Sair — with
      the same lock / eye-off marks; the three nav lists live once in
      `shared/layout/navigation.ts`. The period popover keeps 16px from the edges, caps
      its height with a pinned footer, wraps the quick periods as chips and stacks the
      three selects. Dialogs and forms (`PillarEditor`, `MilestoneEditor`,
      `ConnectDialog`, `CostForm`, `InfluencerForm`, `DashboardCustomizer`) were
      checked open at 390px and already fit (2026-09-20)
- [x] R3 Cards pick the right lead: `mobile: "lead"` on Total vendido / Receita / Total
      pago / Valor / Alcance where the first numeric column was an investment or a
      class; the order's e-mail is hidden on cards; unlabelled action columns (edit,
      delete) render as the card's footer instead of a blank label. Charts checked at
      358px: time series, combo, donut, treemap and the Brazil tile map already fit
      (2026-09-20)
- [x] R4 Assistant and admin on phones: the assistant is a flex child under the session
      banner, so the composer no longer slides behind the bottom bar (the banner also
      cut it on desktop for staff); the "Telas liberadas" picker fills its card on
      phones (2026-09-20)

- [x] R5 KPIs as cards on phones (Davi: the divided grid "não segue o padrão de mercado",
      and the web should already look like the React Native model): `MetricTileGroup`
      renders `MetricCard`s below `sm` — 2-column grid of rounded cards, label above the
      value, delta as a soft chip (`destructive-soft` token added), muted background when
      nested in a pillar or section card; desktop keeps the tile group (2026-09-20)

## P4 — First real connections (needs Davi's apps)

- [ ] Shopify, Bling, Google Ads + GA4, Meta Ads, Instagram, Mercado Livre, Amazon: connect
      with the partner, fix stub ↔ real drift, note it in the platform's sheet
