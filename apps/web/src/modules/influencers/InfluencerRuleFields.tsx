import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { PROTOTYPE_TODAY } from "@ecommerce/contracts/shared/clock";
import { FormField as Field } from "@/shared/ui/FormField";
import {
  influencerRuleTypeLabel,
  influencerRuleTypes,
  percentRuleTypes,
  type InfluencerRuleType,
} from "@ecommerce/contracts/influencers";
import type { InfluencerInput, InfluencerParsed } from "@ecommerce/contracts/influencers";

type Form = UseFormReturn<InfluencerInput, unknown, InfluencerParsed>;

function GroupHeader({ title, onAdd, label }: { title: string; onAdd: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between sm:col-span-2">
      <span className={cn(textClass.cardTitle)}>{title}</span>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4" /> {label}
      </Button>
    </div>
  );
}

export function RuleFields({ form }: { form: Form }) {
  const { control, register, watch, setValue, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "rules" });
  return (
    <>
      <GroupHeader
        title="Remuneração"
        label="Adicionar regra"
        onAdd={() =>
          append({
            type: "MONTHLY",
            value: 0,
            startDate: PROTOTYPE_TODAY,
            endDate: "",
            cap: null,
            notes: "",
          })
        }
      />
      {fields.length === 0 && (
        <p className={cn(textClass.meta, "text-muted-foreground sm:col-span-2")}>
          Sem regras: a parceria não tem custo no período.
        </p>
      )}
      {fields.map((field, index) => {
        const type = watch(`rules.${index}.type`);
        const percent = percentRuleTypes.includes(type);
        const errors = formState.errors.rules?.[index];
        return (
          <div
            key={field.id}
            className={cn(
              "grid gap-3 border border-border p-3 sm:col-span-2 sm:grid-cols-6",
              radiusClass.control,
            )}
          >
            <Field label="Tipo" className="sm:col-span-2">
              <Select
                value={type}
                onValueChange={(v) =>
                  setValue(`rules.${index}.type`, v as InfluencerRuleType, { shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {influencerRuleTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {influencerRuleTypeLabel[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={percent ? "Valor (%)" : "Valor (R$)"} error={errors?.value?.message}>
              <Input
                type="number"
                step="0.01"
                min={0}
                {...register(`rules.${index}.value`, { valueAsNumber: true })}
              />
            </Field>
            <Field label="Início" error={errors?.startDate?.message}>
              <Input type="date" {...register(`rules.${index}.startDate`)} />
            </Field>
            <Field label="Término" error={errors?.endDate?.message}>
              <Input type="date" {...register(`rules.${index}.endDate`)} />
            </Field>
            <Field label="Limite por período (R$)" error={errors?.cap?.message}>
              <Input
                type="number"
                step="0.01"
                min={0}
                {...register(`rules.${index}.cap`, {
                  setValueAs: (v: string) => (v === "" ? null : Number(v)),
                })}
              />
            </Field>
            <Field label="Observações" className="sm:col-span-5" error={errors?.notes?.message}>
              <Input {...register(`rules.${index}.notes`)} maxLength={250} />
            </Field>
            <div className="flex items-end justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                aria-label="Remover regra"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </>
  );
}

export function CouponFields({ form }: { form: Form }) {
  const { control, register, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "coupons" });
  return (
    <>
      <GroupHeader
        title="Códigos de desconto"
        label="Adicionar cupom"
        onAdd={() => append({ code: "", activeFrom: "", activeUntil: "" })}
      />
      {fields.length === 0 && (
        <p className={cn(textClass.meta, "text-muted-foreground sm:col-span-2")}>
          Sem cupom: nenhum pedido será atribuído à parceria.
        </p>
      )}
      {fields.map((field, index) => {
        const errors = formState.errors.coupons?.[index];
        return (
          <div
            key={field.id}
            className={cn(
              "grid gap-3 border border-border p-3 sm:col-span-2 sm:grid-cols-4",
              radiusClass.control,
            )}
          >
            <Field label="Código" error={errors?.code?.message}>
              <Input {...register(`coupons.${index}.code`)} maxLength={40} className="uppercase" />
            </Field>
            <Field label="Ativo desde" error={errors?.activeFrom?.message}>
              <Input type="date" {...register(`coupons.${index}.activeFrom`)} />
            </Field>
            <Field label="Ativo até" error={errors?.activeUntil?.message}>
              <Input type="date" {...register(`coupons.${index}.activeUntil`)} />
            </Field>
            <div className="flex items-end justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                aria-label="Remover cupom"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </>
  );
}
