import { useEffect, useRef } from "react";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/utils/cn";
import { useAssistant } from "./useAssistant";
import { assistantSuggestions, type AssistantTurn } from "./assistantConversation";

function TurnBubble({ turn, compact }: { turn: AssistantTurn; compact: boolean }) {
  const text = compact ? "t-meta" : "t-body";
  if (turn.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className={cn(
            "min-w-0 max-w-[85%] rounded-lg px-3 py-2",
            compact ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
          )}
        >
          <p className={cn(text, "whitespace-pre-line break-words")}>{turn.text}</p>
        </div>
      </div>
    );
  }
  if (turn.role === "notice") {
    return (
      <div className="rounded-lg bg-warning-soft px-3 py-2">
        <p className={cn(text, "break-words text-foreground")}>{turn.text}</p>
      </div>
    );
  }
  return (
    <div className={cn("min-w-0", compact && "rounded-lg border border-border bg-card px-3 py-2")}>
      <div className="t-label mb-1 text-muted-foreground">{turn.origin}</div>
      <p className={cn(text, "whitespace-pre-line break-words text-foreground")}>{turn.text}</p>
      {turn.caveats.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-border pt-2">
          {turn.caveats.map((caveat) => (
            <li key={caveat} className="t-meta break-words text-muted-foreground">
              {caveat}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Typing() {
  return (
    <div className="flex items-center gap-1 py-2" role="status" aria-label="Assistente digitando">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot h-1 w-1 rounded-sm bg-muted-foreground"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function Suggestions({ compact }: { compact: boolean }) {
  const { screen, send } = useAssistant();
  return (
    <div className="space-y-3">
      <p className={cn(compact ? "t-meta" : "t-body", "text-muted-foreground")}>
        Pergunte sobre os números da sua loja. O assistente lê os dados do período escolhido e avisa
        quando alguma fonte está incompleta.
      </p>
      <div className={cn("grid gap-2", !compact && "sm:grid-cols-3")}>
        {assistantSuggestions(screen).map((question) => (
          <Button
            key={question}
            variant="outline"
            onClick={() => send(question)}
            className="h-auto min-h-11 justify-start whitespace-normal py-2 text-left"
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function AssistantThread({ compact }: { compact: boolean }) {
  const { turns, pending } = useAssistant();
  const end = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [turns.length, pending]);

  return (
    <div className={compact ? "space-y-3" : "space-y-6"}>
      {turns.length === 0 && !pending && <Suggestions compact={compact} />}
      {turns.map((turn, i) => (
        <TurnBubble key={i} turn={turn} compact={compact} />
      ))}
      {pending && <Typing />}
      <div ref={end} />
    </div>
  );
}
