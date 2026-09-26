import { createRequire } from "node:module";
import type * as PdfMake from "pdfmake";
import { reportPalette, type ReportDocument } from "@ecommerce/contracts/reports";
import { HttpError } from "@/shared/http/httpError";
import { REPORT_FONT, pdfDefinitionOf } from "./reportPdfDefinition";

type ReportRenderer = (document: ReportDocument) => Promise<Buffer>;

const load = createRequire(import.meta.url);

const fontFile = (weight: 400 | 600) =>
  load.resolve(`@fontsource/manrope/files/manrope-latin-${weight}-normal.woff`);

export function createReportRenderer(maxConcurrent: number): ReportRenderer {
  const pdfmake: typeof PdfMake = load("pdfmake");
  const regular = fontFile(400);
  const bold = fontFile(600);
  pdfmake.setFonts({
    [REPORT_FONT]: { normal: regular, bold, italics: regular, bolditalics: bold },
  });
  pdfmake.setUrlAccessPolicy(() => false);
  pdfmake.setLocalAccessPolicy((path) => path === regular || path === bold);
  let rendering = 0;
  return async (document) => {
    if (rendering >= maxConcurrent) {
      throw new HttpError(503, "Outros relatórios estão sendo gerados agora. Tente de novo.");
    }
    rendering += 1;
    try {
      return await pdfmake.createPdf(pdfDefinitionOf(document, reportPalette)).getBuffer();
    } finally {
      rendering -= 1;
    }
  };
}
