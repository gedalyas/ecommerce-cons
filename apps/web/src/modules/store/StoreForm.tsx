import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { connectorCatalog, storefrontConnectorKeys } from "@ecommerce/contracts/connectors";
import {
  revenueBandLabel,
  revenueBands,
  storeProfileSchema,
  storeSegmentLabel,
  storeSegments,
  type StoreProfile,
  type StoreProfileInput,
  type StoreProfileParsed,
} from "@ecommerce/contracts/store";
import { Button } from "@/shared/ui/Button";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";

const NONE = "__none__";

const platformOptions = connectorCatalog
  .filter((c) => (storefrontConnectorKeys as string[]).includes(c.key))
  .map((c) => ({ key: c.key, label: c.label }));

function toInput(profile: StoreProfile | null): StoreProfileInput {
  return {
    name: profile?.name ?? "",
    segment: profile?.segment ?? null,
    platform: profile?.platform ?? null,
    monthlyRevenueBand: profile?.monthlyRevenueBand ?? null,
    timezone: profile?.timezone ?? "America/Sao_Paulo",
  };
}

export function StoreForm({
  profile,
  submitLabel,
  onSubmit,
}: {
  profile: StoreProfile | null;
  submitLabel: string;
  onSubmit: (input: StoreProfileParsed) => Promise<string | null>;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<StoreProfileInput, unknown, StoreProfileParsed>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: toInput(profile),
  });
  const { register, handleSubmit, formState, setValue, watch } = form;

  const submit = handleSubmit(async (input) => {
    setMessage(null);
    const error = await onSubmit(input);
    if (error) setMessage(error);
  });

  const selectField = (
    key: "segment" | "platform" | "monthlyRevenueBand",
    label: string,
    options: readonly { key: string; label: string }[],
  ) => (
    <FormField label={label} error={formState.errors[key]?.message}>
      <Select
        value={watch(key) ?? NONE}
        onValueChange={(v) => {
          const next = v === NONE ? null : v;
          if (key === "segment")
            setValue(key, next as StoreProfileInput["segment"], { shouldDirty: true });
          else if (key === "platform") setValue(key, next, { shouldDirty: true });
          else
            setValue(key, next as StoreProfileInput["monthlyRevenueBand"], { shouldDirty: true });
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Não informado</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.key} value={o.key}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => void submit(e)} noValidate>
      <FormField
        label="Nome da loja"
        error={formState.errors.name?.message}
        className="sm:col-span-2"
      >
        <Input {...register("name")} maxLength={80} placeholder="Ex.: Casa Bonita" />
      </FormField>
      {selectField(
        "segment",
        "Segmento",
        storeSegments.map((key) => ({ key, label: storeSegmentLabel[key] })),
      )}
      {selectField("platform", "Plataforma da loja", platformOptions)}
      {selectField(
        "monthlyRevenueBand",
        "Faturamento mensal",
        revenueBands.map((key) => ({ key, label: revenueBandLabel[key] })),
      )}
      {message && (
        <p role="alert" className={cn(textClass.meta, "text-destructive sm:col-span-2")}>
          {message}
        </p>
      )}
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
