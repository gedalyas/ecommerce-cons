import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginInput } from "@ecommerce/contracts/auth";
import { Button } from "@/shared/ui/Button";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/Input";
import { radiusClass } from "@/shared/styles/radius";
import { shadowClass } from "@/shared/styles/shadows";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { loginFn } from "./authController";

export function Login() {
  const login = useServerFn(loginFn);
  const router = useRouter();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = handleSubmit(async (input) => {
    setMessage(null);
    const result = await login({ data: input });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    await router.invalidate();
    await navigate({ to: "/" });
  });

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8">
      <div
        className={cn(
          "w-full max-w-sm border border-border bg-card p-6",
          radiusClass.card,
          shadowClass.sm,
        )}
      >
        <div className={cn(textClass.label, "text-muted-foreground")}>E-commerce Insights</div>
        <h1 className={cn(textClass.sectionTitle, "mt-1 text-foreground")}>Entrar</h1>
        <p className={cn(textClass.meta, "mt-1 text-muted-foreground")}>
          Acesse o painel da sua consultoria.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={(e) => void submit(e)} noValidate>
          <FormField label="E-mail" error={formState.errors.email?.message}>
            <Input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="voce@empresa.com.br"
            />
          </FormField>
          <FormField label="Senha" error={formState.errors.password?.message}>
            <Input {...register("password")} type="password" autoComplete="current-password" />
          </FormField>
          {message && (
            <p role="alert" className={cn(textClass.meta, "text-destructive")}>
              {message}
            </p>
          )}
          <Button type="submit" disabled={formState.isSubmitting} className="mt-2 w-full">
            {formState.isSubmitting ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
