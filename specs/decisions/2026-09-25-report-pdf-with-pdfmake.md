# 2026-09-25 — The Relatório PDF is drawn by `pdfmake` from the shared document

## Contexto

G5 (`growth-plan.md`) asks for "Baixar PDF" now and a PDF attached to the scheduled e-mail
later, rendered on the server (the web and the worker both need it) from the same numbers the
screens show. Slice 1 already builds a platform-neutral `ReportDocument` (kpis, chart, table,
note blocks with raw numbers) that the web preview draws. The plan named `@react-pdf/renderer`
as the lead candidate.

## Decisão

- **`pdfmake` 0.3** (MIT; `pdfkit` + `linebreak` + `xmldoc` underneath) renders the PDF. The pure
  `pdfDefinitionOf(document, palette)` maps the `ReportDocument` to pdfmake's JSON definition
  (A4, header with store and period, footer "gerado em … · página x de y" in the store's
  timezone, each section unbreakable); charts are SVG strings from the pure `chartSvgOf`
  (bars or lines, gridlines and axis labels formatted like the screens). Both are tested; the
  I/O part (`reportPdfService`) only sets fonts and access policies and asks for the buffer.
- **Font: Manrope**, the design system's, from `@fontsource/manrope` (OFL) in **WOFF**. WOFF2
  was tried first and embeds broken (text invisible in the rendered page: 0 dark pixels in a
  probe, against 539 with WOFF and 631 with Roboto TTF).
- **Colours** come from `reportPalette` in `contracts/reports`, a print palette that mirrors the
  web tokens (`--primary`, `--destructive`, `--chart-*`…), because the API cannot read the web's
  CSS; a variation is green or red by the KPI's `goodWhen`, like the screens' tiles.
- **Nothing is fetched while rendering:** `setUrlAccessPolicy(() => false)` and a local access
  policy that allows only the two font files.
- `POST /reports/pdf` takes the preview's request and answers `application/pdf` with
  `Content-Disposition: attachment; filename="relatorio-<loja>-<inicio>-a-<fim>.pdf"`; 20 per
  15 min per store and user. The web's BFF reads it with `apiFetchBinary` (same bearer and
  refresh as `apiFetch`) and hands the browser base64, which becomes a Blob download.
- Measured on the dev store, all ten sections of a month: 3 pages, ~25 KB, ~0.5–0.7 s.

## Por quê

- The document model already is a declarative tree; pdfmake's input is one too, so the
  mapping is a pure function a test can read, with tables, page breaks and SVG built in.
- No React, JSX or WASM in the API bundle, and no browser in the worker.

## Alternativas descartadas

- **`@react-pdf/renderer`.** Would put React and `.tsx` into the API (and the worker) and ships
  the `yoga` layout engine in WASM, for a document that is a handful of blocks.
- **Headless Chrome (Playwright / Puppeteer) printing an HTML page.** Pixel-identical to the web,
  but a 100+ MB browser in the API and worker images, slow cold starts and a sandbox to keep
  safe.
- **Raw `pdfkit`.** The same engine without layout: tables, wrapping and page breaks by hand.
- **Rendering the PDF in the browser.** The scheduled e-mail has no browser; one renderer on the
  server serves both.
