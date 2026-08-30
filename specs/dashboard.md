# Dashboard (`/`)

Feature: `src/features/dashboard`. Fixtures: `data/dashboard.ts`.
Header: title "Dashboard", subtitle "Visão consolidada de agosto de 2026 · Loja Aurora".

Blocks, in order:

## 1. Headline KPI row

Four KPIs in a `MetricTileGroup` (single bordered container, tiles separated by
dividers; 2 columns up to `lg`, 4 after):

| KPI                    | Value      | Delta  | Direction                              | Fidelity |
| ---------------------- | ---------- | ------ | -------------------------------------- | -------- |
| Faturamento            | R$ 487.300 | +8%    | up (green)                             | A        |
| Margem de contribuição | 19,2%      | -3,4pp | down (red)                             | B        |
| CAC                    | R$ 62      | +21%   | down (red — an increase in CAC is bad) | A        |
| Recompra 90 dias       | 14%        | +1pp   | up (green)                             | A        |

## 2. "Precisa da sua atenção"

Warning-toned block with 3 alert rows, each linking to its origin section:

1. "Margem do SKU AUR-114 ficou negativa" → Dinheiro
2. "CAC do Google Ads acima do limite há 12 dias" → Marketing
3. "78% da receita vem de um único canal" → Gestão

Each row: bold title, one-line explanation, origin section right-aligned.

## 3. "Marco de maturidade"

Highlight-toned block (stronger border). Meta text "2 de 4 critérios";
description explains that completing it unlocks the blocked areas ("Canais
paralelos" and "Tecnologia"). Four criteria cards side by side (responsive
2/4-column grid), each with a progress bar and status:

| Criterion                | Progress | Status       | Note                                   |
| ------------------------ | -------- | ------------ | -------------------------------------- |
| Margem previsível        | 100      | Atingido     | 3 meses consecutivos acima de 18%      |
| CAC menor que 1/3 do LTV | 45       | Não atingido | CAC R$ 62 · meta R$ 41                 |
| Caixa de 90 dias         | 100      | Atingido     | R$ 214.000 em caixa livre              |
| Empresa roda sem o dono  | 30       | Não atingido | 4 processos críticos sem dono definido |

Achieved bars are green (primary); unachieved are orange (warning).

## 4. "Recomendações em aberto"

`RecommendationList` with 4 items (text, deadline, owner) — e.g. "Reajustar
preço dos 9 SKUs com margem abaixo de 10%", "até 05/09", "Marina (Comercial)".

## 5. Revenue and margin chart

Recharts line chart, last 12 months (set/25 → ago/26). Two lines: Faturamento
(left axis, `--chart-1` green) and Margem % (right axis, domain 14–26,
`--chart-2` orange). The margin falls over the last 3 months (22,1 → 20,6 →
19,2). Grid uses `--grid`; tooltip is dark (foreground background), values
formatted via `lib/format`. No dots, no animation.
