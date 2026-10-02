import { describe, expect, it } from "vitest";
import type { ConsultingMetric, ConsultingSection } from "./consulting.types";
import { awaitsConsultant } from "./sectionRules";

const manual = (filled: boolean): ConsultingMetric => ({
  key: "cashMonths",
  label: "Meses de caixa",
  source: "manual",
  hint: "",
  manual: filled ? { value: "4", delta: null, note: "", updatedAt: "2026-10-01" } : null,
  fidelity: null,
});

const section = (kpis: ConsultingMetric[], canEdit = false): ConsultingSection => ({
  key: "management",
  title: "Gestão",
  subtitle: "",
  canEdit,
  pillars: [
    { key: "shielding", title: "Blindagem", status: "not-started", kpis, recommendations: [] },
  ],
});

describe("awaitsConsultant", () => {
  it("is true for the client while no manual indicator is filled", () => {
    expect(awaitsConsultant(section([manual(false), manual(false)]))).toBe(true);
  });

  it("is false once one is filled, for staff, or without manual indicators", () => {
    expect(awaitsConsultant(section([manual(false), manual(true)]))).toBe(false);
    expect(awaitsConsultant(section([manual(false)], true))).toBe(false);
    expect(awaitsConsultant(section([]))).toBe(false);
  });
});
