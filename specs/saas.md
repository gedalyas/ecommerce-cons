# SaaS — tenants, roles, access and the consulting layer per store

How the product serves many stores. Plan and decisions: `saas-plan.md`,
`decisions/2026-09-13-saas-tenancy.md`.

## Roles

| Role         | Sees                        | Can                                                                                                                                                                  |
| ------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN`      | every store                 | everything below plus inviting consultants and assigning them to stores                                                                                              |
| `CONSULTANT` | the stores assigned to them | invite clients into their stores, resolve connection requests, edit the engagement (pillar status, pendências, manual KPIs, recommendations, milestone), import CSVs |
| `CLIENT`     | their own store             | read every screen, configure the store (`/loja`), request connectors, import CSVs                                                                                    |

The first `ADMIN` is created by `npm run db:seed` from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. A
fresh install has one user and no store.

## Access by invitation

1. A staff user releases an e-mail on `/admin` › Convites (role, and for clients the store —
   or "Nova loja", meaning the invitee creates one).
2. The invitee opens `/cadastro` (the page checks the e-mail as it is typed and shows the
   invitation: "Convite de cliente para Loja X"), sets name and password (`POST
/auth/register`, invitation required), and is signed in.
3. A client without a store lands on `/configurar-loja` (name, segmento, plataforma, faixa de
   faturamento → `POST /stores`), which provisions the store: the four areas' pillars, the
   four milestone criteria and one data-source row per connector of the catalog. A
   consultant without stores lands on `/admin` until an admin assigns one.

## The active store

Every data endpoint works on one store. The web session keeps `activeClientId`; the BFF
sends it as `x-client-id`; the API's `resolveClient` checks the caller's access (client →
own store, consultant → assignment, admin → any; without the header, the only store the
caller has) and rejects the rest with 403. Consultants and admins switch stores from the
sidebar selector; the session refreshes the user's store list from `/me` when it is empty
or older than five minutes, so a new assignment shows up without re-login.

## Connectors

`packages/contracts/src/connectors/connectorCatalog.ts` lists the nine connectors (Bling,
Shopify, Nuvemshop, VTEX, Meta Ads, Google Ads, TikTok Ads, GA4, Importação manual) with
kind, what they feed and availability. Conexões renders the catalog with the store's status:
the manual CSV works today (see `imports.md`); the others show "Solicitar conexão", which
records a `ConnectionRequest` the staff sees on `/admin` (Solicitada · Em andamento ·
Concluída · Recusada). A successful CSV import stamps the matching sources and turns
`NOT_CONNECTED`/`ERROR` into `MANUAL`.

## The consulting layer per store

There is no example copy. `packages/contracts/src/consulting/engagementTemplate.ts` defines
the four areas, their pillars and, per pillar, the KPIs: **live** ones computed from the
store's data (DRE indicators, marketing overview, retention, inventory) and **manual** ones
the consultancy informs (Caixa livre, Seguidores, Prazo médio de entrega…). The API composes
each area from the template, the store's pillar rows (status, pendência), the manual values
and the live values; the web formats live KPIs with the period comparison, shows manual
values with their seal and note, and renders "—" with a C seal when nothing is available.

Staff edit through the pencil on each pillar (status, pendência, manual KPIs,
recommendations) and on the dashboard milestone (progress, achieved, note). Clients read.
The dashboard alerts stay derived from the data.

## Clock

`todayIso()` is the real date. `DEMO_TODAY` (API env) pins the clock for the development
dataset (`npm run db:seed:dev`, store "Loja Exemplo", users `cliente@lojaexemplo.dev` and
`consultor@ecommerce-insights.dev`, password `SEED_USER_PASSWORD`), whose data ends on
2026-09-10. Leave it empty in production.
