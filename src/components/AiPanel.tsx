import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ArrowUp, CalendarCheck, PanelRightClose, PanelRightOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function AiPanel() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
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

  if (collapsed) {
    return (
      <div className="flex h-screen w-14 shrink-0 flex-col items-center gap-3 border-l border-border bg-card py-4">
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(false)} aria-label="Abrir assistente">
          <PanelRightOpen className="h-4 w-4" />
        </Button>
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-90 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Assistente
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">Vendo: {context}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} aria-label="Recolher assistente">
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <div className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Perguntas sugeridas
          </div>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-left text-xs text-foreground transition-colors hover:border-primary hover:bg-accent"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="space-y-3 border-t border-border pt-3">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[92%] rounded-lg px-3 py-2 text-xs leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-foreground",
                )}
              >
                {m.pillar && (
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {m.pillar}
                  </div>
                )}
                <p>{m.text}</p>
                {m.meeting && (
                  <Button variant="outline" size="sm" className="mt-2.5 h-7 gap-1.5 text-[11px]">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Levar para a reunião com o consultor
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="border-t border-border p-3"
      >
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 focus-within:border-primary">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Pergunte sobre os números..."
            className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" size="icon" className="h-7 w-7" aria-label="Enviar">
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
