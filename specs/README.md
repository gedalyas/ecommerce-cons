# Specs

Product and engineering specifications for E-commerce Insights. Written in
English (developer-facing); every user-visible string quoted here is Portuguese
because that is what ships.

| Spec                                                                               | Covers                                                                                     |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [product-overview.md](product-overview.md)                                         | What the product is, personas, scope of the prototype                                      |
| [layout-and-navigation.md](layout-and-navigation.md)                               | App shell, sidebar, responsive behavior, routes                                            |
| [finance.md](finance.md)                                                           | Dinheiro: Visão com KPIs vivos, DRE gerencial, cadastro de custos                          |
| [analysis.md](analysis.md)                                                         | Métricas: diagnóstico por métrica com veredito, série e árvore de drivers                  |
| [influencers.md](influencers.md)                                                   | Influenciadores: parcerias, regras de remuneração, cupons e ROI                            |
| [goals.md](goals.md)                                                               | Metas: realizado × meta com pacing e o planejamento anual (6 entradas, 8 derivadas)        |
| [marketing.md](marketing.md)                                                       | Marketing: visão com KPIs vivos, resumo por canal e funil, campanhas, descontos            |
| [customers.md](customers.md)                                                       | Clientes: segmentação RFM com filtros, recompra, LTV e CAC                                 |
| [products.md](products.md)                                                         | Produtos: resumo, curva ABC, estoque por variante                                          |
| [orders.md](orders.md)                                                             | Pedidos: resumo, aprovação por status/método/gateway, lista transacional                   |
| [dashboard.md](dashboard.md)                                                       | The main screen: KPIs, alerts, maturity milestone, chart                                   |
| [sections.md](sections.md)                                                         | Money / Marketing / Logistics / Management anatomy and pillar data                         |
| [kpi-fidelity.md](kpi-fidelity.md)                                                 | The KPI component and the A/B/C data-fidelity seal                                         |
| [connections.md](connections.md)                                                   | Integrações screen: catalog, connectors, data owners, connecting                           |
| [imports.md](imports.md)                                                           | Manual CSV import: kinds, templates, file rules, endpoint, screen                          |
| [reports.md](reports.md)                                                           | Relatório: document model, sections, templates, preview endpoint, builder                  |
| [assistant.md](assistant.md)                                                       | AI assistant panel behavior                                                                |
| [design-system.md](design-system.md)                                               | Tokens, constraints, visual language                                                       |
| [conventions.md](conventions.md)                                                   | Language rule, naming, project structure                                                   |
| [data-layer-migration.md](data-layer-migration.md)                                 | Fixtures → Prisma/PostgreSQL: done; what a real backend still needs                        |
| [prax-analytics-documentacao-completa.md](prax-analytics-documentacao-completa.md) | Competitor study (Prax Analytics), pt-BR research notes                                    |
| [data-module-plan.md](data-module-plan.md)                                         | Plan: data module (orders, products, customers, DRE, marketing) in 6 stages                |
| [data-module-tasks.md](data-module-tasks.md)                                       | Task checklist for the data module plan — tick as work lands                               |
| [backend-plan.md](backend-plan.md)                                                 | Plan: workspaces, `apps/api` (Express) and `packages/contracts` for web + mobile           |
| [backend-tasks.md](backend-tasks.md)                                               | Task checklist for the backend plan — tick as work lands                                   |
| [ingestion-plan.md](ingestion-plan.md)                                             | Plan: CSV imports through Conexões — the first real-data door                              |
| [saas.md](saas.md)                                                                 | Roles, invitations, the active store, connectors, the engagement per store                 |
| [ingestion-tasks.md](ingestion-tasks.md)                                           | Task checklist for the ingestion plan — tick as work lands                                 |
| [saas-plan.md](saas-plan.md)                                                       | Plan: tenants, roles, invitations, connector catalog, no demo data                         |
| [saas-tasks.md](saas-tasks.md)                                                     | Task checklist for the SaaS plan — tick as work lands                                      |
| [selfservice-plan.md](selfservice-plan.md)                                         | Invitations by e-mail, password reset, import preview and undo — plan and endpoints        |
| [selfservice-tasks.md](selfservice-tasks.md)                                       | Task checklist for the self-service plan — tick as work lands                              |
| [commercial-plan.md](commercial-plan.md)                                           | Subscription via Guru and contract via ZapSign — plan, endpoints, env                      |
| [commercial-tasks.md](commercial-tasks.md)                                         | Task checklist for the commercial plan — tick as work lands                                |
| [connectors-plan.md](connectors-plan.md)                                           | OAuth connectors the Prax way (Nuvemshop, Bling, Google, Meta, Shopify…) — plan and stages |
| [connectors-tasks.md](connectors-tasks.md)                                         | Task checklist for the connectors plan — tick as work lands                                |
| [pilot-plan.md](pilot-plan.md)                                                     | Pilot MVP for a partner client: deploy, Mercado Livre, Amazon, Instagram/Facebook organic  |
| [pilot-tasks.md](pilot-tasks.md)                                                   | Task checklist for the pilot plan — tick as work lands                                     |
| [operations-plan.md](operations-plan.md)                                           | Activity log and store archiving — plan and endpoints                                      |
| [operations-tasks.md](operations-tasks.md)                                         | Task checklist for the operations plan — tick as work lands                                |
| [growth-plan.md](growth-plan.md)                                                   | Meeting 2026-09-22: ROAS per channel, CAC %, connections, Looker-depth Marketing, report   |
| [growth-tasks.md](growth-tasks.md)                                                 | Task checklist for the growth plan — tick as work lands                                    |
| [integrations-plan.md](integrations-plan.md)                                       | Integrations the Bling way: hub, page per integration, modality cards, several accounts    |
| [integrations-tasks.md](integrations-tasks.md)                                     | Task checklist for the integrations plan — tick as work lands                              |
| [m4-plan.md](m4-plan.md)                                                           | M4: real cost and stock, fixes to release the locked screens to the pilots                 |
| [m4-tasks.md](m4-tasks.md)                                                         | Task checklist for the M4 plan — tick as work lands                                        |
| [assistant-plan.md](assistant-plan.md)                                             | Task C: a real assistant answering from read-only tools over the store's data              |
| [assistant-tasks.md](assistant-tasks.md)                                           | Task checklist for the assistant plan — tick as work lands                                 |
| [architecture.md](architecture.md)                                                 | Folder architecture: modules + contracts + cycle ratchet (in force; see CLAUDE.md)         |
| [reference/](reference/)                                                           | The Arko `CLAUDE.md` files the rules derive from, and the Arko Guru/ZapSign guide          |
| [architecture-reference.md](architecture-reference.md)                             | Reference dossier from arko_frontend/arko_backend the architecture is adapted from         |
| [decisions/](decisions/)                                                           | Architecture decision records (one dated note per decision)                                |

There is no demo tenant: every number belongs to a real store, or to the development
seed's "Loja Exemplo". When a
spec and the code disagree, fix one of them in the same change — they must not
drift.
