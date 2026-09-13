import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@ecommerce/contracts/auth";
import { Button } from "@/shared/ui/Button";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/Input";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { AuthCard } from "./AuthCard";
import { forgotPasswordFn } from "./authController";

const footer = (
  <Link to="/entrar" className="font-semibold text-primary underline underline-offset-2">
    Voltar para entrar
  </Link>
);

export function ForgotPassword() {
  const forgot = useServerFn(forgotPasswordFn);
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const submit = handleSubmit(async (input) => {
    setMessage(null);
    const result = await forgot({ data: input });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setSent(true);
  });

  if (sent) {
    return (
      <AuthCard
        title="Verifique seu e-mail"
        description="Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha. Ele vale por 60 minutos."
        footer={footer}
      >
        <p className={cn(textClass.meta, "text-muted-foreground")}>
          Não chegou? Confira a caixa de spam ou peça um novo link.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Esqueci minha senha"
      description="Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha."
      footer={footer}
    >
      <form className="grid gap-4" onSubmit={(e) => void submit(e)} noValidate>
        <FormField label="E-mail" error={formState.errors.email?.message}>
          <Input {...register("email")} type="email" autoComplete="email" />
        </FormField>
        {message && (
          <p role="alert" className={cn(textClass.meta, "text-destructive")}>
            {message}
          </p>
        )}
        <Button type="submit" disabled={formState.isSubmitting} className="mt-2 w-full">
          {formState.isSubmitting ? "Enviando…" : "Enviar link"}
        </Button>
      </form>
    </AuthCard>
  );
}
