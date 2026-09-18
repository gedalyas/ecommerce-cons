# SaaS — tenants, roles, access and the consulting layer per store

How the product serves many stores. Plan and decisions: `saas-plan.md`,
`decisions/2026-09-13-saas-tenancy.md`.

## Roles

| Role         | Sees                        | Can                                                                                                                                                                  |
| ------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN`      | every store                 | everything below plus inviting consultants and assigning them to stores                                                                                              |
| `CONSULTANT` | the stores assigned to them | invite clients into their stores, resolve connection requests, edit the engagement (pillar status, pendências, manual KPIs, recommendations, milestone), import CSVs |
| `CLIENT`     | their own store             | read every screen, configure the store (`/loja`), request connectors, import CSVs, manage the team                                                                   |

The first `ADMIN` is created by `npm run db:seed` from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. A
fresh install has one user and no store.

### Team members inside a store

A `CLIENT` user is either the store's **owner** (`User.membership = OWNER`, the one the
invitation or the sale created) or a **team member** (`MEMBER`) the owner invited. Roles stay
three; the member is a second dimension inside the store. The owner decides, per member and
per area, one of **Sem acesso · Ver · Editar**. The areas
(`contracts/auth/accessAreas.ts`) are `MONEY` (/dinheiro), `MARKETING` (/marketing,
/influenciadores, ad spend / traffic / social connectors and imports), `LOGISTICS`
(/logistica), `MANAGEMENT` (/gestao, /metas) and `DATA` (/pedidos, /produtos, /clientes,
/metricas, orders connectors and imports). Stored as `User.viewAreas` / `User.editAreas`
(edit implies view); `grantsOf` / `areasOfGrants` convert to the wire shape
`AreaGrant[]`.

- **Everyone in the store sees** the Dashboard, the Assistente and Conexões (status only).
  `/loja`, the store profile, billing and the team are the owner's.
- **Enforcement.** The API's `resolveClient` loads the member's grants into
  `req.auth.access` (`null` = unrestricted: staff and owners); `createAreaGuards()` mounts
  `requireArea(area)` on each area's route prefixes (`auth/areaRoutes.ts`): a `GET` needs
  view, anything else needs edit, refused with 403 and a Portuguese message. Cross-cutting
  writes check the connector's feeds (`canManageConnector`) or the import kind
  (`areaOfImportKind`): a marketing editor imports ad spend and connects Meta Ads, not
  Shopify. The web hides what the member cannot open (`shared/layout/screenAccess.ts` for
  the sidebar, bottom nav and the root guard; `StoreConnector.canManage` and
  `ImportsScreen.editableKinds` on Conexões). A change of grants applies on the next
  request — no re-login.
- **Invitation.** `/loja` › Equipe: the owner invites an e-mail with its grants
  (`POST /team/invitations`), resends or revokes; the invitee registers through the same
  `/cadastro?convite=` flow, the `Invitation` row carrying `membership` and the areas. The
  owner edits a member's grants (`PUT /team/members/:id`) or removes the member (the user
  row is deleted; the activity log keeps what they did). Every action is an
  `audit_event` (`TEAM_*`).
- **Seats.** `Client.teamSeatLimit` (default 5, an admin adjusts it per store; a plan
  attribute once billing knows plans) caps members plus pending invitations. The form shows
  "n de N assentos" and refuses with 422 past the limit.

## The administration area

Staff never see the store panel by default: `/entrar` sends `ADMIN` and `CONSULTANT` users to
`/admin`, an area with its own shell (no store sidebar, no period). Its sections:

- **Visão geral** (`/admin`): stores, invitations, connection requests and the activity log —
  what a consultant sees for their stores and an admin for all.
- **Usuários** (`/admin/usuarios`, admin only): every account with role, store, consultants
  and creation date; search by name or e-mail (accent-insensitive) and filter by consultant,
  both in the URL (`busca`, `consultor`).
- **Acesso a usuários** (`/admin/acesso`, admin only): the same accounts as cards grouped by
  consultant ("Consultor: X", then "Sem consultor", then "Equipe"). Clicking a card opens the
  system as that person.
- **Abrir o painel**: the store panel, where the staff switch stores from the sidebar. A thin
  bar on top of the panel ("Painel da loja visto pela consultoria · Voltar à administração")
  is the way back; the panel's sidebar has no admin link.

### Opening the system as a user

`POST /admin/users/:id/impersonate` (admin only, never while already impersonating, never
oneself) answers the target's `{ user, tokens }` like a login. The access token carries
`act = <admin id>` and the refresh token row keeps `impersonatorId`, so a refresh keeps the
mark. The web stores the target's credentials in the session and keeps the admin's under
`impersonator`; every screen shows "Você está acessando como X — Voltar à administração",
which revokes the target's tokens and restores the admin session (landing on
`/admin/acesso`). Signing out while impersonating revokes both.

What the admin does in the target's name is recorded as the target, with " (via
administrador)" appended to the actor name in the activity log; the impersonation itself is
a `USER_IMPERSONATED` event on the target's store (or global when they have none).

## Access by invitation

1. A staff user invites an e-mail on `/admin` › Convites (role, and for clients the store —
   or "Nova loja", meaning the invitee creates one). The API issues a random token (sha256
   stored, 7 days) and sends the link `/cadastro?convite=<token>` through the mailer; the
   table shows Pendente · Expirado · Aceito, "Reenviar" rotates the token and sends again.
2. The invitee opens the link: `/cadastro` resolves the token (`GET /auth/invitation`),
   shows "Convite de cliente para Loja X" with the e-mail read-only, and `POST
