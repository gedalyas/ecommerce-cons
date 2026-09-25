import type { SourceStamp } from "@ecommerce/contracts/marketing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";

export function SourceStamps({ sources }: { sources: SourceStamp[] }) {
  if (sources.length === 0) {
    return (
      <p className={cn(textClass.meta, "text-muted-foreground")}>
        Nenhuma fonte conectada para esta aba.
      </p>
    );
  }
  return (
    <p className={cn(textClass.meta, "text-muted-foreground")}>
      Última atualização:{" "}
      {sources.map((s, i) => (
        <span key={s.name} className={cn(s.stale && "text-warning")}>
          {i > 0 && " · "}
          {s.text}
        </span>
      ))}
    </p>
  );
}
