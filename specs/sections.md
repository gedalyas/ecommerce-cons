# Sections: Dinheiro, Marketing, Logística, Gestão

All four share the same anatomy, rendered by the `SectionPage` pattern:
`PageHeader` + optional alert banner + a stack of `PillarCard`s. Dinheiro
adds a period/channel controls row and tabs (Visão · DRE · Custos) — see
`finance.md`; its Visão tab renders the pillars below with four KPIs read
from the live DRE.

## PillarCard anatomy

- Header: pillar title + `StatusBadge`.
- KPI grid (`MetricTileGroup`, 2–4 KPIs, borderless inside the card).
- "Recomendações em aberto" list (text, deadline, owner); when empty, a hint
  sentence is shown instead.
- Optional footer "Pendências de dado" with an orange left border, listing
  missing data.

Pillar status values (type `PillarStatus`, labels in `StatusBadge`):

| Value         | Label        | Rendering                  |
| ------------- | ------------ | -------------------------- |
| `done`        | Concluído    | outline badge, muted title |
| `in-progress` | Em andamento | warning-toned badge        |
| `not-started` | Não iniciado | muted badge                |
| `blocked`     | Bloqueado    | muted badge + lock icon    |

Blocked cards render no KPIs — only the message "Disponível após o marco de
maturidade." with a "ver o que falta" link to `/` (the dashboard, where the
milestone block lives).

## Pillars per section (seeded copy, read from `section` / `pillar`)

| Section   | Pillar                | Status      | Notes                                    |
| --------- | --------------------- | ----------- | ---------------------------------------- |
| Dinheiro  | Organização           | in-progress | pending: acquirer statement for August   |
| Dinheiro  | Custos e taxas        | done        |                                          |
| Marketing | Conversão             | done        |                                          |
| Marketing | Aquisição             | in-progress | pending: Meta Ads auth error since 20/08 |
| Marketing | Presença e criativos  | in-progress | pending: Instagram not connected         |
| Marketing | Retenção              | not-started | pending: no e-mail tool integration      |
| Marketing | Canais paralelos      | blocked     |                                          |
| Logística | Estoque e fulfillment | not-started | pending: stale physical inventory        |
| Logística | Frete e entrega       | not-started |                                          |
| Logística | SAC e pós-venda       | not-started | pending: support tool not integrated     |
| Gestão    | Blindagem             | not-started |                                          |
| Gestão    | Delegação             | not-started | pending: process mapping incomplete      |
| Gestão    | Tecnologia            | blocked     |                                          |

## Marketing data tabs

Since Stage 6 the Marketing route has `?aba=visao|resumo|campanhas|descontos`.
Visão is the pillar page described here, with the Conversão and Aquisição
KPIs replaced by live values; the other tabs are specified in
[marketing.md](marketing.md).

## Marketing banner

The Marketing screen shows an orange `AlertBanner` above the pillars:
"Meta Ads não sincroniza há 6 dias — os dados de aquisição podem estar
desatualizados." with an "Ir para Conexões" link.
