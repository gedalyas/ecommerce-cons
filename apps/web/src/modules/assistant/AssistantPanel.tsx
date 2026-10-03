import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PanelRightClose, PanelRightOpen, X } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { useScrollShadow } from "@/shared/hooks/useScrollShadow";
import { shadowClass } from "@/shared/styles/shadows";
import { cn } from "@/shared/utils/cn";
import { AssistantComposer } from "./AssistantComposer";
import { AssistantIconButton } from "./AssistantIconButton";
import { useAssistant } from "./useAssistant";
import { AssistantThread } from "./AssistantThread";
import { assistantContextLabel } from "./assistantConversation";

function AssistantHeader({ closeAction }: { closeAction: ReactNode }) {
  const { screen, turns, clear, pending } = useAssistant();
  return (
    <div className="flex min-w-0 items-start justify-between gap-2 border-b border-border px-4 py-3">
      <div className="min-w-0">
        <div className="t-card-title text-foreground">Assistente</div>
        <div className="t-meta mt-1 truncate text-muted-foreground">
          Vendo: {assistantContextLabel(screen)}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {turns.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear} disabled={pending}>
            Limpar
          </Button>
        )}
        {closeAction}
      </div>
    </div>
  );
}

function AssistantConversation() {
  const { ref, top } = useScrollShadow<HTMLDivElement>();
  return (
    <>
      <div className="relative min-h-0 flex-1">
        <div ref={ref} className="h-full overflow-y-auto px-4 py-4">
          <AssistantThread compact />
        </div>
      </div>
      <div
        className={cn(
          "border-t border-border p-4 transition-shadow duration-200",
          top && shadowClass.raisedTop,
        )}
      >
        <AssistantComposer />
      </div>
    </>
  );
}

export function AssistantPanel() {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="sticky top-0 hidden h-dvh w-14 shrink-0 flex-col items-center gap-3 border-l border-border bg-card py-4 xl:flex">
        <AssistantIconButton label="Abrir assistente" onClick={() => setCollapsed(false)}>
          <PanelRightOpen />
        </AssistantIconButton>
      </div>
    );
  }

  return (
    <div className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-l border-border bg-background xl:flex">
      <AssistantHeader
        closeAction={
          <AssistantIconButton label="Recolher assistente" onClick={() => setCollapsed(true)}>
            <PanelRightClose />
          </AssistantIconButton>
        }
      />
      <AssistantConversation />
    </div>
  );
}

export function AssistantFab() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="xl:hidden">
      {!open && (
        <>
          <Button
            asChild
            className="fixed bottom-20 right-4 z-40 h-11 rounded-lg px-4 shadow-lg md:hidden"
          >
            <Link to="/assistente">Assistente</Link>
          </Button>
          <Button
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 hidden h-11 rounded-lg px-5 shadow-lg md:inline-flex"
          >
            Assistente
          </Button>
        </>
      )}

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-foreground/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Assistente"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col border-l border-border bg-background shadow-lg md:w-100"
          >
            <AssistantHeader
              closeAction={
                <AssistantIconButton label="Fechar assistente" onClick={() => setOpen(false)}>
                  <X />
                </AssistantIconButton>
              }
            />
            <AssistantConversation />
          </div>
        </>
      )}
    </div>
  );
}
