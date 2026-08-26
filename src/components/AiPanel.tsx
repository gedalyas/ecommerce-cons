import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ArrowUp, PanelRightClose, PanelRightOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollShadows, useScrollShadow } from "@/components/ScrollShadow";
import { contextBySection, suggestionsBySection } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "ai"; text: string; pillar?: string; meeting?: boolean };

const initialMessages: Message[] = [
  { role: "user", text: "Por que meu CAC subiu?" },
  {
    role: "ai",
    text: "O CAC saiu de R$ 51 para R$ 62 (+21%) em agosto. O aumento vem quase todo de Google Ads: R$ 78 por cliente, contra R$ 54 em julho, com o investimento subindo 14% sem ganho de conversão. Meta Ads segue em R$ 48, mas está sem sincronizar há 6 dias, então parte do número é estimada.",
    pillar: "Marketing · Aquisição",
  },
  { role: "user", text: "Isso ameaça o marco de maturidade?" },
  {
    role: "ai",
    text: "Sim. O critério pede CAC abaixo de 1/3 do LTV, ou seja, R$ 41 com o LTV atual de R$ 384. Com R$ 62 você está 51% acima da meta, e esse é um dos 2 critérios que faltam para liberar as áreas bloqueadas.",
    pillar: "Gestão · Blindagem",
    meeting: true,
  },
];

const fixedReply =
  "Boa pergunta. Pelos dados de agosto, o ponto mais caro é o CAC de Google Ads (R$ 78) somado à queda de 3,4pp na margem de contribuição. Recomendo tratar preço dos 9 SKUs com margem abaixo de 10% antes de mexer em verba de mídia — o consultor pode revisar isso na próxima reunião.";

function useAssistant() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");

  const suggestions = suggestionsBySection[pathname] ?? suggestionsBySection["/"]!;
  const context = contextBySection[pathname] ?? "Dashboard";

  const send = (text: string) => {
    const value = text.trim();
    if (!value) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: value },
      { role: "ai", text: fixedReply, pillar: "Dinheiro · Organização" },
    ]);
    setDraft("");
  };

  return { messages, draft, setDraft, suggestions, context, send };
}

function AssistantHeader({
  context,
  onClose,
  closeIcon,
  closeLabel,
}: {
  context: string;
  onClose: () => void;
  closeIcon: React.ReactNode;
  closeLabel: string;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div className="min-w-0">
        <div className="t-card-title text-foreground">Assistente</div>
        <div className="t-meta mt-1 truncate text-muted-foreground">Vendo: {context}</div>
      </div>
      <Button variant="ghost" size="icon" onClick={onClose} aria-label={closeLabel}>
        {closeIcon}
      </Button>
    </div>
  );
}

function AssistantConversation({
  messages,
  suggestions,
  send,
  draft,
  setDraft,
}: {
  messages: Message[];
  suggestions: string[];
  send: (t: string) => void;
  draft: string;
  setDraft: (v: string) => void;
}) {
  const { ref, top } = useScrollShadow<HTMLDivElement>();

  return (
    <>
      <div className="relative min-h-0 flex-1">
        <div ref={ref} className="h-full space-y-6 overflow-y-auto px-5 py-4">
          <div className="space-y-2">
            <div className="t-label text-muted-foreground">Perguntas sugeridas</div>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-left t-meta text-foreground transition-colors duration-150 hover:border-border-strong hover:bg-muted"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "min-w-0 max-w-[92%] rounded-lg px-3 py-2 t-meta",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-foreground",
                  )}
                >
                  {m.pillar && (
                    <div
                      className={cn(
                        "t-label mb-1",
                        m.role === "user" ? "text-primary-foreground" : "text-muted-foreground",
                      )}
                    >
                      {m.pillar}
                    </div>
                  )}
                  <p className="break-words">{m.text}</p>
                  {m.meeting && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 h-auto min-h-8 whitespace-normal py-2 text-left"
                    >
                      Levar para a reunião com o consultor
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className={cn(
          "border-t border-border p-4 transition-shadow duration-200",
          top && "shadow-[0_-1px_2px_rgba(16,24,40,0.04)]",
        )}
      >
        <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2 focus-within:border-primary">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Pergunte sobre os números..."
            className="min-w-0 flex-1 bg-transparent t-meta text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" size="icon" className="h-8 w-8 shrink-0" aria-label="Enviar">
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </>
  );
}

/** Painel fixo à direita, apenas em telas >= 1280px. */
export function AiPanel() {
  const { messages, draft, setDraft, suggestions, context, send } = useAssistant();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="sticky top-0 hidden h-dvh w-14 shrink-0 flex-col items-center gap-3 border-l border-border bg-card py-4 xl:flex">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(false)}
          aria-label="Abrir assistente"
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="sticky top-0 hidden h-dvh w-90 shrink-0 flex-col border-l border-border bg-background xl:flex">
      <AssistantHeader
        context={context}
        onClose={() => setCollapsed(true)}
        closeIcon={<PanelRightClose className="h-4 w-4" />}
        closeLabel="Recolher assistente"
      />
      <AssistantConversation
        messages={messages}
        suggestions={suggestions}
        send={send}
        draft={draft}
        setDraft={setDraft}
      />
    </div>
  );
}

/** Botão flutuante + drawer, para telas < 1280px. */
export function AiDrawer() {
  const { messages, draft, setDraft, suggestions, context, send } = useAssistant();
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
        <Button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-40 h-12 px-4 md:bottom-6"
        >
          Assistente
        </Button>
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
              context={context}
              onClose={() => setOpen(false)}
              closeIcon={<X className="h-4 w-4" />}
              closeLabel="Fechar assistente"
            />
            <AssistantConversation
              messages={messages}
              suggestions={suggestions}
              send={send}
              draft={draft}
              setDraft={setDraft}
            />
          </div>
        </>
      )}
    </div>
  );
}
