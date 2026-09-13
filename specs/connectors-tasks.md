# Connectors — task board

Checklist companion to `connectors-plan.md`. Tick tasks as they land (`[x]`), add a short
note when something changed along the way. Keep this file and the plan in sync.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped

Status: **K0–K4 done, K5 (Meta) next** — last updated 2026-09-13

---

## K0 — Plan

- [x] `specs/connectors-plan.md` approved (framework in-house, pg-boss, Nuvemshop → Bling →
      Google → Meta → Shopify → TikTok), this board,
      `decisions/2026-09-13-connector-framework.md`
- [ ] Accounts to open (Davi): Nuvemshop partner app, Bling integrator app, Meta app +
      Business Verification, Google Cloud project (consent, Ads API, GA4 Data API), Shopify
      Dev Dashboard app, HTTPS domain for the API

## K1 — Framework

- [x] Schema: `Connection` (`clientId` × `connectorKey` unique, `authPattern`, `externalId`,
      `externalLabel`, `credentials` sealed, `stage` AUTHORIZED|IMPORTING|PROCESSING|READY|ERROR,
      `syncCursor`, `lastSyncAt`, `lastError`); `DataSource.status` driven by it
- [x] Vault: `shared/crypto/vault.ts` (AES-256-GCM, `CREDENTIALS_KEY`), tested
- [x] Jobs: pg-boss on the same Postgres (`shared/jobs`), `apps/api/src/worker.ts` (second
      entry, `npm run dev:worker`, bundled to `dist/worker.mjs`), queues `connector.backfill`,
      `connector.sync`, `connector.refresh`; schedule `connector.sync` hourly per connection
- [x] Contracts `connectors/`: `authPatterns`, `connectionStages` + labels, `StoreConnector`
      gains `connection` (stage, label, lastSyncAt, lastError) and `authPattern`;
      the catalog keeps `request`; the API flips `availability` to `oauth` for every
      connector whose provider is registered (env credentials present), so the web needs no
      per-environment knowledge
- [x] API `modules/connectors`: provider registry (`ConnectorProvider` interface:
      `authorizeUrl`, `exchangeCode`, `refresh?`, `backfill`, `sync`), signed OAuth `state`
      (JWT 10 min with clientId, userId, key), `POST /connectors/:key/authorize` → `{ url }`,
      public `GET /connectors/:key/callback`, `POST /connectors/:key/credentials`,
      `DELETE /connectors/:key`, `POST /connectors/:key/sync`, `GET /data-readiness`;
      audit events CONNECTION_AUTHORIZED / CONNECTION_REMOVED / CONNECTION_SYNCED /
      CONNECTION_FAILED
- [x] Web: Conexões — "Conectar" for live connectors (dialog with the store domain when the
      pattern is domain + OAuth, then redirect), stepper per connection (4 stages, error on
      the import step), "Sincronizar" / "Desconectar", feedback banner after the callback
      (`?conectado=` / `?erro=`); shell banner "Conecte uma fonte de dados da loja" until a
      source is connected, imported or orders exist (`GET /data-readiness`)
- [x] Raw layer + mappers: `raw_record` (connection, kind, externalId, payload, fetchedAt)
      and the bridge from provider rows to `OrderInput` / `AdSpendRow` / `TrafficRow`
      through the import write service (undo recorder unused for syncs)
- [x] Notes: `RawRecord` unique on (connection, kind, externalId); `connections` no longer
      imports `connectors` — `connectionsOf` is injected from `app.ts` (a five-module cycle
      showed up); `worker.ts` is the second esbuild entry; the root `npm run dev` now starts
      api + worker + web; `CREDENTIALS_KEY` and `API_PUBLIC_URL` added to the env

## K2 — Nuvemshop

- [x] Provider (`nuvemshopProvider.ts`, pure `nuvemshopOrders.ts` tested): authorize URL,
      token exchange (`user_id` = store id), backfill of the last `CONNECTOR_BACKFILL_MONTHS`
      by `updated_at_min` in pages of 200 → raw rows + `OrderInput` (payment status →
      `FinancialStatus`, province name → UF, UTMs from `landing_url`, coupons, PIX/boleto/card);
      incremental sync from the cursor with a one-day overlap; registered only when
      `NUVEMSHOP_APP_ID` + `NUVEMSHOP_CLIENT_SECRET` are set (`NUVEMSHOP_AUTH_URL` /
      `NUVEMSHOP_API_URL` point the dev env at a stub)
