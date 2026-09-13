# SaaS plan — tenants, roles, onboarding, connector catalog

Status: **approved 2026-09-13, in execution** — board in `saas-tasks.md`.

## Why

Loja Aurora was a mock. The product is a SaaS: each store is a tenant that signs in with an
e-mail the consultancy released, configures its own store, connects the sources available to
it and reads its own numbers. Decisions taken with Davi on 2026-09-13:

| Decision   | Choice                                                                                                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Access     | The consultancy releases e-mails from an admin panel; the invitee sets a password and configures the store on first access                                                                |
| Roles      | `ADMIN` sees every store; `CONSULTANT` sees the stores assigned to them; `CLIENT` sees their own                                                                                          |
| Connectors | A catalog per store; CSV import works today; API connectors are requested ("Solicitar conexão") and the consultancy sees the request; OAuth arrives when the apps exist                   |
| Demo data  | Loja Aurora and every example text leave the product. A synthetic dataset stays as a **development-only** seed (`db:seed:dev`, tenant "Loja Exemplo") so screens can be exercised locally |

## Tenancy model

```
Client (the store)  1 ─── n  User (role CLIENT)              a client user belongs to one store
Client              n ─── n  User (role CONSULTANT)          through ConsultantAssignment
User (role ADMIN)   ───────  every client
Invitation          email + role (+ client for CLIENT invitations into an existing store, or none: the invitee creates the store)
```

- `User.clientId` becomes nullable (consultants and admins have none); `ConsultantAssignment`
  (`consultantId`, `clientId`, unique) carries the consultant's portfolio.
- **Active store.** Every data endpoint works on one store. The web session keeps
  `activeClientId`; the BFF sends it as `x-client-id`; the API's `resolveClient` middleware
  checks the caller may see it (`CLIENT` → own, `CONSULTANT` → assigned, `ADMIN` → any) and
  sets `req.auth.clientId`. `GET /me` lists the stores the caller may open; the sidebar shows
  a store switcher for consultants and admins.
- `Client` gains the store profile the user fills in: `segment`, `platform` (the storefront),
  `monthlyRevenueBand`, `timezone` (default `America/Sao_Paulo`), `onboardedAt`.
- **Invitation** (`invitation`): `email` (unique), `role`, `clientId?`, `invitedById`,
  `createdAt`, `acceptedAt`. `POST /auth/register` accepts an e-mail with a pending invitation,
  creates the user (and, for a `CLIENT` invitation without a store, the store from the
  onboarding payload). `POST /auth/login` keeps working for existing users.
- The first `ADMIN` comes from the environment (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) on
  `db:seed`, so a fresh install has exactly one user and no store.

## Connectors

`packages/contracts/src/connectors/connectorCatalog.ts`: `bling`, `shopify`, `nuvemshop`,
`vtex`, `meta_ads`, `google_ads`, `tiktok_ads`, `ga4`, `manual_csv` — key, label, kind
(ERP · Plataforma · Mídia paga · Analytics · Importação manual), what it feeds (orders, ad
spend, traffic), `availability` (`manual` works today; `request` needs the consultancy;
`oauth` later). When a store is created, one `DataSource` row per catalog entry is created
(`connectorKey`, status `NOT_CONNECTED`; `manual_csv` starts `MANUAL`). Conexões renders the
catalog with the store's status; "Solicitar conexão" creates a `ConnectionRequest`
(`clientId`, `connectorKey`, `status` REQUESTED · IN_PROGRESS · DONE · DECLINED, `note`,
`requestedById`, `resolvedAt`) that the admin panel lists and resolves.

## The consulting layer without example texts

The four areas keep their pillars, but as a **template** (`contracts/consulting/engagementTemplate.ts`):
area key/title/subtitle, pillar key/title, and the live KPI keys each pillar shows (the same
mapping the screens already do by label). When a store is created, `Section` and `Pillar` rows
are created from the template with status `NOT_STARTED`; the consultant changes status and
"dados pendentes" per pillar, writes recommendations (CRUD) and marks the four milestone
criteria (template, per store). The `metric`, `alert`, `monthly_snapshot` and
`assistant_message` tables go away — KPIs are live or absent ("Sem dados no período").

## Clock

`PROTOTYPE_TODAY` becomes a real clock: `todayIso()` in `contracts/shared/clock`; the API
reads `DEMO_TODAY` from the environment only for the dev dataset. Screens whose default
period was pinned to 2026-09-10 now default to the last 30 days.

## Web

- `/entrar` (login) and `/cadastro` (register with an invited e-mail: name, password);
  `/configurar-loja` (onboarding: store name, segment, platform, revenue band) for a `CLIENT`
  invitation without a store; `/loja` (store settings, editable by the client and the
  consultant).
- Sidebar: the active store's name (no more "Nome Provisório" / "Loja Aurora"), the store
  switcher for `CONSULTANT`/`ADMIN`, the user block.
- `/admin` (`ADMIN`, `CONSULTANT`): stores (all / assigned) with the consultant assignments
  (admin edits), invitations (create, list, revoke), connection requests (resolve).
- Every screen answers a store with no data: the empty state names the source ("Importe seus
  pedidos em Conexões") instead of a blank chart.

## Stages

| Stage | What                                                                                                                                                                                                                  |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S0    | This plan, the board, the decision record                                                                                                                                                                             |
| S1    | Schema: roles, nullable `User.clientId`, `ConsultantAssignment`, `Invitation`, `ConnectionRequest`, store profile, `DataSource.connectorKey`, dropped tables; seed = admin only; `db:seed:dev`                        |
| S2    | API: `resolveClient` + `x-client-id`, `/me` with stores, register, onboarding (store creation from the templates), store settings, admin endpoints (stores, assignments, invitations, requests), connectors endpoints |
| S3    | Contracts: connector catalog, engagement template, auth/admin/store schemas and shapes; real clock                                                                                                                    |
| S4    | Web: register, onboarding, store settings, store switcher, admin panel, Conexões on the catalog, empty states                                                                                                         |
| S5    | Consulting layer per store: pillar status/pendency editing, recommendations CRUD, milestone editing                                                                                                                   |
| S6    | Docs: `saas.md`, `connections.md`, `product-overview.md`, CLAUDE.md, board closed                                                                                                                                     |
