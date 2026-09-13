import { zodResolver } from "@hookform/resolvers/zod";
import { useBlocker } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { InfluencerStatus } from "@/generated/prisma/enums";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Input } from "@/shared/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";
import { CouponFields, RuleFields } from "./InfluencerRuleFields";
import { FormField as Field } from "./FormField";
import { influencerStatusLabel, type Influencer } from "./influencers.types";
import {
  influencerInputSchema,
  type InfluencerInput,
  type InfluencerParsed,
} from "./influencersSchema";

const emptyInput: InfluencerInput = {
  name: "",
  handle: "",
  status: "ACTIVE",
  notes: "",
  rules: [],
  coupons: [],
};

const toInput = (i: Influencer): InfluencerInput => ({
  name: i.name,
  handle: i.handle,
  status: i.status,
  notes: i.notes,
  rules: i.rules.map((r) => ({
    type: r.type,
    value: r.value,
    startDate: r.startDate,
    endDate: r.endDate ?? "",
    cap: r.cap,
    notes: r.notes,
  })),
  coupons: i.coupons.map((c) => ({
    code: c.code,
    activeFrom: c.activeFrom ?? "",
    activeUntil: c.activeUntil ?? "",
  })),
});

export function InfluencerForm({
  influencer,
  onSubmit,
  onCancel,
  submitting,
}: {
  influencer: Influencer | null;
  onSubmit: (input: InfluencerParsed) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const form = useForm<InfluencerInput, unknown, InfluencerParsed>({
    resolver: zodResolver(influencerInputSchema),
    defaultValues: influencer ? toInput(influencer) : emptyInput,
  });
  const { register, handleSubmit, formState, setValue, watch } = form;
  const isDirty = formState.isDirty;

  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const blocker = useBlocker({
    shouldBlockFn: () => isDirty && !submitting,
    withResolver: true,
    enableBeforeUnload: false,
  });

  return (
    <>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={handleSubmit((input) => void onSubmit(input))}
        noValidate
      >
        <Field label="Nome" error={formState.errors.name?.message}>
          <Input {...register("name")} maxLength={120} placeholder="Ex.: Luiza Casa & Cor" />
        </Field>
        <Field label="Identificador" error={formState.errors.handle?.message}>
          <Input {...register("handle")} maxLength={60} placeholder="@usuario" />
        </Field>
        <Field label="Status">
          <Select
            value={watch("status")}
            onValueChange={(v) => setValue("status", v as InfluencerStatus, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(InfluencerStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {influencerStatusLabel[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Observações" error={formState.errors.notes?.message}>
          <Textarea {...register("notes")} maxLength={500} rows={2} />
        </Field>

        <RuleFields form={form} />
        <CouponFields form={form} />

        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando…" : influencer ? "Salvar alterações" : "Adicionar"}
          </Button>
        </div>
      </form>

      <Dialog
        open={blocker.status === "blocked"}
        onOpenChange={(open) => {
          if (!open && blocker.status === "blocked") blocker.reset();
        }}
        title="Descartar alterações não salvas?"
        description="Você editou este influenciador e ainda não salvou. Ao sair, as alterações serão perdidas."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => blocker.status === "blocked" && blocker.reset()}>
            Continuar editando
          </Button>
          <Button
            variant="destructive"
            onClick={() => blocker.status === "blocked" && blocker.proceed()}
          >
            Descartar
          </Button>
        </div>
      </Dialog>
    </>
  );
}
