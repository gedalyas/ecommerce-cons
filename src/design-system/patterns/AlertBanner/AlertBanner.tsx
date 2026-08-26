import { AlertTriangle } from "lucide-react";
import { Card } from "../../primitives/Card";
import type { AlertBannerProps } from "./types";

/** Faixa de aviso com borda esquerda de 3px na cor de alerta. */
export function AlertBanner({ icon = true, children, action }: AlertBannerProps) {
  return (
    <Card tone="warning">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 text-[15px]">
        {icon && <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />}
        <span className="min-w-0 flex-1">{children}</span>
        {action}
      </div>
    </Card>
  );
}
