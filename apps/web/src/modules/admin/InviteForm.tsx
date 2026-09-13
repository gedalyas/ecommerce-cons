import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  invitationInputSchema,
  type AdminStore,
  type InvitationInput,
} from "@ecommerce/contracts/admin";
import type { z } from "zod";
import { Button } from "@/shared/ui/Button";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { inviteFn } from "./adminController";

const NEW_STORE = "__new__";

type InviteInput = z.input<typeof invitationInputSchema>;

export function InviteForm({
  stores,
  canInviteConsultant,
}: {
  stores: AdminStore[];
  canInviteConsultant: boolean;
}) {
  const invite = useServerFn(inviteFn);
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const form = useForm<InviteInput, unknown, InvitationInput>({
    resolver: zodResolver(invitationInputSchema),
    defaultValues: { email: "", role: "CLIENT", clientId: null },
  });
  const role = form.watch("role");

  const submit = form.handleSubmit(async (input) => {
    setMessage(null);
    setSent(false);
    const result = await invite({ data: input });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    form.reset({ email: "", role: "CLIENT", clientId: null });
    setMessage(`Convite enviado para ${result.data.email}.`);
    setSent(true);
    await router.invalidate();
  });

  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
      onSubmit={(e) => void submit(e)}
      noValidate
    >
      <FormField label="E-mail" error={form.formState.errors.email?.message}>
        <Input {...form.register("email")} type="email" placeholder="pessoa@loja.com.br" />
      </FormField>
      <FormField label="Papel">
        <Select
          value={role}
          onValueChange={(v) =>
            form.setValue("role", v as InviteInput["role"], { shouldDirty: true })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CLIENT">Cliente</SelectItem>
            {canInviteConsultant && <SelectItem value="CONSULTANT">Consultor</SelectItem>}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={role === "CLIENT" ? "Loja" : "Loja atribuída"}>
        <Select
          value={form.watch("clientId") ?? NEW_STORE}
          onValueChange={(v) =>
            form.setValue("clientId", v === NEW_STORE ? null : v, { shouldDirty: true })
          }
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NEW_STORE}>
              {role === "CLIENT" ? "Nova loja (o convidado cria)" : "Nenhuma por enquanto"}
            </SelectItem>
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        Convidar
      </Button>
      {message && (
        <p
          role={sent ? "status" : "alert"}
          className={cn(
            textClass.meta,
            sent ? "text-muted-foreground" : "text-destructive",
            "sm:col-span-4",
          )}
        >
          {message}
        </p>
      )}
    </form>
  );
}
