import { zodResolver } from "@hookform/resolvers/zod";
import { useBlocker } from "@tanstack/react-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Input } from "@/shared/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";
import { cn } from "@/shared/utils/cn";
import { textClass } from "@/shared/styles/typography";
import { todayIso } from "@ecommerce/contracts/shared/clock";
import {
  businessUnits,
  costCategories,
  costFrequencies,
  businessUnitLabel,
  costCategoryLabel,
  costFrequencyLabel,
  costSubcategories,
  percentFrequencies,
  costInputSchema,
  type CostInput,
} from "@ecommerce/contracts/money";
import type { CostRuleRow } from "@ecommerce/contracts/money";

const emptyInput: CostInput = {
  name: "",
  description: "",
  businessUnit: "BOTH",
  category: "OPERATIONAL",
  subcategory: "other",
  frequency: "MONTHLY",
  value: 0,
  startDate: todayIso().slice(0, 8) + "01",
  endDate: null,
};

const toInput = (rule: CostRuleRow): CostInput => ({
  name: rule.name,
  description: rule.description,
  businessUnit: rule.businessUnit,
  category: rule.category,
  subcategory: rule.subcategory,
  frequency: rule.frequency,
  value: rule.value,
  startDate: rule.startDate,
  endDate: rule.endDate,
});

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className={cn(textClass.label, "text-muted-foreground")}>{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className={cn(textClass.meta, "mt-1 block text-destructive")}>{error}</span>}
    </label>
  );
}

/**
 * "Adicionar / editar custo ou despesa". Navigating away with unsaved changes
 * asks for confirmation (router blocker + beforeunload).
 */
export function CostForm({
  rule,
  onSubmit,
  onCancel,
  submitting,
}: {
  rule: CostRuleRow | null;
  onSubmit: (input: CostInput) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const form = useForm<CostInput>({
    resolver: zodResolver(costInputSchema),
    defaultValues: rule ? toInput(rule) : emptyInput,
  });
  const { control, register, handleSubmit, watch, setValue, formState } = form;
  const category = watch("category");
  const frequency = watch("frequency");
  const isDirty = formState.isDirty;

  useEffect(() => {
    const subcategories = costSubcategories[category];
    if (!subcategories.some((s) => s.key === form.getValues("subcategory"))) {
      setValue("subcategory", subcategories[0]!.key, { shouldDirty: true });
    }
  }, [category, form, setValue]);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const blocker = useBlocker({
    shouldBlockFn: () => isDirty && !submitting,
    withResolver: true,
    enableBeforeUnload: false,
  });

  const percent = percentFrequencies.includes(frequency);

  return (
    <>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={handleSubmit((input) => void onSubmit(input))}
        noValidate
      >
        <Field label="Nome" error={formState.errors.name?.message} className="sm:col-span-2">
          <Input {...register("name")} maxLength={75} placeholder="Ex.: Taxa do adquirente" />
        </Field>
        <Field
          label="Descrição"
          error={formState.errors.description?.message}
          className="sm:col-span-2"
        >
          <Textarea {...register("description")} maxLength={250} />
        </Field>

        <Controller
          control={control}
          name="businessUnit"
          render={({ field }) => (
            <Field label="Unidade de negócio" error={formState.errors.businessUnit?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {businessUnits.map((u) => (
                    <SelectItem key={u} value={u}>
                      {businessUnitLabel[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="frequency"
          render={({ field }) => (
            <Field label="Frequência" error={formState.errors.frequency?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {costFrequencies.map((f) => (
                    <SelectItem key={f} value={f}>
                      {costFrequencyLabel[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Field label="Categoria" error={formState.errors.category?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {costCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {costCategoryLabel[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="subcategory"
          render={({ field }) => (
            <Field label="Subcategoria" error={formState.errors.subcategory?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {costSubcategories[category].map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <Field label={percent ? "Valor (%)" : "Valor (R$)"} error={formState.errors.value?.message}>
          <Input
            type="number"
            step="0.01"
            min={0}
            inputMode="decimal"
            {...register("value", { valueAsNumber: true })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Início" error={formState.errors.startDate?.message}>
            <Input type="date" {...register("startDate")} />
          </Field>
          <Field label="Fim" error={formState.errors.endDate?.message}>
            <Input
              type="date"
              {...register("endDate", { setValueAs: (v: string) => (v === "" ? null : v) })}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando…" : rule ? "Salvar alterações" : "Adicionar"}
          </Button>
        </div>
      </form>

      <Dialog
        open={blocker.status === "blocked"}
        onOpenChange={(open) => {
          if (!open && blocker.status === "blocked") blocker.reset();
        }}
        title="Descartar alterações não salvas?"
        description="Você editou este custo e ainda não salvou. Ao sair, as alterações serão perdidas."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => blocker.status === "blocked" && blocker.reset()}>
            Continuar editando
          </Button>
          <Button
            variant="destructive"
            onClick={() => blocker.status === "blocked" && blocker.proceed()}
          >
            Sair sem salvar
          </Button>
        </div>
      </Dialog>
    </>
  );
}
