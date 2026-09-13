# 2026-09-13 — Connectors built in-house on a job runner in Postgres, not on an integration platform

## Contexto

The product must connect stores the way Prax does — a "Conectar" button per platform — for
Nuvemshop, Bling, Google Ads, GA4, Meta Ads, Shopify and TikTok (`specs/connectors-plan.md`,
`docs/apis/`). Embedded integration platforms (Nango), ELT tools (Airbyte, Fivetran) and
unified commerce APIs (Rutter) were evaluated.

## Decisão

1. A **connector framework in the API**: one `Connection` per store × connector, three auth
   patterns (OAuth, domain + OAuth, credentials), credentials sealed with AES-256-GCM under
   `CREDENTIALS_KEY`, a provider interface per platform (`authorizeUrl`, `exchangeCode`,
   `refresh`, `backfill`, `sync`), a stage per connection (autorizado → importando →
   processando → pronto) shown as a stepper.
2. **pg-boss on the same Postgres** as the job runner (backfill, incremental sync, token
   refresh), run by a second entry of the API bundle (`worker.ts`). No Redis.
3. **Raw layer, then the CSV path**: every pull is stored as it came (`raw_record`) and
   mapped to the same `OrderInput` / `AdSpendRow` / `TrafficRow` the CSV import uses, so the
   write service, the customer refresh and the dashboards do not care about the source.
4. Delivery order by value ÷ calendar: Nuvemshop and Bling (no platform review) first; the
   Google and Meta apps are registered now so their reviews run in parallel.

## Por quê

- Nango, Airbyte and the unified APIs cover none of the Brazilian platforms (Bling,
  Nuvemshop, Tray, Tiny, Mercado Livre) — the half the consultancy's clients actually use —
  and none removes the platform reviews, which are the real calendar cost.
- The OAuth code per provider is small; what is expensive is sync correctness (pagination,
  incremental cursors, rate limits, re-syncing the last days) and that is ours in every
  option.
- pg-boss keeps the dev setup at `docker compose` + Postgres and gives retries, scheduling
  and singleton jobs; a Redis queue would be a second stateful service for the same result.
- Reusing the CSV mappers means the connector delivers value on day one through the same
  screens, and undo/preview logic stays where it is.

## Alternativas descartadas

- **Nango for the ad platforms.** Kept as an escape hatch if Meta/Google token handling
  proves painful; it would still leave the reviews and the Brazilian connectors to us.
- **Airbyte / Fivetran.** Built for one company's warehouse, not for a multi-tenant connect
  button; a second data model to map; Fivetran priced by rows.
- **Building sync inside the request process.** Backfills take hours; they need retries and
  a scheduler, so a worker was inevitable.
