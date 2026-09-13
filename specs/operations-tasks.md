# Operations — task board

Checklist companion to `operations-plan.md`. Tick tasks as they land (`[x]`), add a short
note when something changed along the way. Keep this file and the plan in sync.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped

Status: **O0–O2 done, O3 next** — last updated 2026-09-13

---

## O0 — Plan

- [x] `specs/operations-plan.md`, this board

## O1 — Audit events

- [x] Schema: `AuditEvent` (`clientId?`, `actorId?`, `actorName`, `actorRole`, `action`,
      `summary`, `metadata Json?`, `createdAt`; index `[clientId, createdAt]`); migration
- [x] Contracts `audit/`: `auditActions` + `auditActionLabel`, `ActivityEntry`,
      `ActivityPage`, `activityQuerySchema`
- [x] API `modules/audit`: `recordActivity(actor, event)` (never throws), pure
      `auditSummary.ts` (action + metadata → Portuguese sentence, tested)
- [x] Recording: admin (invite created/resent/revoked, consultants assigned, request
      resolved), auth (user registered), store (created, updated), imports (run, undone),
      consulting (pillar, manual KPI, recommendation created/updated/done/deleted,
      milestone), connections (request); consulting and store services take `AuthContext`;
      imports take it too (`runImport(auth, …)`, `undoImportJob(auth, …)`); migration
      `20260913200000_audit_event`; `visibleClientIds` published by the admin contract and
      injected into the activity routers from `app.ts` (audit never imports admin)

## O2 — Activity screens

- [x] API: `GET /activity` (store-scoped, 50 per page), `GET /admin/activity?storeId=`
      (staff: visible stores + global events)
- [x] Web: `/loja` › "Atividade" (everyone with a store), `/admin` › "Atividade" with a
      store filter; rows: when · who · what
- [x] Flow (`e2e_activity.mjs`): consultant edits a pillar → `/admin` › Atividade lists it
      with the store; the store filter (search `loja`) drops the store column; the client sees
      the same entry on `/loja` › Atividade with the consultant as actor
- [x] Web module `activity` (`ActivityTable`, server fns); `AdminActivity` extracted so
      `Admin` does not grow; paging through the search param `pagina`

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
