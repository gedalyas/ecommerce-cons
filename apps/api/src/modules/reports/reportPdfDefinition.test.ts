import { describe, expect, it } from "vitest";
import { reportPalette, type ReportDocument } from "@ecommerce/contracts/reports";
import { pdfDefinitionOf, reportFileName, safeTimeZone } from "./reportPdfDefinition";

const document: ReportDocument = {
  title: "Relatório — Loja Exemplo",
  storeName: "Loja Exemplo",
  range: { inicio: "2026-08-01", fim: "2026-08-31" },
  generatedAt: "2026-09-26T01:30:00.000Z",
  timezone: "America/Sao_Paulo",
  sections: [
    {
      key: "roasByChannel",
      title: "ROAS por canal",
      blocks: [
        {
          kind: "table",
          columns: [
            { key: "label", label: "Canal", unit: "text" },
            { key: "roas", label: "ROAS", unit: "multiplier" },
          ],
          rows: [{ label: "Site", roas: null }],
        },
      ],
    },
    { key: "meta", title: "Meta Ads", blocks: [{ kind: "note", text: "Sem dados no período." }] },
  ],
};

describe("pdfDefinitionOf", () => {
  it("prints the title, the period and every section in order, in the design font", () => {
    const definition = pdfDefinitionOf(document, reportPalette);
    const text = JSON.stringify(definition.content);
    expect(definition.defaultStyle).toMatchObject({ font: "Manrope" });
    expect(text.indexOf("Relatório — Loja Exemplo")).toBeLessThan(text.indexOf("ROAS por canal"));
    expect(text.indexOf("ROAS por canal")).toBeLessThan(text.indexOf("Meta Ads"));
    expect(text).toContain("Sem dados no período.");
  });

  it("formats table cells like the screens, with a dash for no value", () => {
    const text = JSON.stringify(pdfDefinitionOf(document, reportPalette).content);
    expect(text).toContain('"text":"Site"');
    expect(text).toContain('"text":"—"');
  });

  it("numbers the pages in the footer", () => {
    const { footer } = pdfDefinitionOf(document, reportPalette);
    const printed =
      typeof footer === "function"
        ? JSON.stringify(footer(2, 3, { width: 0, height: 0, orientation: "portrait" }))
        : "";
    expect(printed).toContain("página 2 de 3");
    expect(printed).toContain("gerado em 25/09/2026");
  });
});

describe("KPI colours", () => {
  it("paints a fall green when lower is better and red when higher is better", () => {
    const kpis = (goodWhen: "up" | "down"): ReportDocument => ({
      ...document,
      sections: [
        {
          key: "kpis",
          title: "Indicadores do período",
          blocks: [
            {
              kind: "kpis",
              items: [
                {
                  label: "CAC",
                  goodWhen,
                  metric: { value: 20, unit: "percent", previous: 21, variation: -4 },
                },
              ],
            },
          ],
        },
      ],
    });
    const printed = (goodWhen: "up" | "down") =>
      JSON.stringify(pdfDefinitionOf(kpis(goodWhen), reportPalette).content);
    expect(printed("down")).toContain(`"color":"${reportPalette.primary}"`);
    expect(printed("up")).toContain(`"color":"${reportPalette.destructive}"`);
  });
});

describe("reportFileName", () => {
  it("slugs the store's name and carries the period", () => {
    expect(reportFileName("Loja São João & Cia", { inicio: "2026-08-01", fim: "2026-08-31" })).toBe(
      "relatorio-loja-sao-joao-cia-2026-08-01-a-2026-08-31.pdf",
    );
    expect(reportFileName("***", { inicio: "2026-08-01", fim: "2026-08-01" })).toBe(
      "relatorio-loja-2026-08-01-a-2026-08-01.pdf",
    );
  });
});

describe("safeTimeZone", () => {
  it("keeps a valid IANA zone and falls back to São Paulo otherwise", () => {
    expect(safeTimeZone("America/Manaus")).toBe("America/Manaus");
    expect(safeTimeZone("Brasil/Nowhere")).toBe("America/Sao_Paulo");
  });
});
