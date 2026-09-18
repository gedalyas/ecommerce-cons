import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginInput } from "@ecommerce/contracts/auth";
import { Button } from "@/shared/ui/Button";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/Input";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { AuthCard } from "./AuthCard";
import { loginFn } from "./authController";

export function Login() {
  const login = useServerFn(loginFn);
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
    window.location.assign(result.user.role === "CLIENT" ? "/" : "/admin");
  });

  return (
    <AuthCard
      title="Entrar"
      description="Acesse o painel da sua loja."
      footer={
        <>
          Recebeu um convite?{" "}
          <Link to="/cadastro" className="font-semibold text-primary underline underline-offset-2">
            Criar conta
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={(e) => void submit(e)} noValidate>
        <FormField label="E-mail" error={formState.errors.email?.message}>
          <Input {...register("email")} type="email" autoComplete="email" />
        </FormField>
        <FormField label="Senha" error={formState.errors.password?.message}>
          <Input {...register("password")} type="password" autoComplete="current-password" />
        </FormField>
        <Link
          to="/esqueci-senha"
          className={cn(textClass.meta, "-mt-2 justify-self-end text-primary underline")}
        >
          Esqueci minha senha
        </Link>
        {message && (
          <p role="alert" className={cn(textClass.meta, "text-destructive")}>
            {message}
          </p>
        )}
        <Button type="submit" disabled={formState.isSubmitting} className="mt-2 w-full">
          {formState.isSubmitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </AuthCard>
  );
}
