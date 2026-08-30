import { Lock } from "lucide-react";
import { Badge } from "../../primitives/Badge";
import type { BadgeTone } from "../../primitives/Badge";
import { statusLabel, type StatusBadgeProps } from "./types";

const tones: Record<StatusBadgeProps["status"], BadgeTone> = {
  done: "outline",
  "in-progress": "warning",
  "not-started": "muted",
  blocked: "muted",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge tone={tones[status]}>
      {status === "blocked" && <Lock className="h-3 w-3" />}
      {statusLabel[status]}
    </Badge>
  );
}
