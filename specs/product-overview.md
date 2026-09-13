# Product overview

## What it is

A web dashboard for an e-commerce **consulting** service. The consultancy plugs
into the client's tools (ERP, storefront, ad platforms, analytics), consolidates
the numbers, and drives the engagement through four areas — **Dinheiro**,
**Marketing**, **Logística**, **Gestão** — each broken into _pillars_ with KPIs
and open recommendations. An AI assistant sits beside every screen and answers
questions grounded in the client's own numbers.

## Current stage: web + API on a real database, login, one client

- One repository, npm workspaces: `apps/api` (Express 4 + Zod + Prisma 7,
  `/api/v1`, JWT) is the backend the web and the coming React Native app
  share; `apps/web` (TanStack Start, SSR) signs in at `/entrar` and calls the
  API from its server functions; `packages/contracts` holds the shapes,
  schemas and closed sets both clients import — see
  [backend-plan.md](backend-plan.md).
- Every screen reads its loader payload from the API; nothing renders a
  fixture. Login is email + password (seed user
  `consultor@lojaaurora.com.br`), one user per client.
- No real integrations: the data is a deterministic seed
  (`packages/database/prisma/seed.ts` + `seedAnalytics.ts`) describing one
  client ("Loja Aurora") with 18 months of orders ending on 2026-09-10.
  Connecting real sources (ERP, storefront, ad platforms, GA4) is the next
  backend stage.
- The consulting layer (pillars, KPIs, recommendations, milestone) is seeded
  copy; the data screens (Pedidos, Produtos, Clientes, Dinheiro › DRE,
  Marketing, Metas, Métricas, Influenciadores) are computed from the facts.
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

The sidebar shows the placeholder "Nome Provisório" — the product has no final
name yet. The repository/package name is `ecommerce-insights`.
