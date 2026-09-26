import type { Alignment, Content, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";
import {
  formatReportCell,
  type ReportBlock,
  type ReportDocument,
  type ReportKpi,
  type ReportPalette,
} from "@ecommerce/contracts/reports";
import { formatDate, formatPeriodLabel, formatVariation } from "@ecommerce/contracts/shared/format";
import { formatMetric } from "@ecommerce/contracts/shared/metricFormat";
import { CHART_WIDTH, chartSvgOf } from "./reportChartSvg";

type Margin = [number, number, number, number];
type Block<K extends ReportBlock["kind"]> = Extract<ReportBlock, { kind: K }>;

export const REPORT_FONT = "Manrope";
const FALLBACK_TIME_ZONE = "America/Sao_Paulo";
const KPIS_PER_ROW = 4;

const chunk = <T>(items: readonly T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, i * size + size),
  );

const alignmentOf = (unit: string): Alignment => (unit === "text" ? "left" : "right");

const NEUTRAL_VARIATION = 0.05;

function variationColor({ metric, goodWhen }: ReportKpi, palette: ReportPalette): string {
  const variation = metric.variation ?? 0;
  if (Math.abs(variation) < NEUTRAL_VARIATION) return palette.muted;
  return variation > 0 === (goodWhen === "up") ? palette.primary : palette.destructive;
}

function kpiContent(kpi: ReportKpi, palette: ReportPalette): Content {
  const { label, metric } = kpi;
  const variation = metric.variation;
  return {
    stack: [
      { text: formatMetric(metric.value, metric.unit), fontSize: 13, bold: true },
      { text: label, fontSize: 7.5, color: palette.muted, margin: [0, 1, 0, 0] },
      variation == null
        ? { text: " ", fontSize: 7.5 }
        : {
            text: `${formatVariation(variation)} vs período anterior`,
            fontSize: 7.5,
            color: variationColor(kpi, palette),
          },
    ],
  };
}

function kpisContent(block: Block<"kpis">, palette: ReportPalette): Content {
  return {
    stack: chunk(block.items, KPIS_PER_ROW).map((row) => ({
      columns: Array.from({ length: KPIS_PER_ROW }, (_, i) => {
        const item = row[i];
        return item ? kpiContent(item, palette) : { text: "" };
      }),
      columnGap: 10,
      margin: [0, 0, 0, 8] as Margin,
    })),
  };
}

function chartContent(block: Block<"chart">, palette: ReportPalette): Content {
  return {
    stack: [
      { svg: chartSvgOf(block, palette), width: CHART_WIDTH },
      {
        text: block.series.map((s, i) => ({
          text: `■ ${s.label}   `,
          color: palette.series[i % palette.series.length],
        })),
        fontSize: 7.5,
        margin: [0, 2, 0, 0],
      },
    ],
  };
}

function tableContent(block: Block<"table">, palette: ReportPalette): Content {
  const header: TableCell[] = block.columns.map((c) => ({
    text: c.label,
    bold: true,
    color: palette.muted,
    alignment: alignmentOf(c.unit),
  }));
  const rows: TableCell[][] = block.rows.map((row) =>
    block.columns.map((c) => ({
      text: formatReportCell(row[c.key] ?? null, c.unit),
      alignment: alignmentOf(c.unit),
    })),
  );
  return {
    table: {
      headerRows: 1,
      widths: block.columns.map((_, i) => (i === 0 ? "*" : "auto")),
      body: [header, ...rows],
    },
    layout: "lightHorizontalLines",
    fontSize: 8,
  };
}

function blockContent(block: ReportBlock, palette: ReportPalette): Content {
  switch (block.kind) {
    case "kpis":
      return kpisContent(block, palette);
    case "chart":
      return chartContent(block, palette);
    case "table":
      return tableContent(block, palette);
    case "note":
      return { text: block.text, color: palette.muted };
  }
}

function sectionsContent(document: ReportDocument, palette: ReportPalette): Content[] {
  return document.sections.map((section) => ({
    unbreakable: true,
    stack: [
      {
        text: section.title,
        fontSize: 12,
        bold: true,
        color: palette.primary,
        margin: [0, 10, 0, 6] as Margin,
      },
      ...section.blocks.map((block) => ({
        stack: [blockContent(block, palette)],
        margin: [0, 0, 0, 8] as Margin,
      })),
    ],
  }));
}

export function pdfDefinitionOf(
  document: ReportDocument,
  palette: ReportPalette,
): TDocumentDefinitions {
  const period = formatPeriodLabel(document.range.inicio, document.range.fim, true);
  const generated = formatDate(document.generatedAt, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: safeTimeZone(document.timezone),
  });
  return {
    info: { title: document.title, author: "E-commerce Insights" },
    pageSize: "A4",
    pageMargins: [40, 48, 40, 44],
    defaultStyle: { font: REPORT_FONT, fontSize: 9, color: palette.foreground },
    header: {
      text: `${document.storeName} · ${period}`,
      alignment: "right",
      fontSize: 7.5,
      color: palette.muted,
      margin: [40, 20, 40, 0],
    },
    footer: (currentPage, pageCount) => ({
      text: `E-commerce Insights · gerado em ${generated} · página ${currentPage} de ${pageCount}`,
      alignment: "center",
      fontSize: 7.5,
      color: palette.muted,
      margin: [40, 12, 40, 0],
    }),
    content: [
      { text: document.title, fontSize: 18, bold: true },
      { text: period, color: palette.muted, margin: [0, 2, 0, 12] },
      ...sectionsContent(document, palette),
    ],
  };
}

export function safeTimeZone(timezone: string): string {
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone: timezone });
    return timezone;
  } catch {
    return FALLBACK_TIME_ZONE;
  }
}

export function reportFileName(storeName: string, range: { inicio: string; fim: string }): string {
  const slug = storeName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `relatorio-${slug || "loja"}-${range.inicio}-a-${range.fim}.pdf`;
}
