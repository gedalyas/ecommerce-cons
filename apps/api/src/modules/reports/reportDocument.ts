import {
  reportSectionKeys,
  reportSectionLabel,
  type ReportDocument,
  type ReportSectionKey,
} from "@ecommerce/contracts/reports";
import { sectionBlocks, type ReportFacts } from "./reportSections";

export type ReportInput = {
  storeName: string;
  range: { inicio: string; fim: string };
  generatedAt: string;
  timezone: string;
  sections: readonly ReportSectionKey[];
  facts: ReportFacts;
};

export function reportDocumentOf({
  storeName,
  range,
  generatedAt,
  timezone,
  sections,
  facts,
}: ReportInput): ReportDocument {
  return {
    title: `Relatório — ${storeName}`,
    storeName,
    range,
    generatedAt,
    timezone,
    sections: reportSectionKeys
      .filter((key) => sections.includes(key))
      .map((key) => ({
        key,
        title: reportSectionLabel[key],
        blocks: sectionBlocks[key](facts),
      })),
  };
}
