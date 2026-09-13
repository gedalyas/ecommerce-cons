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
sincronização, and an action. The action depends on the connector: **"Conectar"** when the
API has a provider registered for it (`availability` flipped to `oauth` — the app
credentials are in the env), **"Solicitar conexão"** otherwise, "Importar CSV" for the manual
source. A connected row shows "Sincronizar", "Desconectar" and, for connectors with
settings (ERP status mapping, Google/Meta/TikTok account or property), "Configurar".

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

## Connecting a platform

"Conectar" opens a dialog (with the store domain when the pattern is domain + OAuth —
Nuvemshop, Shopify), then `POST /connectors/:key/authorize` answers the platform's
authorization URL and the browser goes there. The platform redirects to the public
`GET /connectors/:key/callback?code&state`; the signed `state` (JWT, 10 minutes) carries the
store, the user and the connector, the provider exchanges the code, the credentials are
sealed (AES-256-GCM, `CREDENTIALS_KEY`) into `connection`, the data source becomes
`CONNECTED`, any open request is closed and a `connector.backfill` job is queued. The browser
lands back on `/conexoes?conectado=<key>` ("X conectado. O histórico está sendo importado").

Under the row a **stepper** follows `Connection.stage`: Fonte autorizada → Importando dados
→ Processando análises → Pronto para usar (an error lands on the import step with the
message). The worker (`apps/api/src/worker.ts`, pg-boss on the same Postgres) runs the
backfill (the last `CONNECTOR_BACKFILL_MONTHS`, default 18), then `connector.sync` every
hour for every ready connection; providers keep a cursor and re-read a small overlap.
Every pulled row is stored as it came in `raw_record`; orders, ad spend and traffic are then
written through the same write service the CSV import uses, so the dashboards do not know
the source. Providers today: Nuvemshop, Bling (with the status mapping), Google Ads, GA4,
Meta Ads, Shopify, TikTok Ads — one sheet each in `docs/apis/`, plan in
`connectors-plan.md`.

The shell shows "Conecte uma fonte de dados da loja" (`GET /data-readiness`) until the store
has a connection, an import or orders.

## Manual import

Below the list, the "Importação manual" block imports CSV files of orders, ad spend or
traffic into the fact tables — see [imports.md](imports.md). A successful import stamps the
matching data source (and turns a `NOT_CONNECTED` / `ERROR` source into `MANUAL`), so the
summary above and the sidebar dot follow.
