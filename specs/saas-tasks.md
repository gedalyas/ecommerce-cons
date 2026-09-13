# SaaS — task board

Checklist companion to `saas-plan.md`. Tick tasks as they land (`[x]`), add a short note when
something changed along the way. Keep this file and the plan in sync.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped

Status: **S0 done (2026-09-13)** — last updated 2026-09-13

---

## S0 — Plan

- [x] `specs/saas-plan.md`, this board, `decisions/2026-09-13-saas-tenancy.md`

## S1 — Schema and seed

- [ ] `UserRole` gains `ADMIN`; `User.clientId` nullable; `ConsultantAssignment`; `Invitation`;
      `ConnectionRequest` + `ConnectionRequestStatus`; `Client` profile fields;
      `DataSource.connectorKey` (unique per client); drop `Metric`, `Alert`, `MonthlySnapshot`,
      `AssistantMessage`; migration
- [ ] `db:seed` creates only the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`; the Aurora
      fixtures are deleted; `db:seed:dev` creates "Loja Exemplo" with the synthetic dataset,
      a client user and a consultant, for local development only

## S2 — API

- [ ] `resolveClient` middleware (`x-client-id` → access check by role → `req.auth.clientId`);
      `GET /me` returns the user and the stores they may open
- [ ] `POST /auth/register` (invitation required), `POST /stores` (onboarding: creates the
      store + sections/pillars/milestone/data sources from the templates), `GET/PUT /store`
- [ ] Admin endpoints: `GET /admin/stores`, `PUT /admin/stores/:id/consultants` (admin),
      `GET/POST/DELETE /admin/invitations`, `GET /admin/connection-requests`,
      `PUT /admin/connection-requests/:id`
- [ ] Connectors: `GET /connections` on the catalog, `POST /connections/:key/request`
- [ ] Consulting layer per store (S5 endpoints): pillars status, recommendations CRUD,
      milestone criteria edit
- [ ] Every existing endpoint works on the resolved store; enum-parity tests updated; smoke

## S3 — Contracts and clock

- [ ] `connectors` catalog; `consulting/engagementTemplate.ts`; `auth` register/onboarding
      schemas; `admin` shapes and schemas; `store` shapes
- [ ] Real clock (`todayIso`), `DEMO_TODAY` only in the API env for the dev dataset

## S4 — Web

- [ ] `/cadastro`, `/configurar-loja`, `/loja`; sidebar with the store name and the switcher;
      session carries `activeClientId`; BFF sends `x-client-id`
- [ ] `/admin`: stores, consultants, invitations, connection requests
- [ ] Conexões on the catalog with "Solicitar conexão"; empty states across the data screens
- [ ] Headless-browser flow: admin invites → invitee registers → configures the store →
      empty dashboard → imports a CSV → numbers appear; consultant sees only assigned stores

## S5 — Consulting layer per store

- [ ] Pillar status / pendency editing, recommendations CRUD, milestone editing on the area
      screens for `CONSULTANT`/`ADMIN`

## S6 — Docs

- [ ] `specs/saas.md`, `connections.md`, `sections.md`, `dashboard.md`, `product-overview.md`,
      `README.md`, CLAUDE.md updated; board closed
