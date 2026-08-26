import { Card } from "../../primitives/Card";
import { cn } from "@/lib/utils";
import { layout } from "../../tokens/spacing";
import { textClass } from "../../tokens/typography";
import type { SectionBlockProps } from "./types";

/** Bloco de conteúdo: card com cabeçalho opcional e corpo. */
export function SectionBlock({
  title,
  meta,
  description,
  tone = "default",
  bodyClassName,
  className,
  children,
}: SectionBlockProps) {
  return (
    <Card tone={tone} {...(className ? { className } : {})}>
      {title && (
        <header className={layout.cardHeader}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={cn(textClass.cardTitle, "text-foreground")}>{title}</h2>
            {meta}
          </div>
          {description && (
            <p className={cn(textClass.meta, "mt-1 text-muted-foreground")}>{description}</p>
          )}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </Card>
  );
}
