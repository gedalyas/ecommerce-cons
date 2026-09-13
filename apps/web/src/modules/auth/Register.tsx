import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { registerSchema, userRoleLabel, type RegisterInput } from "@ecommerce/contracts/auth";
import { Button } from "@/shared/ui/Button";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/Input";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { AuthCard } from "./AuthCard";
import { registerFn } from "./authController";
import type { InvitationLookup } from "./authService";

const signInFooter = (
  <>
    Já tem conta?{" "}
    <Link to="/entrar" className="font-semibold text-primary underline underline-offset-2">
      Entrar
    </Link>
  </>
);

export function Register({ token, invitation }: { token: string; invitation: InvitationLookup }) {
  const register = useServerFn(registerFn);
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { token, name: "", password: "" },
  });

  const submit = form.handleSubmit(async (input) => {
    setMessage(null);
    const result = await register({ data: input });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    window.location.assign("/");
  });

  if (!invitation.ok) {
    return (
      <AuthCard title="Convite inválido" description={invitation.message} footer={signInFooter}>
        <p className={cn(textClass.meta, "text-muted-foreground")}>
          Se o link expirou, peça à sua consultoria para reenviar o convite.
        </p>
      </AuthCard>
    );
  }

  const { email, role, storeName } = invitation.invitation;
  return (
    <AuthCard
      title="Criar conta"
      description={`Convite de ${userRoleLabel[role].toLowerCase()}${storeName ? ` para ${storeName}` : ""}.`}
      footer={signInFooter}
    >
      <form className="grid gap-4" onSubmit={(e) => void submit(e)} noValidate>
        <FormField label="E-mail">
          <Input value={email} readOnly aria-readonly type="email" autoComplete="email" />
        </FormField>
        <FormField label="Seu nome" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} autoComplete="name" />
        </FormField>
        <FormField label="Senha" error={form.formState.errors.password?.message}>
          <Input {...form.register("password")} type="password" autoComplete="new-password" />
        </FormField>
        {message && (
          <p role="alert" className={cn(textClass.meta, "text-destructive")}>
            {message}
          </p>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting} className="mt-2 w-full">
          {form.formState.isSubmitting ? "Criando…" : "Criar conta"}
        </Button>
      </form>
    </AuthCard>
  );
}
