# Ingestion — task board

Checklist companion to `ingestion-plan.md`. Tick tasks as they land (`[x]`), add a short note
when something changed along the way. Keep this file and the plan in sync.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped

Status: **I0 done (2026-09-13)** — last updated 2026-09-13

---

## I0 — Plan

- [x] `specs/ingestion-plan.md`, this board, `decisions/2026-09-13-csv-import-without-worker.md`

## I1 — `contracts/imports`

- [ ] `importKinds` + labels, `importStatuses` + labels, `ImportJob`, `ImportRowError`,
      `ImportsScreen` shapes; `importTemplates` (columns: key, header, required, type) per kind
- [ ] Value parsers (`importValues.ts`, tested): pt-BR/ISO dates, `1.234,56` numbers,
      `sim/não`, enums by label or key
- [ ] Schemas: `importKindSchema` (form field), `IMPORT_MAX_BYTES = 10 MB` shared by both ends

## I2 — Database

- [ ] `ImportKind`, `ImportStatus` enums; `ImportJob` model; migration

## I3 — API `imports` module

- [ ] `POST /imports` with multer (memory, 10 MB), rate limit, extension + mime, content check,
      header check against the template — each failure a Portuguese JSON error (400/413/415/422)
- [ ] `csvParse.ts` (tested): BOM, `;` or `,` auto-detected, quotes, CRLF, row cap, time budget
- [ ] `mapOrders.ts`, `mapAdSpend.ts`, `mapTraffic.ts` (tested): header → typed rows +
      `{ row, message }` errors; orders grouped by number
- [ ] `importsService.ts`: persistence per kind in chunks, `ImportJob` row, data-source stamp,
      customer aggregates refresh after orders
- [ ] `GET /imports`, `GET /imports/:id`, `GET /imports/templates`
- [ ] Smoke with curl: a valid file per kind, a 12 MB file (413), a `.xlsx` (415), a header
      missing a required column (400), rows with bad values (PARTIAL with errors)

## I4 — Web

- [ ] `contracts` templates rendered on Conexões; "Baixar modelo" CSV per kind
- [ ] File input + drag-and-drop, client-side size/extension check, `uploadImportFn` (FormData
      through the BFF), result card, history table (`getImportsScreen`)
- [ ] Headless-browser check: upload a valid orders CSV, see the result and the new rows on
      Pedidos › Lista

## I5 — Docs

- [ ] `specs/imports.md`, `specs/connections.md` updated, CLAUDE.md "File input" rewritten for
      the implemented pipeline, board closed
