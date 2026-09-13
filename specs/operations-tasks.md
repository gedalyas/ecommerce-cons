# Operations — task board

Checklist companion to `operations-plan.md`. Tick tasks as they land (`[x]`), add a short
note when something changed along the way. Keep this file and the plan in sync.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped

Status: **O0 done, O1 next** — last updated 2026-09-13

---

## O0 — Plan

- [x] `specs/operations-plan.md`, this board

## O1 — Audit events

- [ ] Schema: `AuditEvent` (`clientId?`, `actorId?`, `actorName`, `actorRole`, `action`,
      `summary`, `metadata Json?`, `createdAt`; index `[clientId, createdAt]`); migration
- [ ] Contracts `audit/`: `auditActions` + `auditActionLabel`, `ActivityEntry`,
      `ActivityPage`, `activityQuerySchema`
- [ ] API `modules/audit`: `recordActivity(actor, event)` (never throws), pure
      `auditSummary.ts` (action + metadata → Portuguese sentence, tested)
- [ ] Recording: admin (invite created/resent/revoked, consultants assigned, request
      resolved), auth (user registered), store (created, updated), imports (run, undone),
      consulting (pillar, manual KPI, recommendation created/updated/done/deleted,
      milestone), connections (request); consulting and store services take `AuthContext`

## O2 — Activity screens

- [ ] API: `GET /activity` (store-scoped, 50 per page), `GET /admin/activity?storeId=`
      (staff: visible stores + global events)
- [ ] Web: `/loja` › "Atividade" (everyone with a store), `/admin` › "Atividade" with a
      store filter; rows: when · who · what
- [ ] Flow: invite, import, undo, edit a pillar → the entries appear on both screens with
      the right actor

## O3 — Store archiving

- [ ] Schema: `Client.archivedAt`; migration
- [ ] API: `PUT /admin/stores/:id/archive` and `/restore` (admin only, audited);
      `StoreSummary.archivedAt`; `resolveClient` answers 403 "Esta loja está arquivada" to a
      `CLIENT`; `AdminStore.archivedAt`
- [ ] Web: root guard sends a client with an archived store to `/loja-arquivada` (message +
      sign out); sidebar badge for staff; `/admin` › Lojas shows Arquivar / Reativar
- [ ] Flow: archive → client blocked on every screen → restore → client back

## O4 — Docs and close

- [ ] `specs/saas.md` (activity, archiving), CLAUDE.md (writes take the actor; audit rule),
      `specs/README.md` rows; board closed
