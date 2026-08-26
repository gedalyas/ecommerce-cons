import { Lock } from "lucide-react";
import { Badge } from "../../primitives/Badge";
import type { BadgeTone } from "../../primitives/Badge";
import { statusLabel, type StatusBadgeProps } from "./types";

const tones: Record<StatusBadgeProps["status"], BadgeTone> = {
  concluido: "outline",
  andamento: "warning",
  "nao-iniciado": "muted",
  bloqueado: "muted",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge tone={tones[status]}>
      {status === "bloqueado" && <Lock className="h-3 w-3" />}
      {statusLabel[status]}
    </Badge>
  );
}
