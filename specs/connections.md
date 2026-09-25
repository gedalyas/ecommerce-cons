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

The catalog is rendered as numbered groups in the order a new store should follow
(`connectorKindGuide`, Bling's niche names: 1. ERP → 2. Plataforma de e-commerce → 3.
Marketplace → 4. Social commerce → 5. Anúncios → 6. Redes sociais → 7. Analytics → 8. Planilha).
Each row carries the platform logo (`ConnectorLogo`: Simple Icons paths drawn in `currentColor`,
a monogram when the brand is not in the open set). Catalog since 2026-09-23: Bling, Tiny (Olist),
Omie · Shopify, Nuvemshop, VTEX · Mercado Livre, Amazon, Shopee, Magalu · TikTok Shop · Meta Ads,
Google Ads, TikTok Ads, Mercado Ads, Amazon Ads, Shopee Ads · Instagram e Facebook · Google
Analytics 4 · Planilha, each with a one-line hint; empty groups are
hidden. Each connector declares the **data kinds it can provide** (`provides`, closed set
`dataKinds` in `contracts/connectors`: Vendas · Produtos · Estoque · Clientes · Investimento em
anúncios · Tráfego do site · Redes sociais). **Vendas only from an ERP or the spreadsheet**
(`growth-plan.md`, 2026-09-22): storefronts and marketplaces provide products, stock and
customers; ad platforms provide investment, never sales. Columns (stacked cards below `md`,
two bands below `2xl`): Fonte (name + description + "Fornece: …"),
Status, última sincronização, and an action. The action depends on the connector: **"Conectar"** when the
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

## Connector drawer

"Detalhes" on each row opens a sheet (`ConnectorDrawer`) with three tabs: **Conectar** (description,
requirements and the same action as the row), **O que puxa** (each data kind the platform
provides and who holds it in this store — "Vem desta integração", "Hoje vem de Planilha", "Ainda
sem fonte", from `kindOwnership` over `ConnectionsScreen.owners`) and **Ajuda** (the step-by-step
guide in `contracts/connectors/connectorGuides.ts`, pt-BR, and the marketplace modalities:
Amazon MFN / FBA Classic / FBA Onsite, Mercado Livre envio próprio / Full). Platforms not built
yet say so and point to "Solicitar conexão".

## Data owners

The exclusive kinds — vendas, produtos, estoque, clientes, tráfego do site — have **one owner
per store** (`store_data_source`, unique per client and kind); investment and social are shared
by every platform. A source claims the kinds nobody owns when it first syncs or imports
(`claimDataKinds`, pure `unclaimedKinds`); a sync writes a kind only when the connector
provides it and no other source owns it (`providesKind` + `conflictingOwner`), and every order
records its `source`. A sync that finds a kind it provides owned by another source still
finishes, then flags the connection `ERROR` with `ownerConflictMessage` ("A fonte de vendas desta
loja é Planilha…") so Conexões explains why nothing arrives. The spreadsheet claims only the
kind it imported, after at least one row was written; undoing its last active import of that
kind releases it. Disconnecting releases a connector's kinds. **Choosing another owner** (`PUT /data-sources` { kind, source | null }, area edit of the
kind; from "O que puxa" in the drawer: "Usar esta integração" / "Deixar de usar" with a
confirmation — `switchNotice`) **cuts by date** (Davi, 2026-09-23): the new owner counts from
today (`store_data_source.since`), the previous one keeps the days before; for sales the
previous source's orders from today on are deleted and the sync/import of the new owner skips
orders placed before `since` (`ordersSince`). Products and customers without an owner are
"Gerado no sistema, a partir dos pedidos"; releasing them returns to that. Every change records
`DATA_SOURCE_CHANGED` ("Vendas passam a vir de Bling a partir de 23/09/2026", or "com todo o histórico"
when nobody held the kind). Only a healthy connection (importing or ready) or the spreadsheet can be
chosen; choosing the current owner is a no-op; 10 switches / 15 min. The cut applies to sales
(orders) and site traffic (days). Releasing a kind that has a cut (disconnect, last import undone,
"Deixar de usar") keeps the row as `system` so the cut survives and nobody writes it until the store
chooses again; without a cut the row is deleted and the next source claims it as before.

