export type PillarStatus = "concluido" | "andamento" | "nao-iniciado" | "bloqueado";
export const statusLabel: Record<PillarStatus, string> = {
  concluido: "Concluído",
  andamento: "Em andamento",
  "nao-iniciado": "Não iniciado",
  bloqueado: "Bloqueado",
};
export type StatusBadgeProps = { status: PillarStatus };
