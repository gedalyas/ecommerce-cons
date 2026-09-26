import { Download } from "lucide-react";
import {
  reportSectionLabel,
  reportTemplateLabel,
  reportTemplates,
  type ReportSectionKey,
} from "@ecommerce/contracts/reports";
import { formatPeriodLabel } from "@ecommerce/contracts/shared/format";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { Button } from "@/shared/ui/Button";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { layout } from "@/shared/styles/spacing";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { ReportPreview } from "./ReportPreview";
import { useReportBuilder, type ReportChoice } from "./useReportBuilder";
import { useReportDownload } from "./useReportDownload";

const choiceOptions: { key: ReportChoice; label: string }[] = [
  { key: "current", label: "Período da tela" },
  ...reportTemplates.map((key) => ({ key, label: reportTemplateLabel[key] })),
];

export function ReportBuilder({ available }: { available: readonly ReportSectionKey[] }) {
  const { period } = usePeriod();
  const { choice, choose, range, sections, toggle, request, report, message, busy, run } =
    useReportBuilder(available);
  const { downloading, downloadMessage, save } = useReportDownload();
  const problem = message ?? downloadMessage;

  return (
    <div className={cn(layout.cardPadding, layout.groupStack)}>
      <SegmentedControl options={choiceOptions} value={choice} onChange={choose} label="Modelo" />
      <p className={cn(textClass.meta, "text-muted-foreground")}>
        Período: {formatPeriodLabel(range.inicio, range.fim, true)}
      </p>
      <fieldset>
        <legend className={cn(textClass.label, "text-foreground")}>Seções</legend>
        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {available.map((key) => (
            <li key={key}>
              <label
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 border border-border px-3 py-2",
                  radiusClass.control,
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={sections.includes(key)}
                  onChange={() => toggle(key)}
                />
                <span className={textClass.body}>{reportSectionLabel[key]}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      {problem && (
        <p role="alert" className={cn(textClass.meta, "text-destructive")}>
          {problem}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          onClick={() => void save(request)}
          disabled={downloading || sections.length === 0}
          className="h-11 w-full md:h-9 md:w-auto"
        >
          <Download className="h-4 w-4" /> {downloading ? "Gerando PDF…" : "Baixar PDF"}
        </Button>
        <Button
          onClick={() => void run()}
          disabled={busy || sections.length === 0}
          className="h-11 w-full md:h-9 md:w-auto"
        >
          {busy ? "Montando…" : "Pré-visualizar"}
        </Button>
      </div>
      {report && <ReportPreview document={report} granularity={period.por} />}
    </div>
  );
}
