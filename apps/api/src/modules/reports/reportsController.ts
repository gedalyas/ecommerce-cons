import type { Request, Response } from "express";
import {
  reportRequestSchema,
  reportScheduleIdSchema,
  reportScheduleSchema,
} from "@ecommerce/contracts/reports";
import { authOf } from "@/shared/http/authOf";
import { parseOrThrow } from "@/shared/http/validate";
import { reportFileName } from "./reportPdfDefinition";
import { createReportRenderer } from "./reportPdfService";
import {
  createReportSchedule,
  deleteReportSchedule,
  reportSchedulesScreen,
  updateReportSchedule,
} from "./reportSchedulesService";
import { reportPreview, type ReportDependencies } from "./reportsService";

const PDFS_AT_ONCE = 2;

export function reportsController(deps: ReportDependencies) {
  const renderPdf = createReportRenderer(PDFS_AT_ONCE);
  return {
    async preview(req: Request, res: Response) {
      const request = parseOrThrow(reportRequestSchema, req.body ?? {});
      res.json(await reportPreview(authOf(req), request, deps));
    },
    async schedules(req: Request, res: Response) {
      res.json(await reportSchedulesScreen(authOf(req)));
    },
    async createSchedule(req: Request, res: Response) {
      const input = parseOrThrow(reportScheduleSchema, req.body ?? {});
      res.status(201).json(await createReportSchedule(authOf(req), input));
    },
    async updateSchedule(req: Request, res: Response) {
      const { id } = parseOrThrow(reportScheduleIdSchema, req.params);
      const input = parseOrThrow(reportScheduleSchema, req.body ?? {});
      res.json(await updateReportSchedule(authOf(req), id, input));
    },
    async deleteSchedule(req: Request, res: Response) {
      const { id } = parseOrThrow(reportScheduleIdSchema, req.params);
      await deleteReportSchedule(authOf(req), id);
      res.status(204).end();
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
