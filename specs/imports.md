# Importação manual (Conexões › Importação manual)

Modules: `apps/api/src/modules/imports` (upload, parsing, persistence, history) and
`apps/web/src/modules/imports` (the panel on Conexões); shapes and templates in
`packages/contracts/src/imports`. Plan and decisions: `ingestion-plan.md`,
`decisions/2026-09-13-csv-import-without-worker.md`.

## Kinds and templates

| Kind       | Label           | Writes                                                                                     | Idempotency                                                                                               |
| ---------- | --------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `ORDERS`   | Pedidos         | `sales_order` + `order_item`; `customer` and `product`/`product_variant` created on demand | order replaced by `numero` (items replaced), customer by e-mail, variant by SKU                           |
| `AD_SPEND` | Mídia paga      | `ad_spend_daily`                                                                           | the (plataforma, data) pairs present in the file are replaced whole (connector rows of that day included) |
| `TRAFFIC`  | Tráfego do site | `traffic_daily`                                                                            | upsert by (data, origem, meio)                                                                            |

Headers are Portuguese, accent- and case-insensitive (`Preço Unitário` → `preco_unitario`).
Required columns are marked with `*` on the screen; the model CSV ("Baixar modelo") has the
header row and one example row. Values: dates `dd/mm/aaaa` or ISO, numbers `1.234,56` or
`1234.56` (a leading `R$` is ignored), options by label (`pago`, `pix`, `meta`…).

### Any layout (column mapping)

A spreadsheet does not have to follow the template. When its header lacks a required template
column, the preview answers the **mapping step** instead (`ImportMappingPreview`,
`step: "mapping"`): the header, the first 5 rows as text, and a mapping
`{ templateKey: sourceHeader }` — the one this store confirmed last time for the same layout
(`remembered: true`) or one suggested by synonyms (`headerSynonyms` in contracts: "Data da
compra" → data, "Qtd" → quantidade, "Código" → sku…; the template's own name wins, a column is
used once). The person fixes it on the screen and sends it back as the `mapping` field (JSON)
of the same multipart; `remapTable` rewrites the rows in the template's layout and everything
below (row validation, writing, undo) is unchanged. A mapping that names an unknown field or a
column the file does not have, or leaves a required field empty, is **422** listing every
problem (`mappingProblems`). After an import with a mapping writes at least one row, the
mapping is saved in `import_layout` keyed by (store, kind, sha256 of the normalized, sorted
header) — the next file with the same columns, in any order, comes pre-mapped; undoing the
import keeps it (it is the store's preference, not imported data). A header wider than 200
columns or with a name longer than 200 characters is 422; the multipart takes at most the
`kind` and `mapping` fields (20 KB each) besides the file. All pure rules
live in `packages/contracts/src/imports/columnMapping.ts` with their test.

Defaults when an optional column is empty: `plataforma` ecommerce, `canal` "Loja", `gateway`
"Não informado", `pagamento` cartão, `uf` "ND", `categoria` "Sem categoria", `frete`/`desconto`
0; ad ids fall back to their names; traffic `usuarios` falls back to `sessoes`.

## Endpoint

`POST /api/v1/imports` — multipart with `kind` and `file`. The seven file rules, in order:

1. rate limit — 10 uploads / 15 min per IP (429);
2. byte ceiling — 10 MB on the web input and on multer (413);
3. extension `.csv` and a CSV/text mime, or none (415);
4. content — no NUL byte in the first 8 KB (415), UTF-8 with latin-1 fallback, the required
   headers present or a valid `mapping` (400 / 422), at least one data row (422);
5. contained parser — 50 000 rows and 20 s budget (422);
6. nothing is unzipped;
7. every failure is `{ message }` in Portuguese.

Before any row is read, an orders or traffic import is refused with **409** when another
source owns that data kind (`StoreDataSource`, see `connections.md`); after at least one row is
written the spreadsheet claims the kind if nobody owns it, and undoing its last active import of
the kind releases it ("A fonte de vendas desta loja é Bling.
Para usar outra fonte, troque em Conexões."). Ad spend is never exclusive. Every order written
records `source = "manual_csv"`.

Rows that fail validation are rejected individually (`Linha N: coluna "x" …`) and the rest is
written in chunks of 200 inside transactions. The response (201) is the `ImportJob`:
`DONE` (every row in), `PARTIAL` (some rejected), `FAILED` (none in), with counts and the first
50 errors. After a successful import the data sources are stamped (`Loja`, `Meta Ads` /
`Google Ads` / `TikTok Ads`, `Google Analytics`; `NOT_CONNECTED` or `ERROR` become `MANUAL`)
and, for orders, the customer aggregates and RFM are refreshed.

`POST /imports/preview` — same multipart, same rules 1–7 (30 previews / 15 min), but nothing
is written: the answer is the mapping step above, or `ImportPreview` (`step: "preview"`) — `counts { total, valid, rejected }`, the first 50
errors, a `summary` (count, Portuguese label, first and last date) and `sample` (the first 10
mapped rows as typed cells: text, date, integer, currency — the web formats them) with its
`columns`. Orders are grouped by number before sampling.

`POST /imports/:id/undo` — undoes an import. While writing, the import records in
`import_undo` what it touched (`previous = null` for a created row, the JSON of the replaced
row otherwise): orders with their items, customers (name), products created for unknown
SKUs, ad-spend days (platform + date) and traffic rows. Only the most recent non-undone job
of its kind can be undone (409 otherwise — a later import may have overwritten the same
keys); snapshots are kept for the three latest jobs per kind, so undoing twice in a row
works, and purged beyond that. Undo deletes the created rows, restores the replaced ones
(customers and products created by the import go only when nothing else references them),
marks the job `UNDONE`, resets the data sources it stamped when no other import remains
(`MANUAL` → `NOT_CONNECTED`) and, for orders, refreshes the customer aggregates. `ImportJob`
carries `undoneAt` and `canUndo`.

`GET /imports` (last 20), `GET /imports/:id`, `GET /imports/templates`.

## Screen

Inside Conexões: kind selector (Pedidos · Mídia paga · Tráfego do site), the template's
description and columns, "Baixar modelo", the drop zone ("Arraste o CSV aqui ou selecione um
arquivo · Formato aceito: .csv · até 10 MB"), the "Conferir …" button, for a free layout the
"Conferir colunas" card (one select per template field, required ones bold with `*`, "Não usar",
the first filled sample value beside it, the problems in orange, "Ver prévia" disabled until
they are gone), then the preview card
("Prévia da importação": "12 pedidos · 01/09 a 10/09 · 11 de 12 linhas válidas · 1 serão
rejeitadas", the first errors, the sample table, "Importar N linhas" / Cancelar), the result
card (status badge, "N de M linhas importadas · K rejeitadas", the first 10 errors) and the
history table (Quando · Tipo · Arquivo · Status · Linhas · Rejeitadas · Desfazer on the job
that can be undone, behind a confirm dialog; an undone job shows Desfeita).
