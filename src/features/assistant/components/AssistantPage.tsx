import { useEffect, useRef, useState } from "react";
import { FileText, Mic, Paperclip, Play, Send, X } from "lucide-react";
import { ScrollShadows, useScrollShadow } from "@/design-system/patterns/ScrollShadow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Attachment = { name: string; size: string };

type Message =
  | { id: number; role: "user"; text?: string; file?: Attachment; audio?: string }
  | { id: number; role: "ai"; context: string; parts: string[]; meeting?: boolean };

const suggestions = [
  { title: "Analisar minha margem", desc: "Por que caiu em agosto" },
  { title: "Revisar meus criativos", desc: "Qual pausar e qual escalar" },
  { title: "Enviar meu extrato", desc: "Conciliar taxas do adquirente" },
  { title: "Preparar a reunião", desc: "O que levar para o consultor" },
];

const initialMessages: Message[] = [
  { id: 1, role: "user", text: "por que minha margem caiu esse mês?" },
  {
    id: 2,
    role: "ai",
    context: "Dinheiro · Organização",
    parts: [
      "A margem de contribuição fechou agosto em ",
      "19,2%",
      ", abaixo do mês anterior. O principal fator é o custo do SKU ",
      "AUR-114",
      ", que subiu sem reajuste de preço.",
    ],
  },
  {
    id: 3,
    role: "user",
    text: "consegue conferir as taxas?",
    file: { name: "extrato-agosto.pdf", size: "312 KB" },
  },
  {
    id: 4,
    role: "ai",
    context: "Dinheiro · Custos e taxas",
    parts: [
      "A taxa efetiva do mês ficou em ",
      "3,84%",
      ", acima do contratado. A diferença acumulada é de ",
      "R$ 2.680",
      " em agosto.",
    ],
    meeting: true,
  },
];