/auth/register` takes `{ token, name, password }` — the e-mail comes from the invitation, so
   knowing a released address is not enough. An invalid, expired or used link explains
   itself and points to `/entrar`; the hash is cleared on acceptance.
3. A client without a store lands on `/configurar-loja` (name, segmento, plataforma, faixa de
   faturamento → `POST /stores`), which provisions the store: the four areas' pillars, the
   four milestone criteria and one data-source row per connector of the catalog. A
   consultant without stores stays on `/admin` until an admin assigns one.

## Password reset

"Esqueci minha senha" on `/entrar` opens `/esqueci-senha`; `POST /auth/password/forgot`
always answers 202 (no account enumeration) and, when the e-mail exists, sends
`/redefinir-senha?token=` (sha256 stored, 1 hour, single use). `POST /auth/password/reset`
sets the new password, marks the token used and revokes every refresh token of the user.

## E-mail

`apps/api/src/shared/mail`: `Mailer` is injected into the auth and admin routers. With
`SMTP_URL` set, nodemailer sends through that server as `MAIL_FROM`; without it, in
development, each message is written as a text file to `MAIL_OUTBOX_DIR` (default
`apps/api/outbox/`, gitignored) so the flows can be exercised offline. Production refuses to
boot without `SMTP_URL`. Links use `APP_URL`. Templates are pure functions in
`modules/auth/authMail.ts`.

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

## Activity log

Every mutating path records an `audit_event` (actor name and role copied at write, a
closed-set action from `contracts/audit`, a Portuguese summary, metadata): invitations,
consultant assignment, connection requests and their resolution, registration, store
created/updated/archived/restored, imports run and undone, pillar, manual KPI,
recommendations and milestone. `/loja` › Atividade shows the store's log to everyone with the
store; `/admin` › Atividade shows the stores the staff member sees (plus their own global
events, such as inviting a consultant) with a store filter. Recording never fails the request.

## Archiving a store

An `ADMIN` archives a store from `/admin` › Lojas (`Client.archivedAt`); nothing is deleted.
The client is refused by the API (403) and lands on `/loja-arquivada`; staff keep opening the
store, marked "(arquivada)". "Reativar" undoes it; both are in the activity log.

## Clock

`todayIso()` is the real date. `DEMO_TODAY` (API env) pins the clock for the development
dataset (`npm run db:seed:dev`, store "Loja Exemplo", users `cliente@lojaexemplo.dev`
(owner), `marketing@lojaexemplo.dev` (team member: Marketing edit, Dados view) and
`consultor@ecommerce-insights.dev`, password `SEED_USER_PASSWORD`), whose data ends on
2026-09-10. Leave it empty in production.
