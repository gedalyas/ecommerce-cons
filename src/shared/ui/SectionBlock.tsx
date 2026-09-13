import { Card } from "./Card";
import { cn } from "@/shared/utils/cn";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import type { SectionBlockProps } from "./sectionBlock.types";

export type { SectionBlockProps } from "./sectionBlock.types";

/** Content block: a card with an optional header and a body. */
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