- [-] Webhook `order/paid` — the hourly sync covers it for now
- [x] Flow (`e2e_nuvemshop.mjs` + `nuvemshop_stub.mjs` on :4010): Conectar → domain → stub
      authorize → callback → "Nuvemshop conectado" + stepper → worker backfills 7 orders →
      stage Pronto, source Conectado, activity entries → orders on /pedidos → manual sync
      hits the API with the cursor → Desconectar
- [x] Fix on the way: imported orders are stored at noon UTC so the day does not shift in
      Brazilian time zones (they were midnight UTC → shown as the previous day)

## K3 — Bling

- [x] Provider (`blingProvider.ts`, pure `blingOrders.ts` tested): OAuth with the Basic
      token endpoint, `refresh` when the access token is within 10 minutes of expiry
      (refresh token rotated and re-sealed), order list by `dataAlteracaoInicial/Final` in
      pages of 100 + detail per order, contacts fetched once and cached in `raw_record`
      (`readRaw`), channel names from `/canais-venda`, min interval between calls
      (`BLING_MIN_INTERVAL_MS`); registered when `BLING_CLIENT_ID` + `BLING_CLIENT_SECRET`
      are set (`BLING_AUTH_URL` / `BLING_API_URL` point dev at a stub)
- [x] Status mapping: `Connection.settings.statusMap`, `GET/PUT /connectors/:key/settings`
      (statuses read live from `/situacoes/modulos/{vendas}`, defaults guessed from the
      names — `guessStatusTarget`), "Situações" dialog on Conexões for ERP connectors;
      saving enqueues a sync with `reprocess: true` that re-maps every stored raw order
      before pulling (an unchanged order never comes back from the API)
- [x] Flow (`e2e_bling.mjs` + `bling_stub.mjs` on :4011): Conectar (no domain) → stub
      authorize → callback → backfill of 5 orders with Bling / Mercado Livre channels and
      mapped statuses → Situações dialog shows the 4 statuses with guesses → "Em aberto" →
      Pago → saved → the pending order becomes PAID from the raw layer

## K4 — Google (Ads + GA4)

- [x] `googleAuth.ts`: one OAuth client for both connectors (offline access, consent
      prompt, refresh 5 minutes before expiry, refresh token kept across refreshes);
      `googleAdsProvider` (accessible customers as the account picker, `searchStream` GAQL
      in 31-day chunks, `developer-token` / `login-customer-id` headers) with the pure
      `googleAdsRows` (micros → reais, campaign/ad group/ad hierarchy); `ga4Provider`
      (properties from `accountSummaries`, sessions + funnel `runReport`s in 31-day chunks)
      with the pure `ga4Rows` (funnel events pivoted onto the session rows). Both keep a
      3-day overlap on incremental syncs
- [x] Settings generalised: `ConnectorSettings` carries `accounts` + `accountId` besides the
      status map; the provider seeds `accountId` when only one account/property exists,
      otherwise the sync fails with "Escolha a conta…" until the user picks one in the
      "Configurar" dialog (Select "Conta ou propriedade")
- [x] Flow (`e2e_google.mjs` + `google_stub.mjs` on :4012): Google Ads with two accounts →
      clear error → pick the second → sync → campaign rows on /marketing; GA4 with one
      property → chosen automatically → traffic rows; readiness lists the three connectors

## K5 — Meta Ads

- [ ] Facebook Login, long-lived token + refresh, ad account picker, daily insights →
      `AdSpendRow`, region breakdown

## K6 — Shopify, TikTok

- [ ] Shopify custom-distribution app, GraphQL orders/products/customers; TikTok reports

## K7 — Docs and close

- [ ] `specs/connections.md`, `docs/apis/*` updated with what the code confirmed, CLAUDE.md
      (provider rule, worker), "Solicitar conexão" retired for live connectors
