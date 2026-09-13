# Specs

Product and engineering specifications for E-commerce Insights. Written in
English (developer-facing); every user-visible string quoted here is Portuguese
because that is what ships.

| Spec                                                                               | Covers                                                                              |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [product-overview.md](product-overview.md)                                         | What the product is, personas, scope of the prototype                               |
| [layout-and-navigation.md](layout-and-navigation.md)                               | App shell, sidebar, responsive behavior, routes                                     |
| [finance.md](finance.md)                                                           | Dinheiro: Visão com KPIs vivos, DRE gerencial, cadastro de custos                   |
| [analysis.md](analysis.md)                                                         | Métricas: diagnóstico por métrica com veredito, série e árvore de drivers           |
| [influencers.md](influencers.md)                                                   | Influenciadores: parcerias, regras de remuneração, cupons e ROI                     |
| [goals.md](goals.md)                                                               | Metas: realizado × meta com pacing e o planejamento anual (6 entradas, 8 derivadas) |
| [marketing.md](marketing.md)                                                       | Marketing: visão com KPIs vivos, resumo por canal e funil, campanhas, descontos     |
| [customers.md](customers.md)                                                       | Clientes: segmentação RFM com filtros, recompra, LTV e CAC                          |
| [products.md](products.md)                                                         | Produtos: resumo, curva ABC, estoque por variante                                   |
| [orders.md](orders.md)                                                             | Pedidos: resumo, aprovação por status/método/gateway, lista transacional            |
| [dashboard.md](dashboard.md)                                                       | The main screen: KPIs, alerts, maturity milestone, chart                            |
| [sections.md](sections.md)                                                         | Money / Marketing / Logistics / Management anatomy and pillar data                  |
| [kpi-fidelity.md](kpi-fidelity.md)                                                 | The KPI component and the A/B/C data-fidelity seal                                  |
| [connections.md](connections.md)                                                   | Data sources screen                                                                 |
| [assistant.md](assistant.md)                                                       | AI assistant panel behavior                                                         |
| [design-system.md](design-system.md)                                               | Tokens, constraints, visual language                                                |
| [conventions.md](conventions.md)                                                   | Language rule, naming, project structure                                            |
| [data-layer-migration.md](data-layer-migration.md)                                 | Fixtures → Prisma/PostgreSQL: done; what a real backend still needs                 |
| [prax-analytics-documentacao-completa.md](prax-analytics-documentacao-completa.md) | Competitor study (Prax Analytics), pt-BR research notes                             |
| [data-module-plan.md](data-module-plan.md)                                         | Plan: data module (orders, products, customers, DRE, marketing) in 6 stages         |
| [data-module-tasks.md](data-module-tasks.md)                                       | Task checklist for the data module plan — tick as work lands                        |
| [architecture.md](architecture.md)                                                 | Folder architecture: modules + contracts + cycle ratchet (in force)                 |
| [reference/](reference/)                                                           | The Arko backend and frontend `CLAUDE.md` files this repo's rules derive from       |
| [architecture-reference.md](architecture-reference.md)                             | Reference dossier from arko_frontend/arko_backend the architecture is adapted from  |
| [decisions/](decisions/)                                                           | Architecture decision records (one dated note per decision)                         |

The single fictional client is **Loja Aurora**; all numbers come from the seed. When a
spec and the code disagree, fix one of them in the same change — they must not
drift.
