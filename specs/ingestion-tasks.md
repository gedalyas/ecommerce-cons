# Ingestion — task board

Checklist companion to `ingestion-plan.md`. Tick tasks as they land (`[x]`), add a short note
when something changed along the way. Keep this file and the plan in sync.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped

Status: **I4 done (2026-09-13)** — last updated 2026-09-13

---

## I0 — Plan

- [x] `specs/ingestion-plan.md`, this board, `decisions/2026-09-13-csv-import-without-worker.md`

## I1 — `contracts/imports`

- [x] `importKinds` + labels, `importStatuses` + labels, `ImportJob`, `ImportRowError`,
      `ImportsScreen` shapes; `importTemplates` (columns: key, header, required, type,
      example, options) per kind, `requiredHeaders`, `templateRows`
- [x] Value parsers (`importValues.ts`, tested): pt-BR/ISO dates, `1.234,56` numbers,
      integers, options by label, `normalizeHeader` (BOM, accents, case)
- [x] Schemas: `importKindSchema`, `importIdSchema`; `IMPORT_MAX_BYTES`, `IMPORT_MAX_ROWS`,
      `IMPORT_ACCEPTED_EXTENSIONS` shared by both ends

## I2 — Database

- [x] `ImportKind`, `ImportStatus` enums; `ImportJob` model (client, optional user, counts,
      JSON errors); migration `20260913163835_import_jobs`

## I3 — API `imports` module

- [x] `POST /imports`: rate limit (10 / 15 min), multer memory storage with the 10 MB ceiling
      (413), `uploadRules.ts` extension + mime (415, tested), NUL-byte content check (415),
      required-header check against the template (400), empty file (422)
- [x] `csvParse.ts` (tested): BOM, UTF-8 with latin-1 fallback, `;` `,` or tab auto-detected,
      quotes and escaped quotes, CRLF, blank lines, row cap and time budget (`CsvLimitError` → 422)
- [x] `rowReader.ts` + `mapRows.ts` (tested): header → typed rows with Portuguese row errors
      (`Linha N: coluna "x" …`); orders grouped by number with product revenue and total;
      ids of ads default to their names; traffic source/medium lowercased
- [x] `importsWriteService.ts`: orders upserted by number with customers by e-mail and
      variants by SKU (items replaced, `orderNumberForCustomer` from the customer's paid
      orders), ad spend replaced per platform × day, traffic upserted; chunks of 200 in
      transactions. `importsService.ts`: outcome (`importOutcome.ts`, tested), data sources
      stamped (`NOT_CONNECTED`/`ERROR` → `MANUAL`), customer aggregates refreshed after
      orders, `ImportJob` recorded with the first 50 errors
- [x] `GET /imports` (last 20), `GET /imports/:id`, `GET /imports/templates`
- [x] Smoke: orders PARTIAL (4 of 5 rows, row 6 rejected for the date), idempotent re-run,
      ad spend DONE, traffic DONE, missing `meio` → 400, `.xlsx` → 415, binary → 415, 12 MB →
      413, header only → 422, no file → 400, history and templates listed, the imported
      orders visible on Pedidos, sources stamped

## I4 — Web

- [x] `modules/imports` in the web: `ImportPanel` (kind `SegmentedControl`, the template's
      columns with required marks and examples, "Baixar modelo" CSV), `ImportResult`,
      `importHistoryColumns`; the Conexões route loads `getImportsScreen` alongside the
      sources and the old visual-only block is gone
- [x] File input + drag-and-drop with the client-side check (`importFile.ts`, tested:
      extension, 10 MB, empty), `uploadImportFn` forwards the `FormData` through the BFF
      (`apiFetch` now sends `FormData` as multipart), result card and history table
- [x] Headless browser: picked a 3-line orders CSV on Conexões → "PARCIAL · 2 de 3 linhas
      importadas · 1 rejeitadas" with the row error, history row, the two orders on
      Pedidos › Lista, `.xlsx` refused client-side; database reseeded afterwards

## I5 — Docs

- [ ] `specs/imports.md`, `specs/connections.md` updated, CLAUDE.md "File input" rewritten for
      the implemented pipeline, board closed
