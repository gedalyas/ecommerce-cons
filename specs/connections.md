# Conexões (`/conexoes`)

Module: `connections` (web + API). Route loader calls `getConnectionsScreen`; the payload is
`ConnectionsScreen` (`connectors` — the catalog with the store's status — and `summary`).
Every store gets one `data_source` row per connector when it is created (`provisionStore`).
Lists the connectors, one per row.

## Summary banner

Above the list: "**5 de 7 fontes ativas** · 1 com erro, 1 não conectada" —
counts derived in `connectionsSummary.ts` (connected and manual count as
active; the detail agrees in number and disappears when nothing is wrong).

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

Status is the Prisma enum `DataSourceStatus` (`CONNECTED` / `ERROR` /
`NOT_CONNECTED` / `MANUAL`), mapped to icon + color in `statusMeta`; labels
are Portuguese. The sync column is derived from `lastSyncedAt` and the demo
clock by `syncLabel.ts`: "hoje às 03:12" on the same day, "ontem", "há N dias",
"enviado em 02/08" for a manual import, "—" when never synced.

`getConnectionsHealth` (any source in `ERROR`) feeds the sidebar's orange dot
through the root route loader; the Marketing banner reads the same sources
from the marketing service (`staleSources`).

The Meta Ads error is the thread that ties screens together: the orange dot on
the sidebar's Conexões item, the Marketing banner, the "Aquisição" pillar's
data pendency and the assistant's caveat about estimated numbers all stem from
it.

## Manual import

Below the list, the "Importação manual" block imports CSV files of orders, ad spend or
traffic into the fact tables — see [imports.md](imports.md). A successful import stamps the
matching data source (and turns a `NOT_CONNECTED` / `ERROR` source into `MANUAL`), so the
summary above and the sidebar dot follow.
