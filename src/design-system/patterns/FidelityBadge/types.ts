export type Fidelity = "A" | "B" | "C";
export const fidelityLabel: Record<Fidelity, string> = {
  A: "medido",
  B: "aproximado",
  C: "indicativo",
};
export type FidelityBadgeProps = { fidelity: Fidelity; note: string };
