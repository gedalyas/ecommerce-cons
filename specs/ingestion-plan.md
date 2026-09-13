# Ingestion plan — CSV imports through Conexões

Status: **approved 2026-09-13, in execution** — board in `ingestion-tasks.md`.

## Why

Every number in the product still comes from the seed. The first door for real data is the
one the Conexões screen already promises ("Importação manual · Arraste a planilha aqui"): a
CSV upload, validated the Arko way, that writes into the fact tables the screens already read.
Connectors (Bling, Shopify, Meta, GA4) come later and reuse the same mapping and persistence;
the upload is the piece that works without credentials.

## Scope

Three import kinds, one CSV each, Portuguese headers, one row per line:

| Kind (`ImportKind`) | Writes to                                                             | Row = …                                         | Idempotency                                                                                               |
| ------------------- | --------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `ORDERS`            | `sales_order`, `order_item`, `customer`, `product`, `product_variant` | one order item (orders are grouped by `numero`) | order upserted by `(clientId, number)`: items replaced; customer by `(clientId, email)`; variant by `sku` |
| `AD_SPEND`          | `ad_spend_daily`                                                      | one ad × day                                    | the (platform, day) pairs present in the file are replaced                                                |
| `TRAFFIC`           | `traffic_daily`                                                       | one source/medium × day                         | upsert by `(clientId, date, source, medium)`                                                              |

Columns per kind (`packages/contracts/src/imports/importTemplates.ts`, Portuguese headers,
required flag, type): the web shows them and offers a "Baixar modelo" CSV; the API rejects a
file whose header misses a required column. Values follow the Brazilian convention: dates
`dd/mm/aaaa` (or ISO), numbers `1.234,56` (or `1234.56`), booleans `sim/não`.

Out of scope: `.xlsx` (needs a parser library and a worker; the copy on the screen says CSV
only from now on), scheduled connectors, per-product sessions.

## The seven file rules (CLAUDE.md "File input"), applied in this order

1. **Rate limit** — 10 uploads per 15 minutes per IP (`express-rate-limit`).
2. **Byte ceiling on both ends** — web input refuses > 10 MB before sending; multer's
   `limits.fileSize` is 10 MB (413 `{ message }`).
3. **Declared extension and mime** — `.csv` only; mime in `text/csv`, `text/plain`,
   `application/vnd.ms-excel`, `application/octet-stream` or absent (415).
4. **Content check ("magic byte")** — CSV has no signature, so the content is checked
   instead: no NUL bytes in the first 8 KB, decodable as UTF-8 (BOM stripped; latin-1 fallback
   when UTF-8 fails), and a header line that contains the template's required columns (400
   with the missing columns in Portuguese).
5. **Parser contained** — the byte ceiling bounds memory; the parser is a streaming state
   machine over the string with a **row cap (50 000)** and a **time budget (20 s)** checked
   every 500 rows; exceeding either fails the import (422). A worker thread is the next step if
   `.xlsx` or bigger files arrive — recorded in the decision.
6. Nobody unzips anything.
7. Errors answer JSON with 400/413/415/422 and a Portuguese message; limits are the largest
   legitimate export we know (a month of orders of a R$ 500k store ≈ 1 MB) × 10.

## Pipeline

```
web (Conexões)  ──FormData──►  BFF uploadImportFn  ──multipart──►  POST /api/v1/imports
                                                                     │ rules 1-4
                                                                     │ csvParse (5) → rows
                                                                     │ mapRows<kind> (pure, tested) → typed rows + row errors
                                                                     │ persist<kind> in chunks of 500 (transaction per chunk)
                                                                     │ after: refreshCustomerAggregates (ORDERS), DataSource.lastSyncedAt
                                                                     └ ImportJob row: status DONE | PARTIAL | FAILED, counts, first 50 errors
```

- `ImportJob` (`import_job`): id, clientId, userId, kind, fileName, fileSize, status
  (`DONE` every row imported · `PARTIAL` some rows rejected · `FAILED` nothing imported),
  rowsTotal, rowsImported, rowsRejected, errors (JSON `[{ row, message }]`, capped at 50),
  createdAt, finishedAt.
- Endpoints: `POST /imports` (multipart `file` + field `kind`), `GET /imports` (last 20),
  `GET /imports/:id`, `GET /imports/templates` (the column templates, for clients without
  the contracts package). All behind `requireAuth`; the import is processed synchronously (a
  10 MB CSV is seconds) and the response is the finished `ImportJob`.
- Data sources: a successful `ORDERS` import stamps `lastSyncedAt` on the "Loja" source,
  `AD_SPEND` on the platform's source (Meta Ads / Google Ads / TikTok Ads), `TRAFFIC` on
  "Google Analytics"; a source in `NOT_CONNECTED` becomes `MANUAL`. The Conexões summary,
  the sidebar dot and the Marketing banner derive from those rows already.
- Orders: `orderNumberForCustomer` is set from the customer's existing paid orders at insert
  time (the screens rank by `row_number()` anyway); customer aggregates and RFM are refreshed
  after the import so Clientes and the dashboard reflect the new rows.

## Web

The "Importação manual" block on Conexões becomes real: kind selector (Pedidos · Mídia paga ·
Tráfego), the expected columns with "Baixar modelo", a file input with drag-and-drop (`.csv`,
10 MB checked client-side with a Portuguese message), "Importar" through
`useServerFn(uploadImportFn)` with `FormData`, a result card (linhas lidas / importadas /
rejeitadas, the first errors with the row number) and a history table of the last imports.
The web validates to answer fast; the API is what protects.

## Stages

| Stage | What                                                                                      |
| ----- | ----------------------------------------------------------------------------------------- |
| I0    | This plan, the board, the decision record                                                 |
| I1    | `contracts/imports`: kinds, templates, `ImportJob` shape, schemas; value parsers (tested) |
| I2    | `packages/database`: `ImportJob` model + enums, migration                                 |
| I3    | `apps/api/modules/imports`: upload rules, CSV parser, row mappers, persistence, endpoints |
| I4    | `apps/web`: Conexões import block, BFF server functions, history                          |
| I5    | Specs (`connections.md`, `imports.md`), CLAUDE.md file-input section, board closed        |
