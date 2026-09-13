import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { registerSchema, userRoleLabel, type RegisterInput } from "@ecommerce/contracts/auth";
import { Button } from "@/shared/ui/Button";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/Input";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { AuthCard } from "./AuthCard";
import { getInvitation, registerFn } from "./authController";
import type { InvitationLookup } from "./authService";

export function Register({ email }: { email: string }) {
  const register = useServerFn(registerFn);
  const lookup = useServerFn(getInvitation);
  const [invitation, setInvitation] = useState<InvitationLookup | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email, name: "", password: "" },
  });
  const watchedEmail = form.watch("email");

  useEffect(() => {
    if (!watchedEmail || !watchedEmail.includes("@")) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void lookup({ data: { email: watchedEmail } }).then((result) => {
        if (!cancelled) setInvitation(result);
      });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [watchedEmail, lookup]);

  const submit = form.handleSubmit(async (input) => {
    setMessage(null);
    const result = await register({ data: input });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    window.location.assign("/");
  });

  return (
    <AuthCard
      title="Criar conta"
      description="Use o e-mail que sua consultoria liberou."
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/entrar" className="font-semibold text-primary underline underline-offset-2">
            Entrar
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={(e) => void submit(e)} noValidate>
        <FormField label="E-mail" error={form.formState.errors.email?.message}>
          <Input {...form.register("email")} type="email" autoComplete="email" />
        </FormField>
        {invitation && (
          <p
            role="status"
            className={cn(
              textClass.meta,
              invitation.ok ? "text-muted-foreground" : "text-destructive",
            )}
          >
            {invitation.ok
              ? `Convite de ${userRoleLabel[invitation.invitation.role].toLowerCase()}${
                  invitation.invitation.storeName ? ` para ${invitation.invitation.storeName}` : ""
                }.`
              : invitation.message}
          </p>
        )}
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
        <Button
          type="submit"
          disabled={form.formState.isSubmitting || (invitation !== null && !invitation.ok)}
          className="mt-2 w-full"
        >
          {form.formState.isSubmitting ? "Criando…" : "Criar conta"}
        </Button>
      </form>
    </AuthCard>
  );
}
