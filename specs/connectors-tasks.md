# Connectors — task board

Checklist companion to `connectors-plan.md`. Tick tasks as they land (`[x]`), add a short
note when something changed along the way. Keep this file and the plan in sync.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped

Status: **K0 done, K1 next** — last updated 2026-09-13

---

## K0 — Plan

- [x] `specs/connectors-plan.md` approved (framework in-house, pg-boss, Nuvemshop → Bling →
      Google → Meta → Shopify → TikTok), this board,
      `decisions/2026-09-13-connector-framework.md`
- [ ] Accounts to open (Davi): Nuvemshop partner app, Bling integrator app, Meta app +
      Business Verification, Google Cloud project (consent, Ads API, GA4 Data API), Shopify
      Dev Dashboard app, HTTPS domain for the API

## K1 — Framework

- [ ] Schema: `Connection` (`clientId` × `connectorKey` unique, `authPattern`, `externalId`,
      `externalLabel`, `credentials` sealed, `stage` AUTHORIZED|IMPORTING|PROCESSING|READY|ERROR,
      `syncCursor`, `lastSyncAt`, `lastError`); `DataSource.status` driven by it
- [ ] Vault: `shared/crypto/vault.ts` (AES-256-GCM, `CREDENTIALS_KEY`), tested
- [ ] Jobs: pg-boss on the same Postgres (`shared/jobs`), `apps/api/src/worker.ts` (second
      entry, `npm run dev:worker`, bundled to `dist/worker.mjs`), queues `connector.backfill`,
      `connector.sync`, `connector.refresh`; schedule `connector.sync` hourly per connection
- [ ] Contracts `connectors/`: `authPatterns`, `connectionStages` + labels, `StoreConnector`
      gains `connection` (stage, label, lastSyncAt, lastError) and `authPattern`;
      `connectorCatalog` availability `oauth` for Nuvemshop (K2) and Bling (K3)
- [ ] API `modules/connectors`: provider registry (`ConnectorProvider` interface:
      `authorizeUrl`, `exchangeCode`, `refresh?`, `backfill`, `sync`), signed OAuth `state`
      (JWT 10 min with clientId, userId, key), `POST /connectors/:key/authorize` → `{ url }`,
      public `GET /connectors/:key/callback`, `POST /connectors/:key/credentials`,
      `DELETE /connectors/:key`, `POST /connectors/:key/sync`, `GET /data-readiness`;
      audit events CONNECTION_AUTHORIZED / CONNECTION_REMOVED / CONNECTION_SYNCED /
      CONNECTION_FAILED
- [ ] Web: Conexões — "Conectar" for live connectors (redirect), stepper per connection
      (4 stages), "Sincronizar agora", "Desconectar"; shell banner "Conecte uma fonte de
      dados da loja" until a source is connected or imported
- [ ] Raw layer + mappers: `raw_record` (connection, kind, externalId, payload, fetchedAt)
      and the bridge from provider rows to `OrderInput` / `AdSpendRow` / `TrafficRow`
      through the import write service (undo recorder unused for syncs)

## K2 — Nuvemshop

- [ ] Provider: authorize URL, token exchange, `user_id` as store id; backfill orders
      (`updated_at_min`, pages of 200) → `OrderInput`; products and customers; incremental
      sync by cursor; status mapping `payment_status` → `FinancialStatus`
- [ ] Webhook `order/paid` (HMAC) as a fast path (optional)
- [ ] Flow with a local Nuvemshop stub (auth + API): connect → stepper → orders on /pedidos

## K3 — Bling

- [ ] Provider: OAuth with Basic token endpoint, refresh job, orders + detail, products,
      contacts cache; status mapping screen (situações → Pago / Pendente / Cancelado)

## K4 — Google (Ads + GA4)

- [ ] One Google OAuth provider with both scopes; account/property pickers; Ads daily
      insights → `AdSpendRow`; GA4 sessions/funnel → `TrafficRow`

## K5 — Meta Ads

- [ ] Facebook Login, long-lived token + refresh, ad account picker, daily insights →
      `AdSpendRow`, region breakdown

## K6 — Shopify, TikTok

- [ ] Shopify custom-distribution app, GraphQL orders/products/customers; TikTok reports

## K7 — Docs and close

- [ ] `specs/connections.md`, `docs/apis/*` updated with what the code confirmed, CLAUDE.md
      (provider rule, worker), "Solicitar conexão" retired for live connectors
