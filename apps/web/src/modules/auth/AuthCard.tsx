import type { ReactNode } from "react";
import { radiusClass } from "@/shared/styles/radius";
import { shadowClass } from "@/shared/styles/shadows";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8">
      <div
        className={cn(
          "w-full max-w-sm border border-border bg-card p-6",
          radiusClass.card,
          shadowClass.sm,
        )}
      >
        <div className={cn(textClass.label, "text-muted-foreground")}>E-commerce Insights</div>
        <h1 className={cn(textClass.sectionTitle, "mt-1 text-foreground")}>{title}</h1>
        <p className={cn(textClass.meta, "mt-1 text-muted-foreground")}>{description}</p>
        <div className="mt-6">{children}</div>
        {footer && (
          <p className={cn(textClass.meta, "mt-6 text-center text-muted-foreground")}>{footer}</p>
        )}
      </div>
    </main>
  );
}
