import { createServerFn } from "@tanstack/react-start";
import { reportRequestSchema, type ReportDocument } from "@ecommerce/contracts/reports";
import { apiFetch, attempt } from "@/shared/dependencies/apiClient";

export const previewReportFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => reportRequestSchema.parse(input))
  .handler(({ data }) =>
    attempt(
      () => apiFetch<ReportDocument>("/reports/preview", { method: "POST", body: data }),
      "Não foi possível montar o relatório agora. Tente novamente.",
    ),
  );
