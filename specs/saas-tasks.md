# SaaS — task board

Checklist companion to `saas-plan.md`. Tick tasks as they land (`[x]`), add a short note when
something changed along the way. Keep this file and the plan in sync.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped

Status: **S1–S3 done (2026-09-13)** — the web adapts in S4 — last updated 2026-09-13

---

## S0 — Plan

- [x] `specs/saas-plan.md`, this board, `decisions/2026-09-13-saas-tenancy.md`

## S1 — Schema and seed

- [x] `UserRole` gains `ADMIN`; `User.clientId` nullable; `ConsultantAssignment`; `Invitation`;
      `ConnectionRequest` + status enum; `Client` profile fields; `DataSource.connectorKey`
      (unique per client); `Pillar` keyed by area/key (titles from the template);
      `ManualKpiValue`; `Recommendation.dueDate` as a date; `MilestoneCriterion` from the
      template; dropped `Section`, `Metric`, `Alert`, `MonthlySnapshot`, `AssistantMessage`
      — migration `20260913171500_saas_tenancy` (generated with `migrate diff` after wiping
      the tenant rows: the interactive prompt of `migrate dev` cannot run here)
- [x] `db:seed` creates only the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`; the Aurora
      fixtures are deleted; `db:seed:dev` creates "Loja Exemplo" (synthetic facts, a client
      user and a consultant, `SEED_USER_PASSWORD`) through `provisionStore` + the templates;
      `DEMO_TODAY` pins the API clock for that dataset

## S2 — API

- [x] `requireAuth` sets the principal (`{ userId, role }`, the JWT no longer carries a
      store); `resolveClient` reads `x-client-id` (or the only store the caller has), checks
      access (`storeAccess.ts`, tested) and sets `req.auth.clientId`; `GET /me` returns the
      user with the stores they may open
- [x] `POST /auth/register` (pending invitation required, accepts it), `GET /auth/invitation`
      (what the register page shows), `POST /stores` (creates the store and provisions
      pillars, milestone criteria and data sources from the templates; links the client
      user or assigns the consultant), `GET/PUT /store`
- [x] Admin: `GET /admin` (stores, consultants, invitations, requests — admins see all,
      consultants their portfolio), `POST/DELETE /admin/invitations`,
      `PUT /admin/stores/:id/consultants` (admin), `PUT /admin/connection-requests/:id`
- [x] Connectors: `GET /connections` renders the catalog with the store's status and open
      request; `POST /connections/:key/request` (409 when one is open); imports stamp sources
      by connector key
- [x] Consulting per store: `sectionFor` builds the area from the template + the store's
      pillar rows + live KPIs (passed by the area service: money DRE indicators, marketing
      overview/retention, logistics inventory) + manual KPI values; `PUT /consulting/pillars/:key`,
      `PUT …/kpis/:kpiKey`, recommendations CRUD + done, `PUT /consulting/milestone/:key`
      (staff only; `canEdit` travels in the section)
- [x] Dashboard fidelity keyed by connector feed (best provider wins, tested); real clock
      (`currentDay()` = `DEMO_TODAY` or today); smoke: admin invites, client registers and
      creates a store, empty dashboard answers 200 with zeros, connector request, consultant
      sees nothing until assigned then edits pillar/KPI/recommendation/milestone, client
      reads them and is refused on edits and on other stores

## S3 — Contracts and clock

- [x] `connectors` catalog (9 connectors, kinds, feeds, availability); `consulting`
      engagement template (4 areas, 13 pillars, 15 live KPI keys, manual KPIs with hints, 4
      milestone criteria) and edit schemas; `auth` roles + register schemas + `StoreSummary`;
      `store` profile (segments, revenue bands); `admin` shapes and schemas;
      `ConsultingMetric` is now live (numbers) or manual (consultant text)
- [x] Real clock: `todayIso()`, `defaultPeriodSearchFor(today)`, `parsePeriodSearch(input,
    today)`; `PROTOTYPE_TODAY` is gone

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
