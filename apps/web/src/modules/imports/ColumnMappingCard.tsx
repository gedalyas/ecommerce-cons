import { Sparkles } from "lucide-react";
import { useState } from "react";
import {
  importTemplates,
  mappingProblems,
  type ColumnMapping,
  type ImportMappingPreview,
} from "@ecommerce/contracts/imports";
import { Button } from "@/shared/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { SKIP_COLUMN, sampleValueOf, sourceOptionsOf, withColumn } from "./columnMappingView";

export function ColumnMappingCard({
  step,
  busy,
  onConfirm,
  onCancel,
  onSuggest,
}: {
  step: ImportMappingPreview;
  busy: boolean;
  onConfirm: (mapping: ColumnMapping) => void;
  onCancel: () => void;
  onSuggest: () => Promise<ColumnMapping | null>;
}) {
  const [mapping, setMapping] = useState<ColumnMapping>(step.mapping);
  const [suggesting, setSuggesting] = useState(false);
  const suggest = async () => {
    setSuggesting(true);
    try {
      const suggested = await onSuggest();
      if (suggested) setMapping(suggested);
    } finally {
      setSuggesting(false);
    }
  };
  const sources = sourceOptionsOf(step.header);
  const problems = mappingProblems(step.kind, step.header, mapping);
  return (
    <div className={cn("border border-border bg-card p-4", radiusClass.card)} role="region">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={cn(textClass.cardTitle, "text-foreground")}>Conferir colunas</div>
        {step.aiAvailable && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void suggest()}
            disabled={busy || suggesting}
          >
            <Sparkles className="h-4 w-4" /> {suggesting ? "Sugerindo…" : "Sugerir com IA"}
          </Button>
        )}
      </div>
      <p className={cn(textClass.meta, "mt-1 text-muted-foreground")}>
        {step.remembered
          ? "Usamos as colunas que você confirmou da última vez para esta planilha. Confira e siga."
          : "A planilha não segue o modelo. Diga qual coluna corresponde a cada campo — da próxima vez a gente lembra."}
      </p>
      {step.aiAvailable && (
        <p className={cn(textClass.meta, "mt-1 text-muted-foreground")}>
          "Sugerir com IA" envia à Anthropic os nomes das colunas e até 10 linhas anonimizadas
          (nomes, documentos, telefones e e-mails viram marcadores).
        </p>
      )}
      <ul className="mt-4 divide-y divide-border">
        {importTemplates[step.kind].columns.map((column) => {
          const source = mapping[column.key] ?? null;
          const example = sampleValueOf(step.header, step.sample, source);
          return (
            <li
              key={column.key}
              className="grid grid-cols-1 gap-2 py-2 md:grid-cols-[12rem_16rem_1fr] md:items-center"
            >
              <span className={cn(textClass.body, column.required && "font-semibold")}>
                {column.header}
                {column.required ? " *" : ""}
              </span>
              <Select
                value={source ?? SKIP_COLUMN}
                onValueChange={(next) => setMapping((prev) => withColumn(prev, column.key, next))}
              >
                <SelectTrigger aria-label={`Coluna de ${column.header}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SKIP_COLUMN}>Não usar</SelectItem>
                  {sources.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className={cn(textClass.meta, "truncate text-muted-foreground")}>
                {example ? `Ex.: ${example}` : `Modelo: ${column.example}`}
              </span>
            </li>
          );
        })}
      </ul>
      {problems.length > 0 && (
        <ul className={cn(textClass.meta, "mt-3 list-disc space-y-1 pl-5 text-warning")}>
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button
          onClick={() => onConfirm(mapping)}
          disabled={busy || suggesting || problems.length > 0}
        >
          {busy ? "Lendo…" : "Ver prévia"}
        </Button>
      </div>
    </div>
  );
}
