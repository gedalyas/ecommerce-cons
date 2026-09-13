import { Card } from "./Card";
import { Button } from "./Button";
import { cn } from "@/shared/utils/cn";
import { textClass } from "@/shared/styles/typography";

/**
 * The "falha na requisição" state: a data block (or a whole screen) could not
 * load. Distinct from the empty state, which means the query worked and found
 * nothing.
 */
export function RequestError({
  title = "Falha na requisição",
  description = "Não foi possível carregar os dados. Ocorreu um erro ao tentar buscar as informações.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Card tone="warning" className={cn("p-5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className={cn(textClass.cardTitle, "text-foreground")}>{title}</h2>
          <p className={cn(textClass.meta, "mt-1 text-muted-foreground")}>{description}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </div>
    </Card>
  );
}
