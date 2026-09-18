import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { emailSchema } from "@ecommerce/contracts/auth";
import { grantsSchema, type TeamSeats } from "@ecommerce/contracts/team";
import { Button } from "@/shared/ui/Button";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/Input";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { GrantsPicker } from "./GrantsPicker";
import { grantsOfPicker, pickerOfGrants } from "./grantPicker";
import { inviteMemberFn } from "./teamController";

export function TeamInviteForm({ seats }: { seats: TeamSeats }) {
  const invite = useServerFn(inviteMemberFn);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [picker, setPicker] = useState(() => pickerOfGrants([]));
  const [errors, setErrors] = useState<{ email: string | null; grants: string | null }>({
    email: null,
    grants: null,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setMessage(null);
    setSent(false);
    const parsedEmail = emailSchema.safeParse(email);
    const parsedGrants = grantsSchema.safeParse(grantsOfPicker(picker));
    if (!parsedEmail.success || !parsedGrants.success) {
      setErrors({
        email: parsedEmail.success ? null : (parsedEmail.error.issues[0]?.message ?? null),
        grants: parsedGrants.success ? null : (parsedGrants.error.issues[0]?.message ?? null),
      });
      return;
    }
    setErrors({ email: null, grants: null });
    setBusy(true);
    try {
      const result = await invite({
        data: { email: parsedEmail.data, grants: parsedGrants.data },
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setEmail("");
      setPicker(pickerOfGrants([]));
      setMessage(`Convite enviado para ${result.data.email}.`);
      setSent(true);
      await router.invalidate();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      noValidate
    >
      <FormField label="E-mail" error={errors.email ?? undefined}>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="pessoa@loja.com.br"
          disabled={!seats.hasFree}
        />
      </FormField>
      <FormField label="Acesso por área" error={errors.grants ?? undefined}>
        <GrantsPicker value={picker} onChange={setPicker} />
      </FormField>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy || !seats.hasFree}>
          {busy ? "Enviando…" : "Convidar"}
        </Button>
        {message && (
          <p
            role={sent ? "status" : "alert"}
            className={cn(textClass.meta, sent ? "text-muted-foreground" : "text-destructive")}
          >
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
