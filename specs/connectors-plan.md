# Connectors — how to make "conectar" a one-click thing (research and proposal)

Status: **delivered 2026-09-13** (K0–K7) — board in `connectors-tasks.md`; decision in
`decisions/2026-09-13-connector-framework.md`; behaviour in `connections.md`. Every provider
ran against a local stub of its platform; the real apps, credentials and reviews are the
consultancy's next step (list at the end). Sources: the Prax
walkthrough (`prax-analytics-documentacao-completa.md` §16, §20) and the platforms'
developer documentation — one sheet per platform in `docs/apis/` (auth, endpoints, limits,
what still needs confirming).

## What Prax does (the bar to match)

- One **Conexões** screen: status card ("a Prax precisa de uma fonte de e-commerce ou ERP
  primeiro"), a 4-step **stepper** (fonte autorizada → importando histórico → processando
  análises → pronto), the connected integrations, and the **catalog** grouped by category —
  each card leads to `/connections/create/{connector}` whose form adapts to one of **three
  auth patterns**: OAuth (Google, Meta, TikTok, Mercado Livre, Bling), **domain + OAuth**
  (Nuvemshop, Tray) and **manual credentials** (VTEX, Tiny, Wbuy…). The button is always
  "Conectar-se a {Conector}".
- A **data-readiness** endpoint gates the data screens with a bypass ("Acessar mesmo assim")
  and a fixed banner until the first source is in.
- Bling gets a **status mapping** sub-screen (ERP statuses → Pago / Pendente / Cancelado).
- Ingestion is layered: raw mirror of each API → unified model → daily facts.

We already have the catalog, the request flow, the status per source, the unified model and
the daily facts (the CSV importers write to them). What is missing is the **auth layer, the
sync engine and the stepper**.

## What each platform requires (2026)

| Platform                       | Auth pattern               | Registration                                                                                                                                                         | Token life                                                             | Review / gate                                                                                                                           | Effort  |
| ------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **Nuvemshop**                  | OAuth (authorization code) | Partner account → app (client id/secret, redirect URL, scopes)                                                                                                       | Access token **does not expire**                                       | None for our own clients; publishing in the app store is optional                                                                       | Low     |
| **Bling** (ERP)                | OAuth (authorization code) | App in the Bling "Área do integrador" (private or public), scopes, redirect URL; token endpoint with Basic auth                                                      | Access ~hours; **refresh 30 days**                                     | Private app works for authorised accounts; public listing optional. Needs the status/channel mapping screen                             | Low–Med |
| **Meta Ads**                   | OAuth (Facebook Login)     | Meta developer app; `ads_read` (+ `read_insights`)                                                                                                                   | Long-lived user token 60 days; system users                            | **Business Verification + App Review** to read other businesses' ad accounts; "Marketing API Access Tier" (500 calls/15 d, <15% errors) | Medium  |
| **Google Ads**                 | OAuth (Google)             | Google Cloud project + OAuth consent screen; Google Ads API access on the **Cloud project** (developer tokens being sunset, Sep 2026)                                | Refresh token indefinite (unless unused 6 months / consent in testing) | Brand verification, then **Basic access** (automated review, 15 000 ops/day) → Standard later                                           | Medium  |
| **GA4**                        | OAuth (Google, same app)   | Enable the GA4 Data API on the same Cloud project; scope `analytics.readonly`                                                                                        | same                                                                   | OAuth consent-screen verification (sensitive scope) — one process for Ads + GA4                                                         | Low     |
| **Shopify**                    | OAuth (public app)         | Dev Dashboard / Partner app (since Jan 2026 custom apps cannot be created in the admin); `read_orders` gives 60 days, **`read_all_orders` needs approval (~7 days)** | Offline token, no expiry                                               | Public distribution = app review; custom distribution to named stores works without listing                                             | Medium  |
| **TikTok Ads**                 | OAuth                      | TikTok for Business developer app                                                                                                                                    | Refresh needed                                                         | App review                                                                                                                              | Medium  |
| Instagram / Facebook (organic) | OAuth (same Meta app)      | `instagram_basic`, `pages_read_engagement`, insights                                                                                                                 | as Meta                                                                | App Review per permission                                                                                                               | Later   |
| YouTube                        | —                          | Not now (decision 2026-09-13)                                                                                                                                        |                                                                        |                                                                                                                                         | —       |

The code for an OAuth connector is small (redirect, callback, token exchange, refresh, an
encrypted vault). The calendar cost is the **platform reviews** — Meta and Google take weeks
and need a verified business, a privacy policy URL and a demo. They should start now,
in parallel with anything we build.

## Options

