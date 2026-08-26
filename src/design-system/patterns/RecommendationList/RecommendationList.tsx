import { cn } from "@/lib/utils";
import { textClass } from "../../tokens/typography";
import type { RecommendationListProps } from "./types";

/** Linhas simples separadas por divisória horizontal. Sem caixa externa. */
export function RecommendationList({ items }: RecommendationListProps) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.text} className="flex flex-wrap items-center justify-between gap-2 py-4">
          <span className="min-w-0 text-[15px] text-foreground">{item.text}</span>
          <span className={cn(textClass.meta, "flex flex-wrap items-center gap-4 text-muted-foreground")}>
            <span className={textClass.numeric}>{item.prazo}</span>
            <span>{item.responsavel}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
