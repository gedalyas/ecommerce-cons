# Conexões (`/conexoes`)

Feature: `src/features/connections`. Fixtures: `data/connections.ts`.
Lists the data sources feeding the dashboard, one per row.

## Summary banner

Above the list: "**5 de 7 fontes ativas** · 1 com erro, 1 não conectada".

## Source list

Columns (stacked cards below `md`): Fonte (name + category), Status, última
sincronização, and an action button — "Reconectar" (primary variant when the
status is `error`) or "Conectar".

| Source                | Category          | Status                       | Sync             |
| --------------------- | ----------------- | ---------------------------- | ---------------- |
| Bling                 | ERP               | connected                    | hoje às 03:12    |
| Loja                  | Plataforma        | connected                    | hoje às 03:14    |
| Meta Ads              | Mídia paga        | error (Erro de autenticação) | há 6 dias        |
| Google Ads            | Mídia paga        | connected                    | hoje às 03:20    |
| Google Analytics      | Analytics         | connected                    | hoje às 03:20    |
| Instagram             | Social            | not-connected                | —                |
| Extrato do adquirente | Importação manual | manual                       | enviado em 02/08 |

Status values (`connected` / `error` / `not-connected` / `manual`) map to icon +
color in `statusMeta`; labels are Portuguese.

The Meta Ads error is the thread that ties screens together: the orange dot on
the sidebar's Conexões item, the Marketing banner, the "Aquisição" pillar's
data pendency and the assistant's caveat about estimated numbers all stem from
it.

## Manual import

Below the list, an "Importação manual" block with a dashed upload area
("Arraste a planilha aqui ou selecione um arquivo", .xlsx/.csv up to 10 MB).
Visual only — no upload logic in the prototype.
