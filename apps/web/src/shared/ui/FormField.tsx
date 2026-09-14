import type { ReactNode } from "react";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";

export function FormField({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className={cn(textClass.label, "text-muted-foreground")}>{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className={cn(textClass.meta, "mt-1 block text-destructive")}>{error}</span>}
      {hint && !error && (
        <span className={cn(textClass.meta, "mt-1 block text-muted-foreground")}>{hint}</span>
      )}
    </label>
  );
}
