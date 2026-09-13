# Product overview

## What it is

A web dashboard for an e-commerce **consulting** service. The consultancy plugs
into the client's tools (ERP, storefront, ad platforms, analytics), consolidates
the numbers, and drives the engagement through four areas — **Dinheiro**,
**Marketing**, **Logística**, **Gestão** — each broken into _pillars_ with KPIs
and open recommendations. An AI assistant sits beside every screen and answers
questions grounded in the client's own numbers.

## Current stage: single-client prototype on a real database

- One repository holds both halves: the server side is the `*Controller.ts`
  (TanStack Start server functions) and `*Service.ts` (Prisma/PostgreSQL)
  files of each module. Every screen reads its loader payload from the
  database; nothing renders a fixture.
- No login, no real integrations: the data is a deterministic seed
  (`prisma/seed.ts` + `seedAnalytics.ts`) describing one client ("Loja
  Aurora") with 18 months of orders ending on 2026-09-10. Connecting real
  sources (ERP, storefront, ad platforms, GA4) is the next backend stage —
  see [data-layer-migration.md](data-layer-migration.md).
- The consulting layer (pillars, KPIs, recommendations, milestone) is seeded
  copy; the data screens (Pedidos, Produtos, Clientes, Dinheiro › DRE,
  Marketing, Metas, Métricas, Influenciadores) are computed from the facts.
- The assistant replies with canned text.
- The upload area in Conexões is visual only.

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
