export const fidelities = ["A", "B", "C"] as const;
export type Fidelity = (typeof fidelities)[number];
export const fidelityLabel: Record<Fidelity, string> = {
  A: "medido",
  B: "aproximado",
  C: "indicativo",
};
