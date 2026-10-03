import type { ReactNode } from "react";
import { Button } from "@/shared/ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/Tooltip";

export function AssistantIconButton({
  label,
  onClick,
  type = "button",
  variant = "ghost",
  disabled = false,
  children,
}: {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "ghost" | "default";
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type={type}
          variant={variant}
          size="icon"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className="shrink-0"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
