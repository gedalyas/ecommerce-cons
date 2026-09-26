import type { ReportDocument, ReportKpi } from "@ecommerce/contracts/reports";
import { formatPeriodLabel, formatVariation } from "@ecommerce/contracts/shared/format";
import { formatMetric } from "@ecommerce/contracts/shared/metricFormat";
import { escapeHtml } from "@/shared/mail/escapeHtml";
import type { MailMessage } from "@/shared/mail/mailer.types";

const SUMMARY_KPIS = 4;

export type ReportMailInput = {
  to: string;
  scheduleName: string;
  document: ReportDocument;
  pdf: Buffer;
  fileName: string;
  appUrl: string;
  createdBy: string;
};

function summaryOf(document: ReportDocument): ReportKpi[] {
  for (const section of document.sections) {
    for (const block of section.blocks) {
      if (block.kind === "kpis") return block.items.slice(0, SUMMARY_KPIS);
    }
  }
  return [];
}

const kpiLine = ({ label, metric }: ReportKpi) =>
  `${label}: ${formatMetric(metric.value, metric.unit)}` +
  (metric.variation == null ? "" : ` (${formatVariation(metric.variation)})`);

export function reportMail(input: ReportMailInput): MailMessage {
  const { document } = input;
  const period = formatPeriodLabel(document.range.inicio, document.range.fim, true);
  const lines = summaryOf(document).map(kpiLine);
  const intro = `Segue o relatório "${input.scheduleName}" da ${document.storeName}, de ${period}.`;
  const outro = `O PDF completo vai em anexo. Esta automação é de ${input.createdBy}: para mudar, parar ou sair da lista, fale com essa pessoa ou abra o Relatório no Dashboard:`;
  return {
    to: input.to,
    subject: `${input.scheduleName} — ${document.storeName} (${period})`.replace(/[\r\n]+/g, " "),
    text: [intro, "", ...lines, "", outro, input.appUrl].join("\n"),
    html: [
      `<p>${escapeHtml(intro)}</p>`,
      lines.length > 0 ? `<ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>` : "",
      `<p>${escapeHtml(outro)} <a href="${escapeHtml(input.appUrl)}">${escapeHtml(input.appUrl)}</a></p>`,
    ].join(""),
    attachments: [{ filename: input.fileName, content: input.pdf, contentType: "application/pdf" }],
  };
}
