import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { resetPasswordSchema, type ResetPasswordInput } from "@ecommerce/contracts/auth";
import { Button } from "@/shared/ui/Button";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/Input";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { AuthCard } from "./AuthCard";
import { resetPasswordFn } from "./authController";

const signInLink = (
  <Link to="/entrar" className="font-semibold text-primary underline underline-offset-2">
    Entrar
  </Link>
);

export function ResetPassword({ token }: { token: string }) {
  const reset = useServerFn(resetPasswordFn);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "" },
  });

  const submit = handleSubmit(async (input) => {
    setMessage(null);
    const result = await reset({ data: input });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setDone(true);
  });

  if (!token) {
    return (
      <AuthCard
        title="Link inválido"
        description="Abra o link que você recebeu por e-mail para redefinir a senha."
        footer={signInLink}
      >
        <Link to="/esqueci-senha" className={cn(textClass.meta, "text-primary underline")}>
          Pedir um novo link
        </Link>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard
        title="Senha redefinida"
        description="Sua nova senha já vale. Entre com ela para continuar."
        footer={signInLink}
      >
        <Button asChild className="w-full">
          <Link to="/entrar">Entrar</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Nova senha" description="Escolha uma senha com pelo menos 8 caracteres.">
      <form className="grid gap-4" onSubmit={(e) => void submit(e)} noValidate>
        <FormField label="Nova senha" error={formState.errors.password?.message}>
          <Input {...register("password")} type="password" autoComplete="new-password" />
        </FormField>
        {message && (
          <p role="alert" className={cn(textClass.meta, "text-destructive")}>
            {message}{" "}
            <Link to="/esqueci-senha" className="underline">
              Pedir um novo link
            </Link>
          </p>
        )}
        <Button type="submit" disabled={formState.isSubmitting} className="mt-2 w-full">
          {formState.isSubmitting ? "Salvando…" : "Salvar nova senha"}
        </Button>
      </form>
    </AuthCard>
  );
}
