import type { ConsultingSection } from "./consulting.types";

export const awaitingConsultantNotice =
  "Os indicadores sem número são preenchidos pelo seu consultor nas reuniões de acompanhamento.";

export function awaitsConsultant(section: ConsultingSection): boolean {
  if (section.canEdit) return false;
  const manual = section.pillars.flatMap((p) => p.kpis).filter((k) => k.source === "manual");
  return manual.length > 0 && manual.every((k) => k.manual === null);
}
