# 2026-09-25 — `.xlsx` import read by `read-excel-file` in a worker thread

## Contexto

G3 (`growth-plan.md`) lets a store send the spreadsheet it already has, and most of them live
in Excel. An `.xlsx` is a zip of XML files: a 10 MB upload can unzip to hundreds of megabytes,
so the in-process parsing of `2026-09-13-csv-import-without-worker.md` is not enough — that
decision already named the worker as the answer "the day `.xlsx` arrives". The G3 plan named
`exceljs`.

## Decisão

- Read the first sheet with **`read-excel-file`** (MIT, `readSheet` from `read-excel-file/node`)
  inside a **`worker_threads` worker** (`apps/api/src/modules/imports/xlsxWorker.ts`, its own
  esbuild entry `dist/xlsxWorker.mjs`) with `resourceLimits` (512 MB old generation, 64 MB
  young) and the same 20 s budget as the CSV; on timeout the worker is terminated and the
  request answers 422.
- **Before any unzipping**, the API reads the zip's central directory (`zipDirectory.ts`, pure,
  tested) and refuses more than 500 entries, a declared unzipped total above 150 MB or a
  compression ratio above 100× (422), and anything that is not a zip (415). Measured: a
  50 000-row export (the row cap) is 2.1 MB and unzips to 17 MB — ratio 7.8× — and reads in
  about 1.1 s; a 200 MB zip bomb (205 KB on the wire) is refused in 16 ms.
- The worker never lets the library unzip the upload: `read-excel-file/node` streams local
  headers, which a crafted file can make disagree with the central directory (a data
  descriptor with no size inflated 800 MB past the check in a security PoC). The worker unzips
  with `fflate`'s `unzipSync`, which follows the central directory and writes each entry into a
  buffer of its declared (already checked) size, keeps the `.xml` / `.rels` parts and re-packs
  them uncompressed with known sizes; the library only ever reads that clean archive. At most
  two `.xlsx` reads run at once (503 beyond), a pool created per router instance.
- Cells become the same text the CSV path produces (`sheetCells.ts`): dates as ISO days, numbers
  with a dot and no thousands separator, so `parseImportDate` / `parseImportNumber` and the
  whole mapping / validation / undo pipeline stay unchanged.
- In development the API runs from TypeScript: the worker is started through a two-line eval
  bootstrap that registers `tsx` and imports `xlsxWorker.ts` (`--import tsx` in `execArgv`
  does not reach a worker's entry module).

## Por quê

- The worker contains what the byte ceiling cannot: the XML parse's heap has a hard cap and a
  runaway parse is killed without taking the API down.
- The central-directory check covers what `resourceLimits` does not — unzipped buffers live
  outside the V8 heap — and costs nothing on a legitimate file.
- `read-excel-file` is maintained (9.3, 2026) and returns typed cells (dates as `Date`); it
  depends on `fflate`, `saxen`, `unzipper-esm` and `worker-f`, and its streaming unzip path is
  never fed an upload directly (see above). `fflate` is also a direct dependency of the API.

## Alternativas descartadas

- **`exceljs`** (the plan's choice). Last release 4.4.0 in 2023; pulls `unzipper` 0.10,
  `archiver` 5 and `uuid` 8 for a read-only need, and loads the whole workbook model.
- **SheetJS (`xlsx` on npm).** The npm package is frozen at a version with known
  vulnerabilities; the maintained build is served only from the vendor's CDN.
- **Our own reader (zip + XML).** No dependency, but shared strings, inline strings and
  date number formats would be ~300 lines to get right and keep right.
- **Parsing `.xlsx` in-process like the CSV.** No cap on the XML parse's memory; one file
  could stall every store's requests.
