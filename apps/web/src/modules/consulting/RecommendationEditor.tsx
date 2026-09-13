import { useServerFn } from "@tanstack/react-start";
import { Check, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ConsultingPillar } from "@ecommerce/contracts/consulting";
import { todayIso } from "@ecommerce/contracts/shared/clock";
import { formatDate } from "@ecommerce/contracts/shared/format";
import { Button } from "@/shared/ui/Button";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/Input";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import {
  createRecommendationFn,
  deleteRecommendationFn,
  setRecommendationDoneFn,
} from "./consultingController";
import { useEditRun } from "./useEditRun";

export function RecommendationEditor({ pillar }: { pillar: ConsultingPillar }) {
  const create = useServerFn(createRecommendationFn);
  const setDone = useServerFn(setRecommendationDoneFn);
  const remove = useServerFn(deleteRecommendationFn);
  const { busy, error, run } = useEditRun();
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState(todayIso());
  const [owner, setOwner] = useState("");

  const add = async () => {
    const ok = await run(() => create({ data: { pillarKey: pillar.key, text, dueDate, owner } }));
    if (ok) {
      setText("");
      setOwner("");
    }
  };

  return (
    <div>
      <div className={cn(textClass.label, "text-muted-foreground")}>Recomendações em aberto</div>
      <ul className="mt-2 divide-y divide-border">
        {pillar.recommendations.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2">
            <span className="min-w-0 flex-1 text-[13px] text-foreground">
              {r.text}
              <span className={cn(textClass.meta, "ml-2 text-muted-foreground")}>
                até {formatDate(`${r.dueDate}T00:00:00`)} · {r.owner}
              </span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Marcar como feita"
              disabled={busy}
              onClick={() => void run(() => setDone({ data: { id: r.id, done: true } }))}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Excluir recomendação"
              disabled={busy}
              onClick={() => void run(() => remove({ data: { id: r.id } }))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
        {pillar.recommendations.length === 0 && (
          <li className={cn(textClass.meta, "py-2 text-muted-foreground")}>Nenhuma em aberto.</li>
        )}
      </ul>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_9rem_10rem_auto] sm:items-end">
        <FormField label="Nova recomendação">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
            placeholder="O que fazer"
          />
        </FormField>
        <FormField label="Prazo">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </FormField>
        <FormField label="Responsável">
          <Input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            maxLength={80}
            placeholder="Nome (área)"
          />
        </FormField>
        <Button
          size="sm"
          disabled={busy || !text.trim() || !owner.trim()}
          onClick={() => void add()}
        >
          Adicionar
        </Button>
      </div>
      {error && (
        <p role="alert" className={cn(textClass.meta, "mt-2 text-destructive")}>
          {error}
        </p>
      )}
    </div>
  );
}
