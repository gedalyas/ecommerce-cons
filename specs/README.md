# Specs

Product and engineering specifications for E-commerce Insights. Written in
English (developer-facing); every user-visible string quoted here is Portuguese
because that is what ships.

| Spec                                                 | Covers                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| [product-overview.md](product-overview.md)           | What the product is, personas, scope of the prototype              |
| [layout-and-navigation.md](layout-and-navigation.md) | App shell, sidebar, responsive behavior, routes                    |
| [dashboard.md](dashboard.md)                         | The main screen: KPIs, alerts, maturity milestone, chart           |
| [sections.md](sections.md)                           | Money / Marketing / Logistics / Management anatomy and pillar data |
| [kpi-fidelity.md](kpi-fidelity.md)                   | The KPI component and the A/B/C data-fidelity seal                 |
| [connections.md](connections.md)                     | Data sources screen                                                |
| [assistant.md](assistant.md)                         | AI assistant panel behavior                                        |
| [design-system.md](design-system.md)                 | Tokens, constraints, visual language                               |
| [conventions.md](conventions.md)                     | Language rule, naming, project structure                           |
| [data-layer-migration.md](data-layer-migration.md)   | Plan: fixtures → Prisma/PostgreSQL                                 |

The single fictional client is **Loja Aurora**; all numbers are fixtures. When a
spec and the code disagree, fix one of them in the same change — they must not
drift.
