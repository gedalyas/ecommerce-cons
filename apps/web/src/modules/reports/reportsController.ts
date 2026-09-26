import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  reportRequestSchema,
  reportScheduleIdSchema,
  reportScheduleSchema,
  type ReportDocument,
  type ReportSchedulesScreen,
} from "@ecommerce/contracts/reports";
import { apiFetch, apiFetchBinary, attempt, attemptWrite } from "@/shared/dependencies/apiClient";

export const previewReportFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => reportRequestSchema.parse(input))
  .handler(({ data }) =>
    attempt(
      () => apiFetch<ReportDocument>("/reports/preview", { method: "POST", body: data }),
      "Não foi possível montar o relatório agora. Tente novamente.",
    ),
  );

export const downloadReportFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => reportRequestSchema.parse(input))
  .handler(({ data }) =>
    attempt(async () => {
      const file = await apiFetchBinary("/reports/pdf", { method: "POST", body: data });
      return {
        fileName: file.fileName ?? "relatorio.pdf",
        base64: Buffer.from(file.bytes).toString("base64"),
      };
    }, "Não foi possível gerar o PDF agora. Tente novamente."),
  );

export const getReportSchedulesFn = createServerFn({ method: "GET" }).handler(() =>
  attempt(
    () => apiFetch<ReportSchedulesScreen>("/reports/schedules"),
    "Não foi possível carregar as automações agora.",
  ),
);

const saveScheduleInput = z.object({
  id: z.string().min(1).max(64).nullable(),
  schedule: reportScheduleSchema,
});

export const saveReportScheduleFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => saveScheduleInput.parse(input))
  .handler(({ data }) =>
    attemptWrite(
      () =>
        data.id
          ? apiFetch(`/reports/schedules/${encodeURIComponent(data.id)}`, {
              method: "PUT",
              body: data.schedule,
            })
          : apiFetch("/reports/schedules", { method: "POST", body: data.schedule }),
      "Não foi possível salvar a automação agora.",
    ),
  );

export const deleteReportScheduleFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => reportScheduleIdSchema.parse(input))
  .handler(({ data }) =>
    attemptWrite(
      () => apiFetch(`/reports/schedules/${encodeURIComponent(data.id)}`, { method: "DELETE" }),
      "Não foi possível excluir a automação agora.",
    ),
  );
