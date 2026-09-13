# SaaS — task board

Checklist companion to `saas-plan.md`. Tick tasks as they land (`[x]`), add a short note when
something changed along the way. Keep this file and the plan in sync.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped

Status: **S1–S5 done (2026-09-13)** — last updated 2026-09-13

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

- [x] Session carries `activeClientId` (+ `userRefreshedAt`; the user is refreshed from `/me`
      when stale or store-less); `apiFetch` sends `x-client-id`; the root `beforeLoad` guards
      every navigation (no session → `/entrar`; no store → `/configurar-loja` for clients,
      `/admin` for staff; clients never reach `/admin`) and the loader keeps the shell status
- [x] `/cadastro` (`Register`, invitation lookup while typing), `/configurar-loja`
      (`StoreOnboarding`), `/loja` (`StoreSettings`), shared `StoreForm`; `AuthCard` shared by
      the auth pages; the sidebar shows the active store, a switcher when the user has more
      than one, "Loja" and (staff) "Administração"; "Loja Aurora" and "Nome Provisório" gone
- [x] `/admin`: stores with consultant assignment (admin), invitations (form + revoke),
      connection requests (status select)
- [x] Conexões on the catalog: status, sync label, feeds, "Solicitar conexão" dialog,
      "Importar CSV" anchor; area screens render `ConsultingSection` through
      `consulting/consultingUi.ts` (tested): live KPIs formatted with the comparison, manual
      KPIs with the consultant's value or the hint, empty live KPIs as "—" with a C seal
- [x] Headless browser: admin invites client + consultant → client registers (invite shown)
      → creates the store → empty dashboard (0 de 4 critérios) → nine screens render → requests
      a connector → imports 3 orders → Pedidos lists them → `/admin` redirects home;
      consultant registers → `/admin` with no stores → admin assigns via the multiselect →
      consultant sees the store and its screens

## S5 — Consulting layer per store

- [x] `PillarEditor` (pencil in the pillar header when `section.canEdit`): status +
      pendency, manual KPI values (value, variação, selo, nota), recommendations (add, mark
      done, delete); `MilestoneEditor` on the dashboard for staff (progress, achieved, note);
      `PillarCard`/`SectionPage` gained an `actionSlot`/`renderAction`; BFF server functions
      in `consulting/consultingController.ts`. Browser check: consultant edits everything on
      Loja Exemplo, the client sees the results with no edit controls

## S6 — Docs

- [ ] `specs/saas.md`, `connections.md`, `sections.md`, `dashboard.md`, `product-overview.md`,
      `README.md`, CLAUDE.md updated; board closed
