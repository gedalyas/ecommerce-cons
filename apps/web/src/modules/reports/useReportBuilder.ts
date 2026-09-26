import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  templateRange,
  type ReportDocument,
  type ReportSectionKey,
  type ReportTemplate,
} from "@ecommerce/contracts/reports";
import { todayIso } from "@ecommerce/contracts/shared/clock";
import type { DateRange } from "@ecommerce/contracts/shared/period";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { reportRequestOf, templateSectionsFor, toggledSections } from "./reportBuilderRules";
import { previewReportFn } from "./reportsController";

export type ReportChoice = ReportTemplate | "current";

export function useReportBuilder(available: readonly ReportSectionKey[]) {
  const { period } = usePeriod();
  const preview = useServerFn(previewReportFn);
  const [choice, setChoice] = useState<ReportChoice>("current");
  const [range, setRange] = useState<DateRange>({ inicio: period.inicio, fim: period.fim });
  const [sections, setSections] = useState(() => templateSectionsFor("weekly", available));
  const [report, setReport] = useState<ReportDocument | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const request = reportRequestOf(range, sections, period);

  const choose = (next: ReportChoice) => {
    setChoice(next);
    setReport(null);
    if (next === "current") {
      setRange({ inicio: period.inicio, fim: period.fim });
      return;
    }
    setRange(templateRange(next, todayIso()));
    setSections(templateSectionsFor(next, available));
  };
  const toggle = (key: ReportSectionKey) => {
    setReport(null);
    setSections((current) => toggledSections(current, key));
  };
  const run = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await preview({ data: request });
      if (result.ok) setReport(result.value);
      else setMessage(result.message);
    } finally {
      setBusy(false);
    }
  };
  return { choice, choose, range, sections, toggle, request, report, message, busy, run };
}