const fixedReply: string[] = [
  "Registrei sua mensagem. Pelos dados de agosto, o ponto mais sensível continua sendo a margem de ",
  "19,2%",
  " e o CAC de ",
  "R$ 62",
  ".",
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function FileChip({ file, onRemove }: { file: Attachment; onRemove?: () => void }) {
  return (
    <div className="inline-flex min-w-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate text-[13px] font-semibold text-foreground">
        {file.name}
      </span>
      <span className="t-meta shrink-0 text-muted-foreground">{file.size}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover ${file.name}`}
          className="ml-1 shrink-0 text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

const WAVE_HEIGHTS = [8, 16, 24, 12, 20, 28, 14, 22, 10, 18, 26, 12, 20, 16, 24, 10];

function Waveform({ animated }: { animated: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden" aria-hidden="true">
      {WAVE_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className={cn("w-1 shrink-0 rounded-sm bg-primary", animated && "wave-bar")}
          style={{ height: `${h}px`, animationDelay: `${(i % 8) * 0.1}s` }}
        />
      ))}
    </div>
  );
}

function AiText({ parts }: { parts: string[] }) {
  return (
    <p className="t-body text-foreground">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="num font-semibold">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

export function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [typing, setTyping] = useState(false);
  const [dragging, setDragging] = useState(false);

  const fileInput = useRef<HTMLInputElement | null>(null);
  const textarea = useRef<HTMLTextAreaElement | null>(null);
  const nextId = useRef(100);
  const { ref: scrollRef, top, bottom } = useScrollShadow<HTMLDivElement>();

  useEffect(() => {
    if (!recording) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 6 * 24 + 16)}px`;
  }, [draft]);

  const respond = () => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current++,
          role: "ai",
          context: "Dinheiro · Organização",
          parts: fixedReply,
        },
      ]);
    }, 800);
  };

  const send = (text?: string) => {
    const value = (text ?? draft).trim();
    if (!value && !attachment) return;
    const message: Message = {
      id: nextId.current++,
      role: "user",
      ...(value ? { text: value } : {}),
      ...(attachment ? { file: attachment } : {}),
    };
    setMessages((prev) => [...prev, message]);
    setDraft("");
    setAttachment(null);
    respond();
  };

  const sendAudio = () => {
    const duration = formatTime(elapsed || 14);
    setRecording(false);
    setMessages((prev) => [...prev, { id: nextId.current++, role: "user", audio: duration }]);
    respond();
  };

  const takeFile = (file: File | undefined) => {
    if (!file) return;
    setAttachment({ name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB` });
  };

  const empty = messages.length === 0;
  const canSend = draft.trim().length > 0 || attachment !== null;

  return (
    <div
      className="relative flex h-full min-h-0 flex-col"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        takeFile(e.dataTransfer.files[0]);
      }}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-4 z-30 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-accent/80">
          <span className="t-body font-semibold text-primary">Solte o arquivo para enviar</span>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <ScrollShadows top={top} bottom={bottom} />
        <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-6 sm:px-6 xl:px-8">
          <div className="mx-auto w-full min-w-0 max-w-[760px]">
            <div className="mb-8">
              <h1 className="t-section-title text-foreground">Assistente</h1>
              <p className="t-body mt-2 text-muted-foreground">
                Converse sobre os números da Loja Aurora, envie arquivos ou grave um áudio.
              </p>
            </div>

            {empty && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => send(s.title)}
                    className="min-h-11 rounded-lg border border-border bg-card p-5 text-left shadow-sm transition-shadow duration-150 hover:border-border-strong hover:shadow-md"
                  >
                    <div className="text-[15px] font-semibold text-foreground">{s.title}</div>
                    <div className="t-meta mt-1 text-muted-foreground">{s.desc}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-8 space-y-6">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="min-w-0 max-w-[80%] rounded-lg bg-muted px-4 py-3">
                      {m.audio ? (
                        <div className="flex min-w-0 items-center gap-3">
                          <button
                            type="button"
                            aria-label="Reproduzir áudio"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                          <Waveform animated={false} />
                          <span className="num t-meta shrink-0 text-muted-foreground">
                            {m.audio}
                          </span>
                        </div>
                      ) : (
                        <>
                          {m.file && (
                            <div className="mb-3">
                              <FileChip file={m.file} />
                            </div>
                          )}
                          {m.text && <p className="t-body break-words text-foreground">{m.text}</p>}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="py-6">
                    <div className="t-label mb-2 text-muted-foreground">{m.context}</div>
                    <AiText parts={m.parts} />
                    {m.meeting && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 h-auto min-h-11 whitespace-normal py-2 text-left"
                      >
                        Levar para a reunião com o consultor
                      </Button>
                    )}
                  </div>
                ),
              )}

              {typing && (
                <div className="flex items-center gap-1 py-6" aria-label="Assistente digitando">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="typing-dot h-1 w-1 rounded-sm bg-muted-foreground"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "shrink-0 border-t border-border bg-background px-4 py-4 sm:px-6 xl:px-8",
          top && "shadow-[0_-1px_2px_rgba(16,24,40,0.04)]",
        )}
      >
        <div className="mx-auto w-full min-w-0 max-w-[760px]">
          {recording ? (
            <div className="flex min-w-0 items-center gap-4">
              <span className="recording-dot h-2 w-2 shrink-0 rounded-sm bg-destructive" />
              <span className="num t-meta shrink-0 text-foreground">{formatTime(elapsed)}</span>
              <Waveform animated />
              <button
                type="button"
                onClick={() => setRecording(false)}
                className="min-h-11 shrink-0 px-3 text-[13px] font-semibold text-muted-foreground"
              >
                Cancelar
              </button>
              <Button type="button" onClick={sendAudio} className="min-h-11 shrink-0">
                Enviar
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              {attachment && (
                <div className="mb-3">
                  <FileChip file={attachment} onRemove={() => setAttachment(null)} />
                </div>
              )}
              <div className="flex items-end gap-2 rounded-md border border-border bg-card px-2 py-2 focus-within:border-primary">
                <input
                  ref={fileInput}
                  type="file"
                  className="hidden"
                  onChange={(e) => takeFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  aria-label="Anexar arquivo"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <textarea
                  ref={textarea}
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Pergunte alguma coisa..."
                  className="min-h-11 min-w-0 flex-1 resize-none self-center bg-transparent py-3 t-body text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setRecording(true)}
                  aria-label="Gravar áudio"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                >
                  <Mic className="h-4 w-4" />
                </button>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!canSend}
                  aria-label="Enviar"
                  className="h-11 w-11 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
