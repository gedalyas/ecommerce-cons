# Operations — activity log and store archiving

Status: **delivered 2026-09-13** — board in `operations-tasks.md`; behaviour in `saas.md`.

## Why this round

Several stores, several consultants and clients who now act alone (invitations, imports,
undo): nobody can answer "who did what, when" on a store, and a store that ends its
engagement cannot be closed without deleting it. The commercial flow (`commercial-plan.md`)
also assumes an audit log for manual overrides. Both are self-contained (no credentials).

## Decisions

1. **One `audit_event` table, written by the services that mutate.** `clientId` (null for
   global events such as inviting a consultant), actor (id, name and role denormalised at
   write — a user may leave), `action` (closed set in `contracts/audit`), a Portuguese
   `summary` produced at write by a pure function, and `metadata` (ids and the few values the
   summary needs). Recording never fails the request: an audit failure is logged with
   `console.error` and swallowed.
2. **Writes take the actor.** Consulting and store services take `AuthContext` instead of a
   bare `clientId`; imports take the user id they already had; admin services already take
   the principal. The controller stays transport.
3. **Archiving is a flag, not a delete.** `Client.archivedAt`; only an `ADMIN` archives or
   restores. Staff still open an archived store (badge "Arquivada"); a `CLIENT` whose store
   is archived is blocked at `resolveClient` (403) and lands on `/loja-arquivada` in the web
   instead of the onboarding. Data stays; nothing is cascaded.

## Stages

| Stage | Scope                                                                                                                | Workspaces                             |
| ----- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| O0    | Plan and board                                                                                                       | specs                                  |
| O1    | `audit_event`, `contracts/audit`, API `audit` module, recording in every mutating path                               | database, contracts, api               |
| O2    | `GET /activity` (store) and `GET /admin/activity` (staff, per store); web: `/loja` › Atividade, `/admin` › Atividade | api, contracts, web                    |
| O3    | Archiving: schema, `PUT /admin/stores/:id/archive                                                                    | restore`, guards, web pages and badges | database, api, contracts, web |
| O4    | Docs (`saas.md`, `admin` notes, CLAUDE.md), board closed                                                             | specs                                  |

## Endpoints added

| Method | Path                               | Auth  | Answer                                             |
| ------ | ---------------------------------- | ----- | -------------------------------------------------- |
| GET    | `/activity?pagina=`                | store | `ActivityPage { entries, page, pageSize, total }`  |
| GET    | `/admin/activity?storeId=&pagina=` | staff | same, across the stores the caller sees (+ global) |
| PUT    | `/admin/stores/:id/archive`        | admin | `AdminStore`                                       |
| PUT    | `/admin/stores/:id/restore`        | admin | `AdminStore`                                       |
