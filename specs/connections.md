# Integrações (`/integracoes`)

Module: `connections` (web + API). Route loader calls `getConnectionsScreen`; the payload is
`ConnectionsScreen` (`connectors` — the catalog with the store's status — and `summary`).
Every store gets one `data_source` row per connector when it is created (`provisionStore`).
Redesigned after Bling's Central de Extensões (`integrations-plan.md`, 2026-10-01); the old
`/conexoes` redirects here keeping its query (OAuth links, e-mails).

## Layout

Title "Integrações", the outcome banners (connected / failed), the summary banner, then three
tabs in the URL (`aba`, `integrationsSearchSchema` in `contracts/connections`; defaults stripped):

- **Integrações** (`integracoes`, default) — the catalog. A wide search ("Buscar por plataforma")
  and a category menu (`categoria`: **Gestão (ERP)** · **Vendas online** · **Marketing** —
  `connectorCategories.ts`; the spreadsheet has no category, it lives in Planilhas). A category
  shows its title and hint, a **Recomendados** block (`recommendedConnectors`: Bling; Mercado
  Livre, Shopify, Nuvemshop; Meta Ads, Google Ads, GA4) and one section per connector kind, in the
  guide's order, each a grid of cards. A card (`ConnectorCard`) is the logo, the name, a two-line
  description and badges — **Conectada** / **Com erro** / **Por planilha** (`cardStateOf`, what Bling does not show)
  and **Recomendado**; the whole card is the button and opens the integration page. Typing in
  the search (`busca`) opens a suggestions panel under the field (`searchSuggestions`, up to six:
  logo, name, "Em <tipo>"; ↑/↓ choose, Enter opens the chosen one or just closes the panel, Esc
  closes; footer "Não encontrou o que procurava? Conte para sua consultoria qual plataforma você
  usa." — there is no endpoint for a platform outside the catalog) and replaces the category with the matches grouped by category
  (`searchConnectors`: name, description or kind, accents ignored); nothing found says so.
  Choosing a category clears the search. The menu is a side column when the content is at
  least 48rem wide and a row of chips otherwise (container queries, so the assistant panel
  is accounted for); the grid goes 1 → 2 → 3 columns the same way.
- **Minhas integrações (N)** (`minhas`) — the store's integrations as cards, grouped by
  category (2 per row when the content is wide enough), one card per integration
  (`integrationsOf`): logo, the integration's name, the platform and the account, its status
  (`integrationStatusOf`: **Conectada** · **Sincronizando** · **Erro** · **Escolha a conta**;
  "Por planilha" for platforms fed by a spreadsheet) and its own last sync. The card opens the
  integration page on that integration; the ⋮ menu (for whoever manages it) has Testar and
  Configurar (to those sections), Sincronizar and **Desconectar** in red behind a confirmation
  ("Os dados já importados continuam nos painéis"). Sources whose platform has no live
  integration any more fall in the **Desconectadas (N)** accordion, dimmed (`splitByLink`).
  Empty: "A loja ainda não tem integrações…" + "Ver integrações". OAuth returns land here.
- **Planilhas** (`planilhas`) — the manual import (below).

## Marketplace modalities (2026-10-01)

Like Bling, each modality is its own integration (`decisions/2026-10-01-connector-modalities-as-integrations.md`):
**Mercado Livre** brings own-shipping orders and **Mercado Livre Full** the Full ones; **Amazon**
brings MFN and **Amazon FBA Classic** AFN; **Amazon FBA Onsite** is "Solicitar conexão" (the
Orders API cannot tell it apart yet). Each connects, syncs and is configured on its own, with
the platform's app and callback; its logo is the platform's. Modalities of one platform share
the one-source-per-kind rule ("Vem de Mercado Livre, da mesma plataforma").

## Accounts and integrations (2026-10-01)

A **connector account** (`connector_account`) is the seller's login on a platform — one per store,
platform family and external id — and owns the sealed credentials. An **integration**
(`connection`) is a connector key (or a marketplace modality) on an account, with its own name,
stage, cursor and settings. Mercado Livre and Mercado Livre Full of the same seller share one
account and one token; the worker renews the account's token with a compare-and-set
(`refreshRace.ts`). Orders record the integration that wrote them (`sales_order.connection_id`).
See `decisions/2026-10-01-connector-account-apart-from-integration.md`.

Endpoints per integration (each checks the store and the connector's area; another store's or
another connector's id answers 404): `POST /connectors/:key/connections/:id/sync`,
`POST …/:id/test`, `GET|PUT …/:id/settings`, `DELETE /connectors/:key/connections/:id` (removes
that integration and its account when nothing else uses it; the data kinds are released and the
source shows "não conectado" only when no integration of the key is left). `POST
/connectors/:key/authorize` takes `{ domain, name, connectionId }`: the signed state carries the
integration to reconnect or the name of a new one; the same seller reuses its account, and an
account that already holds that connector under another integration fails with
`motivo=duplicada`. Platforms that report no seller id (Bling, and the ad platforms' fallbacks)
get one account per login (`accountExternalId`). `POST /connectors/:key/connections
{ accountId, name }` adds an integration to an account the store already has, without a new
login (Mercado Livre Full on the "ML Matriz" account): 404 for an account of another platform or
store, 409 when the account already has it. `ConnectionsScreen` lists every integration per
connector (`connections`, oldest first; `connection` is the first) and the store's `accounts`.
Audit lines name the integration: "Conectou Mercado Livre Full (Full Matriz)".

## Several integrations of one platform (screens, 2026-10-01)

Clicking the card of a platform the store already uses opens Bling's modal, "Você já tem
integrações de X": each integration (name, account, stage) with **Editar**, and **Configurar
nova** for whoever manages a platform the API can authorize. The integration page reads `conta`
(which integration; the first by default) and `nova` from the URL: with more than one integration
a selector sits under the header next to **Configurar nova**, and every section works on the
chosen one. **Nova integração** asks for the name (required, up to 60) and the account: an
account the store already has for that platform (the default when one is free; accounts that
already hold this connector are disabled) creates it with "Criar integração" and no new login, or
"Conectar outra conta" shows the usual onboarding and authorizes with the name. Minhas
integrações shows one card per integration (below).

## Summary banner

Above the list: "**5 de 7 fontes ativas** · 1 com erro, 1 não conectada" —
counts derived in `connectionsSummary.ts` (connected and manual count as
active; the detail agrees in number and disappears when nothing is wrong).

## Connector kinds

Connectors are grouped by kind in the order a new store should follow
(`connectorKindGuide`: ERP → Plataforma de e-commerce → Marketplace → Social commerce → Anúncios
→ Redes sociais → Analytics).
Cards carry the platform logo (`ConnectorLogo`: Simple Icons paths drawn in `currentColor`, a
monogram when the brand is not in the open set; a modality uses its platform's). Catalog since
2026-09-23: Bling, Tiny (Olist), Omie · Shopify, Nuvemshop, VTEX · Mercado Livre, Mercado Livre
Full, Amazon, Amazon FBA Classic, Amazon FBA Onsite, Shopee, Magalu · TikTok Shop · Meta Ads,
Google Ads, TikTok Ads, Mercado Ads, Amazon Ads, Shopee Ads · Instagram e Facebook · Google
Analytics 4 · Planilha, each with a one-line hint; empty groups are hidden. Each connector
declares the **data kinds it can provide** (`provides`, closed set `dataKinds` in
`contracts/connectors`: Vendas · Produtos · Estoque · Clientes · Investimento em anúncios ·
Tráfego do site · Redes sociais). **Vendas only from an ERP or the spreadsheet**
(`growth-plan.md`, 2026-09-22): storefronts and marketplaces provide products, stock and
customers; ad platforms provide investment, never sales. A connector is connectable
("Conectar com X") when the API has a provider registered for it (`availability` flipped to
`oauth` — the app credentials are in the env), "Solicitar conexão" otherwise, and the spreadsheet
points to Planilhas.

Status is the Prisma enum `DataSourceStatus` (`CONNECTED` / `ERROR` /
`NOT_CONNECTED` / `MANUAL`) per connector key; an integration's own state comes from its
stage (`integrationStatusOf`). The last sync is derived from `lastSyncedAt` and the demo
clock by `syncLabel.ts`: "hoje às 03:12" on the same day, "ontem", "há N dias",
"enviado em 02/08" for a manual import, "—" when never synced.

`getConnectionsHealth` (any source in `ERROR`) feeds the sidebar's orange dot
through the root route loader; the Marketing banner reads the same sources
from the marketing service (`staleSources`).

The Meta Ads error is the thread that ties screens together: the orange dot on
the sidebar's Integrações item, the Marketing banner, the "Aquisição" pillar's
data pendency and the assistant's caveat about estimated numbers all stem from
it.

## Integration page (`/integracoes/$chave`)

A catalog card or a card on Minhas integrações opens the integration's own page (`IntegrationPage`): a
"‹ Integrações" link back, the big logo, name, description and the state badge, then four
sections (`aba`: `conexao` default · `dados` · `configuracoes` · `ajuda`) as a side menu when the
content is at least 48rem wide and a row of chips otherwise. An unknown key says "Integração não
encontrada" with a link to the catalog.

- **Conexão** — not connected and the API has the provider: "Fique tranquilo: … só lê os dados",
  the guide's steps in numbered green circles, the prerequisites, the store address field
  (marked *) for domain + OAuth platforms and a full-width **"Conectar com X"** that starts the
  authorization. Not built yet: the steps and "Solicitar conexão" (or the request's status).
  Spreadsheet: a link to Planilhas. Connected: the account, the stage stepper (with the last
  sync), the actions (Reconectar, Configurar → Configurações, Sincronizar, Desconectar) and
  **Testar**. People without the area see a sentence instead of the button.
- **O que puxa** — every data kind, ✓ when the platform provides it and struck through when it
  does not; provided kinds show who holds them in this store ("Vem desta integração", "Hoje vem
  de Planilha", "Ainda sem fonte", from `kindOwnership` over `ConnectionsScreen.owners`) and the
  "Usar esta integração" / "Deixar de usar" switch (below).
- **Configurações** — the account or property and the ERP status mapping inline, with one
  **Salvar** fixed at the foot ("Alterações não salvas"; leaving with unsaved changes asks to
  discard, `settingsChanged`). A connection still waiting for its account counts as changed so the
  first account can be saved. Without a connection, without the area, or for a storefront it says
  why there is nothing to set.
- **Ajuda** — "Manual de integração" (the step-by-step guide in
  `contracts/connectors/connectorGuides.ts`) and the marketplace modalities (Amazon MFN / FBA
  Classic / FBA Onsite, Mercado Livre envio próprio / Full).

Every section but Ajuda ends with the box "Tem dúvidas sobre essa integração?" and "Ver manual".
The settings dialog stays for the account choice after an OAuth return (`escolher=true`) and the
"Configurar" in the Conexão section.

## Data owners

The exclusive kinds — vendas, produtos, estoque, clientes, tráfego do site — have **one owner
per store** (`store_data_source`, unique per client and kind); investment and social are shared
by every platform. A source claims the kinds nobody owns when it first syncs or imports
(`claimDataKinds`, pure `unclaimedKinds`); a sync writes a kind only when the connector
provides it and no other source owns it (`providesKind` + `conflictingOwner`), and every order
records its `source`. A sync that finds **every** kind it provides owned by another source still
finishes, then flags the connection `ERROR` with `ownerConflictMessage` ("A fonte de produtos desta
loja é Mercado Livre Full…", `blockedSyncKind`) so Integrações explains why nothing arrives. A
connection that writes at least one kind stays active even when others come from elsewhere — Bling
owning sales next to Mercado Livre Full owning products and stock — and "O que puxa" says where
each kind comes from (`kindOwnership`). The spreadsheet claims only the
kind it imported, after at least one row was written; undoing its last active import of that
kind releases it. Disconnecting releases a connector's kinds. **Choosing another owner** (`PUT /data-sources` { kind, source | null }, area edit of the
kind; from "O que puxa" on the integration page: "Usar esta integração" / "Deixar de usar" with a
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
lands back on `/integracoes?aba=minhas&conectado=<key>` ("X conectado. O histórico está sendo importado").
When the platform returned more than one account, ad account, property or Page, the
connection stays `AUTHORIZED` with `needsAccount` and no backfill is queued: the browser lands
on `/integracoes?aba=minhas&conectado=<key>&escolher=true` with the picker already open ("Escolha a conta ·
X"), the row's primary action is "Escolher conta", and saving the choice queues the backfill.
The connect dialog lists the connector's prerequisites (`requirements` in the catalog) and,
for domain + OAuth platforms, the address placeholder and where to find it (`domainHint`).
A failed callback lands on `/integracoes?erro=<key>&motivo=cancelado|estado|troca`
(`connectorErrorReasonLabel`: the user cancelled or lacks permission on the platform / the
10-minute state expired / the code exchange was refused) with a "Tentar de novo" button that
reopens the connect dialog.

When a sync fails the connection goes to `ERROR` and, on the first failure only (previous
stage not ERROR), every CLIENT user of the store gets the e-mail "X parou de sincronizar"
(`connectionMail.ts`) with the reason and a link to Integrações. The row then shows
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
`connectors-plan.md`.

**Testar** (integration page › Conexão, for whoever manages the connector; 20 tests / 15 min per store and
connector): `POST /connectors/:key/connections/:id/test` uses the stored token as it is — it never renews it, so it
cannot race the worker's refresh; an expired token skips the probe ("unverified") — and calls the
platform's cheapest authenticated endpoint (the provider's `test`, or `describeSettings` checking that
the chosen account is still visible). It counts the `raw_record` rows fetched in the last 7 days per
kind and returns a `ConnectionCheck` with a pure verdict (`connectionVerdict`): "Tudo certo — os
dados estão chegando", "Conectado, mas nenhum dado chegou nos últimos 7 dias", "A plataforma não
respondeu agora" (network failure) or "Acesso recusado — reconecte a integração" (a fixed message:
the platform's or internal error text only goes to the server log). Nothing is stored but the
`CONNECTION_TESTED` activity. Ad spend is replaced per (platform, account, day): a connector row replaces its account
and any spreadsheet row of that day, a spreadsheet row (no account) the whole platform-day, so two
accounts of one platform never erase each other and a day is never counted twice. Keywords and
the GA4 detail (pages with the query string dropped, items by SKU, audience, regions) go through
`writeKeywords` / `writeTrafficDetail`, replaced per day.

The shell shows "Conecte uma fonte de dados da loja" (`GET /data-readiness`) until the store
has a connection, an import or orders.

## Manual import

The **Planilhas** tab holds the "Importação manual" block, which imports CSV files of orders, ad spend or
traffic into the fact tables — see [imports.md](imports.md). A successful import stamps the
matching data source (and turns a `NOT_CONNECTED` / `ERROR` source into `MANUAL`), so the
summary above and the sidebar dot follow.
