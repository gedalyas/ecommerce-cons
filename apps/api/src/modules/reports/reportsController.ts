import type { Request, Response } from "express";
import { reportRequestSchema } from "@ecommerce/contracts/reports";
import { authOf } from "@/shared/http/authOf";
import { parseOrThrow } from "@/shared/http/validate";
import { reportFileName } from "./reportPdfDefinition";
import { createReportRenderer } from "./reportPdfService";
import { reportPreview, type ReportDependencies } from "./reportsService";

const PDFS_AT_ONCE = 2;

export function reportsController(deps: ReportDependencies) {
  const renderPdf = createReportRenderer(PDFS_AT_ONCE);
  return {
    async preview(req: Request, res: Response) {
      const request = parseOrThrow(reportRequestSchema, req.body ?? {});
      res.json(await reportPreview(authOf(req), request, deps));
    },
    async pdf(req: Request, res: Response) {
      const request = parseOrThrow(reportRequestSchema, req.body ?? {});
      const document = await reportPreview(authOf(req), request, deps);
      const pdf = await renderPdf(document);
      res
        .status(200)
        .type("application/pdf")
        .attachment(reportFileName(document.storeName, document.range))
        .send(pdf);
    },
  };
}
