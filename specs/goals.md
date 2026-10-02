# Metas (`/metas`)

Module: `src/modules/goals`. The route validates `?aba=resumo|planejamento`, `acumulado`
(boolean) and `ano` (null = the current year); defaults are stripped from the URL. `GoalsScreen` is a union
on `aba`. Sidebar entry under "Dados". The `TabBar` reads **Resumo · Planejamento**.

## Model

One row per client, year and month (`goal` table, unique on the three). The user types **six
drivers**: Total vendido (R$) · Ticket médio (R$) · Taxa de conversão (%) · Investimento em
tráfego pago (R$) · Outros investimentos em marketing (R$) · % Recompra. Everything else is
derived by `goalDerivations.ts` (tested):

| Derived                         | Formula                                                   |
| ------------------------------- | --------------------------------------------------------- |
| Pedidos                         | Total vendido ÷ Ticket médio                              |
| Sessões                         | Pedidos ÷ Taxa de conversão                               |
| ROAS                            | Total vendido ÷ Tráfego pago                              |
| Investimento total em marketing | Tráfego pago + Outros                                     |
| ROI                             | (Total vendido − Investimento total) ÷ Investimento total |
| CPA                             | Investimento total ÷ Pedidos                              |
| Novos clientes                  | Pedidos × (1 − % Recompra)                                |
| CAC                             | Investimento total ÷ Total vendido × 100 (%)              |
| Custo / Receita por sessão      | Investimento total ÷ Sessões · Total vendido ÷ Sessões    |

The seed loads Loja Aurora's 2026 plan (`goalsFixture.ts`).

## Resumo (`?aba=resumo`)

Window = the global period, or from 1 January of the period's last year to its end when
"Acumulado no ano" is on. Fifteen cards in four groups — **Vendas** (Total vendido, Número de
pedidos, Ticket médio), **Marketing** (Investimento em tráfego pago, ROAS, Investimento total
em marketing, ROI, CPA), **Tráfego e-commerce** (Sessões, Taxa de conversão, Custo por sessão,
Receita por sessão), **Recompra** (% Recompra, Novos clientes, CAC). Each card shows:

- **Realizado** — the actual over the window: orders (revenue, paid orders, repeat orders),
  traffic sessions, ad spend + platform fee, new customers, and the "Vendas e marketing" cost
  rules accrued over the window; ratios recomputed from those sums.
- **Meta** — the monthly goals prorated by the days of each month inside the window
  (`prorateGoals`): additive drivers are summed by share, ratios rebuilt from the sums.
- **Diferença** — Realizado − Meta, green when it is good for the metric, orange otherwise.
- **Caminho para a meta** — progress bar of Realizado ÷ Meta with a marker at the pacing:
  the elapsed share of the window for additive metrics, 100% for ratios. The bar turns orange
  when the store is behind the marker (or, for "lower is better" metrics, above the goal).

When no month of the window has a goal, a warning block links to Planejamento.

## Planejamento (`?aba=planejamento`)

A grid for the selected year (`SegmentedControl` with last year, this year and next year —
`planYearsAround`, relative to the API clock): six editable rows × 12
months, then the eight derived rows (read-only, "—" for an empty month). "Salvar plano"
replaces the whole year (months with every driver at zero are dropped); "Preencher com o
histórico (+10%)" fills the grid from the last twelve full months (`trailingTwelveMonths`:
each month of the plan takes its latest occurrence) plus 10% (months
without history take the average of the ones that have it) — the user still has to save.
Leaving with unsaved changes opens the confirm dialog (`useBlocker`).

Server functions: `getGoalsScreen` (GET), `saveGoalPlan` (POST), `suggestGoalPlan` (GET).