| Option                                      | What it gives                                                                                                                                       | What it costs                                                                                                                                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. In-house connector framework**         | Full control; the Brazilian platforms (Bling, Nuvemshop, later Tray/VTEX/Tiny) have no third-party support anyway                                   | We write OAuth + sync + mappers per connector and keep up with API changes; needs a job runner                                                                                                |
| **B. Embedded auth layer (Nango)**          | OAuth, token refresh and a hosted "Connect" UI for Shopify, Google Ads, Facebook, Google Analytics, TikTok Ads, VTEX (1 005 providers; open source) | Free up to 10 connections, then $0.29/connection + compute; **no Bling, no Nuvemshop, no Mercado Livre**; the platform apps and reviews are still ours; data sync still ours (or Nango syncs) |
| **C. ELT platform (Airbyte / Fivetran)**    | Ready connectors for Shopify, Google Ads, Facebook Marketing, GA4, TikTok into a warehouse                                                          | Built for one company's warehouse, not for a multi-tenant "connect your store" button; no Bling/Nuvemshop; Fivetran priced by rows; a second data model to map                                |
| **D. Unified commerce API (Rutter, Merge)** | One API for Shopify/WooCommerce/Amazon…                                                                                                             | No Brazilian platforms; enterprise pricing                                                                                                                                                    |

## Recommendation: A, with B as an optional shortcut for the ad platforms

1. **One connector framework in the API** (`modules/connectors`), modelled on the Prax
   screen: a `Connection` row per store × connector with `authPattern`
   (`oauth | domain_oauth | credentials`), an **encrypted credential vault**
   (`CREDENTIALS_KEY`, AES-GCM), `stage` (`authorized → importing → processing → ready`),
   `lastSyncAt`, `lastError`. The catalog we have gains `availability: "oauth"` per
   connector as each one goes live; "Solicitar conexão" stays for the rest.
2. **A job runner on Postgres** (pg-boss — no Redis, same database): `backfill` (history,
   chunked by month), `sync` (incremental every N hours), `refresh-token`. The runner is a
   second process of the API bundle (`apps/api` with `--worker`), so dev stays `npm run dev`.
3. **Raw layer per connector, reuse of the CSV mappers**: every pull is stored as it came
   (`raw_orders`, `raw_ad_insights`…), then mapped with the same rules the CSV import uses
   (`OrderInput`, `AdSpendRow`, `TrafficRow`) and written by the same write service — the
   dashboards do not know whether a row came from a CSV or from the API.
4. **Order of delivery** (value ÷ calendar): **Nuvemshop** and **Bling** first (no review,
   most of the consultancy's clients), then **Meta Ads + Google Ads + GA4** (one Google
   Cloud project serves Ads and GA4; the reviews run while we build), then **Shopify**,
   then TikTok, then organic Instagram/Facebook. YouTube stays out.
5. Nango only if the Meta/Google token handling proves painful; it does not remove the
   reviews and does not cover the Brazilian half.

## Stages (when approved)

| Stage | Scope                                                                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------- |
| K0    | Plan, board, decision; **register the apps** (Nuvemshop partner, Bling integrator, Meta, Google Cloud, Shopify) |
| K1    | Framework: `Connection`, vault, job runner (pg-boss), stepper on Conexões, data-readiness banner + bypass       |
| K2    | Nuvemshop: OAuth, backfill orders/products/customers, incremental sync, webhooks for new orders                 |
| K3    | Bling: OAuth + refresh, status mapping screen, orders/products/stock                                            |
| K4    | Google: Ads insights (campaign/adset/ad daily) + GA4 sessions by source/medium                                  |
| K5    | Meta Ads insights daily                                                                                         |
| K6    | Shopify (public app, `read_all_orders`), TikTok Ads                                                             |
| K7    | Docs; retire "Solicitar conexão" for live connectors                                                            |

## What Davi needs to open (accounts and apps)

- Nuvemshop **partner account** → app (redirect `https://<api>/api/v1/connectors/nuvemshop/callback`).
- Bling **Área do integrador** → app with scopes for pedidos, produtos, estoque, contatos.
- **Meta for Developers** app + **Business Verification** of the consultancy; privacy policy
  and terms URLs on the site.
- **Google Cloud** project: OAuth consent screen (external, verified), Google Ads API
  (Basic access) and GA4 Data API enabled.
- **Shopify Dev Dashboard** app (custom distribution first).
- A domain for the API with HTTPS (OAuth callbacks refuse `localhost` in production).

Next round (2026-09-13): `pilot-plan.md` — deploy, Mercado Livre, Amazon, Instagram/Facebook
organic, then the first real connections with a partner client (Shopify + Bling).

## Sources

- Prax: `specs/prax-analytics-documentacao-completa.md` §16 (Conexões), §20.3 (layers).
- Bling: <https://developer.bling.com.br/bling-api>, <https://developer.bling.com.br/aplicativos>
- Nuvemshop: <https://tiendanube.github.io/api-documentation/authentication>,
  <https://dev.nuvemshop.com.br/en/docs/developer-tools/nuvemshop-api>
- Meta: <https://developers.meta.com/blog/updates-to-ads-management-standard-access-feature/>
- Google Ads: <https://developers.google.com/google-ads/api/docs/api-policy/access-levels>,
  <https://ppc.land/google-drops-developer-tokens-from-ads-api-access-decisions/>
- Shopify: <https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/generate-app-access-tokens-admin>,
  <https://ezapps.io/blogs/shopify-oauth-access-tokens-guide>
- Nango: <https://nango.dev/pricing>, provider list `packages/providers/providers.yaml` (checked 2026-09-13)