Known limits (2026-09-23): a sync already running when the owner switches may still write one
chunk of the previous source's orders (the owner is re-checked per write, not per row); undoing an
older CSV import after a switch can restore orders the switch removed; a new sales provider must
fetch from the start of the day when its cursor is empty (Bling does), because the switch nulls the
new owner's cursor to re-fetch today.

## Connecting a platform

"Conectar" opens a dialog (with the store domain when the pattern is domain + OAuth —
Nuvemshop, Shopify), then `POST /connectors/:key/authorize` answers the platform's
authorization URL and the browser goes there. The platform redirects to the public
`GET /connectors/:key/callback?code&state`; the signed `state` (JWT, 10 minutes) carries the
store, the user and the connector, the provider exchanges the code, the credentials are
sealed (AES-256-GCM, `CREDENTIALS_KEY`) into `connection`, the data source becomes
`CONNECTED`, any open request is closed and a `connector.backfill` job is queued. The browser
lands back on `/conexoes?conectado=<key>` ("X conectado. O histórico está sendo importado").
When the platform returned more than one account, ad account, property or Page, the
connection stays `AUTHORIZED` with `needsAccount` and no backfill is queued: the browser lands
on `/conexoes?conectado=<key>&escolher=true` with the picker already open ("Escolha a conta ·
X"), the row's primary action is "Escolher conta", and saving the choice queues the backfill.
The connect dialog lists the connector's prerequisites (`requirements` in the catalog) and,
for domain + OAuth platforms, the address placeholder and where to find it (`domainHint`).
A failed callback lands on `/conexoes?erro=<key>&motivo=cancelado|estado|troca`
(`connectorErrorReasonLabel`: the user cancelled or lacks permission on the platform / the
10-minute state expired / the code exchange was refused) with a "Tentar de novo" button that
reopens the connect dialog.

When a sync fails the connection goes to `ERROR` and, on the first failure only (previous
stage not ERROR), every CLIENT user of the store gets the e-mail "X parou de sincronizar"
(`connectionMail.ts`) with the reason and a link to Conexões. The row then shows
**"Reconectar"** as its primary action: the same authorization flow, but a connection that
already synced keeps its history and its chosen account (`reconnectSettings`) and queues an
incremental sync instead of a backfill.

Under the row a **stepper** follows `Connection.stage`: Fonte autorizada → Importando dados
→ Processando análises → Pronto para usar (an error lands on the import step with the
message). The worker (`apps/api/src/worker.ts`, pg-boss on the same Postgres) runs the
backfill (the last `CONNECTOR_BACKFILL_MONTHS`, default 18), then `connector.sync` every
hour for every ready connection; providers keep a cursor and re-read a small overlap.
Every pulled row is stored as it came in `raw_record`; orders, ad spend and traffic are then
written through the same write service the CSV import uses, so the dashboards do not know
the source. Providers today: Nuvemshop, Bling (with the status mapping), Google Ads, GA4,
Meta Ads, Shopify, TikTok Ads — one sheet each in `docs/apis/`, plan in
`connectors-plan.md`. Ad spend is replaced per (platform, account, day): a connector row replaces its account
and any spreadsheet row of that day, a spreadsheet row (no account) the whole platform-day, so two
accounts of one platform never erase each other and a day is never counted twice. Keywords and
the GA4 detail (pages with the query string dropped, items by SKU, audience, regions) go through
`writeKeywords` / `writeTrafficDetail`, replaced per day.

The shell shows "Conecte uma fonte de dados da loja" (`GET /data-readiness`) until the store
has a connection, an import or orders.

## Manual import

Below the list, the "Importação manual" block imports CSV files of orders, ad spend or
traffic into the fact tables — see [imports.md](imports.md). A successful import stamps the
matching data source (and turns a `NOT_CONNECTED` / `ERROR` source into `MANUAL`), so the
summary above and the sidebar dot follow.
