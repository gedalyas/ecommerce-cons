import { createServerFn } from "@tanstack/react-start";
import { reportRequestSchema, type ReportDocument } from "@ecommerce/contracts/reports";
import { apiFetch, apiFetchBinary, attempt } from "@/shared/dependencies/apiClient";

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
