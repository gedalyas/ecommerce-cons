# Product overview

## What it is

A web dashboard for an e-commerce **consulting** service. The consultancy plugs
into the client's tools (ERP, storefront, ad platforms, analytics), consolidates
the numbers, and drives the engagement through four areas — **Dinheiro**,
**Marketing**, **Logística**, **Gestão** — each broken into _pillars_ with KPIs
and open recommendations. An AI assistant sits beside every screen and answers
questions grounded in the client's own numbers.

## Current stage: multi-store SaaS on a real database

- One repository, npm workspaces: `apps/api` (Express 4 + Zod + Prisma 7,
  `/api/v1`, JWT) is the backend the web and the coming React Native app
  share; `apps/web` (TanStack Start, SSR) signs in at `/entrar` and calls the
  API from its server functions; `packages/contracts` holds the shapes,
  schemas and closed sets both clients import — see
  [backend-plan.md](backend-plan.md).
- Each store is a tenant with its own users, data and connections. Access is
  by invitation: `ADMIN` sees every store, `CONSULTANT` the stores assigned
  to them, `CLIENT` its own — see [saas.md](saas.md).
- Every screen reads its loader payload from the API for the active store;
  nothing renders a fixture and there is no demo copy. A new store starts
  empty: the four areas and their pillars come from a template, KPIs are
  live (from the data) or informed by the consultancy, and the numbers arrive
  through the CSV import on Conexões ([imports.md](imports.md)) until API
  connectors exist (they can be requested from the same screen).
- A synthetic store ("Loja Exemplo") exists only as a development seed.
- The assistant replies with canned text.
- Real data enters through the CSV import on Conexões (orders, ad spend, traffic — see
  [imports.md](imports.md)); connectors to ERPs and ad platforms are the next step.

## Core concepts

- **Section (área)** — one of the four consulting areas, plus the Dashboard,
  Conexões and Assistente screens.
- **Pillar (pilar)** — a workstream inside a section (e.g. "Aquisição" in
  Marketing). Has a status: `done`, `in-progress`, `not-started` or `blocked`.
- **KPI / Metric** — a number with a label, a month-over-month delta and a
  **fidelity seal** (A/B/C) stating how trustworthy the number is.
- **Recommendation** — an open action item with text, deadline and owner.
- **Maturity milestone (marco de maturidade)** — four criteria; meeting all
  four unlocks the `blocked` pillars ("Canais paralelos", "Tecnologia").
- **Connection (conexão)** — an external data source feeding the KPIs.

## Product name

The sidebar shows "E-commerce Insights" and the active store's name. The
repository/package name is `ecommerce-insights`.

## Commercial stack (decided, not built)

Payment and subscription through **Digital Manager Guru**, the consulting contract signed
through **ZapSign**; the intended flow (sale → invitation → onboarding → contract → access
gate) is in [commercial-plan.md](commercial-plan.md) and waits for the accounts.
