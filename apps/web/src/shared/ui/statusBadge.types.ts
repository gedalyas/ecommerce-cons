export type PillarStatus = "done" | "in-progress" | "not-started" | "blocked";
export const statusLabel: Record<PillarStatus, string> = {
  done: "Concluído",
  "in-progress": "Em andamento",
  "not-started": "Não iniciado",
  blocked: "Bloqueado",
};
export type StatusBadgeProps = { status: PillarStatus };
