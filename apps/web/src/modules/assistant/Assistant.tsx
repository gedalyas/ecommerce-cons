import { Button } from "@/shared/ui/Button";
import { ScrollShadows } from "@/shared/ui/ScrollShadow";
import { useScrollShadow } from "@/shared/hooks/useScrollShadow";
import { shadowClass } from "@/shared/styles/shadows";
import { cn } from "@/shared/utils/cn";
import { AssistantComposer } from "./AssistantComposer";
import { useAssistant } from "./useAssistant";
import { AssistantThread } from "./AssistantThread";

export function Assistant() {
  const { turns, clear, pending } = useAssistant();
  const { ref, top, bottom } = useScrollShadow<HTMLDivElement>();

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        <div ref={ref} className="h-full overflow-y-auto px-4 py-6 sm:px-6 xl:px-8">
          <div className="mx-auto w-full min-w-0 max-w-[760px]">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="t-section-title text-foreground">Assistente</h1>
                <p className="t-body mt-2 text-muted-foreground">
                  Converse sobre os números da sua loja.
                </p>
              </div>
              {turns.length > 0 && (
                <Button variant="outline" size="sm" onClick={clear} disabled={pending}>
                  Limpar conversa
                </Button>
              )}
            </div>
            <AssistantThread compact={false} />
          </div>
          <ScrollShadows bottom={bottom} />
        </div>
      </div>

      <div
        className={cn(
          "shrink-0 border-t border-border bg-background px-4 py-4 sm:px-6 xl:px-8",
          top && shadowClass.raisedTop,
        )}
      >
        <div className="mx-auto w-full min-w-0 max-w-[760px]">
          <AssistantComposer />
        </div>
      </div>
    </div>
  );
}
