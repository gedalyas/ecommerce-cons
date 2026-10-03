import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { ASSISTANT_MAX_TEXT } from "@ecommerce/contracts/assistant";
import { Textarea } from "@/shared/ui/Textarea";
import { AssistantIconButton } from "./AssistantIconButton";
import { useAssistant } from "./useAssistant";

const MAX_FIELD_HEIGHT = 6 * 24 + 16;

export function AssistantComposer() {
  const { send, pending } = useAssistant();
  const [draft, setDraft] = useState("");
  const field = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_FIELD_HEIGHT)}px`;
  }, [draft]);

  const canSend = draft.trim() !== "" && !pending;
  const submit = () => {
    if (!canSend) return;
    send(draft);
    setDraft("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 rounded-md border border-border bg-card px-2 py-2 focus-within:border-primary"
    >
      <Textarea
        ref={field}
        rows={1}
        value={draft}
        maxLength={ASSISTANT_MAX_TEXT}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        aria-label="Pergunta para o assistente"
        placeholder="Pergunte sobre os números..."
        className="min-h-9 resize-none border-0 px-1 py-1.5 focus-visible:ring-0 max-sm:text-base"
      />
      <AssistantIconButton label="Enviar" type="submit" variant="default" disabled={!canSend}>
        <ArrowUp />
      </AssistantIconButton>
    </form>
  );
}
