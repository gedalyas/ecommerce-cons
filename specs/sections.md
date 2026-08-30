# Sections: Dinheiro, Marketing, Logística, Gestão

All four share the same anatomy, rendered by the `SectionPage` pattern:
`PageHeader` + optional alert banner + a stack of `PillarCard`s.

## PillarCard anatomy

- Header: pillar title + `StatusBadge`.
- KPI grid (`MetricTileGroup`, 2–4 KPIs, borderless inside the card).
- Optional feature-specific extra block (only "Presença e criativos" uses one).
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

## Pillars per section (fixtures)

| Section   | Pillar                | Status      | Notes                                                        |
| --------- | --------------------- | ----------- | ------------------------------------------------------------ |
| Dinheiro  | Organização           | in-progress | pending: acquirer statement for August                       |
| Dinheiro  | Custos e taxas        | done        |                                                              |
| Marketing | Conversão             | done        |                                                              |
| Marketing | Aquisição             | in-progress | pending: Meta Ads auth error since 20/08                     |
| Marketing | Presença e criativos  | in-progress | extra: `creative-presence`; pending: Instagram not connected |
| Marketing | Retenção              | not-started | pending: no e-mail tool integration                          |
| Marketing | Canais paralelos      | blocked     |                                                              |
| Logística | Estoque e fulfillment | not-started | pending: stale physical inventory                            |
| Logística | Frete e entrega       | not-started |                                                              |
| Logística | SAC e pós-venda       | not-started | pending: support tool not integrated                         |
| Gestão    | Blindagem             | not-started |                                                              |
| Gestão    | Delegação             | not-started | pending: process mapping incomplete                          |
| Gestão    | Tecnologia            | blocked     |                                                              |

## Marketing banner

The Marketing screen shows an orange `AlertBanner` above the pillars:
"Meta Ads não sincroniza há 6 dias — os dados de aquisição podem estar
desatualizados." with an "Ir para Conexões" link.

## "Presença e criativos" extra (`CreativePresence`)

Feature-owned block rendered inside the pillar via `renderExtra` when
`pillar.extra === "creative-presence"`. Four sub-blocks:

1. **Identidade da marca** — color palette swatches, typography sample,
   consistency verdict ("Inconsistente", 68%, fidelity C) with a checklist.
2. **Feed do Instagram** — @lojaaurora profile stats (18.470 followers, 284
   posts, 3,1% engagement, fidelity B) and a 3×3 mock feed grid.
3. **Criativos em veiculação** — creative list with CTR, CPA and a status
   badge: Escalando / Estável / Fadigando.
4. **Landing pages** — table (cards below `md`) with visits, conversion and a
   fidelity seal; negative conversions render in red.
