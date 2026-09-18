import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { grantsSchema, type TeamMember } from "@ecommerce/contracts/team";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { GrantsPicker } from "./GrantsPicker";
import { grantsOfPicker, pickerOfGrants } from "./grantPicker";
import { updateMemberFn } from "./teamController";

export function TeamMemberDialog({
  member,
  onClose,
}: {
  member: TeamMember | null;
  onClose: () => void;
}) {
  const update = useServerFn(updateMemberFn);
  const router = useRouter();
  const [picker, setPicker] = useState(() => pickerOfGrants(member?.grants ?? []));
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPicker(pickerOfGrants(member?.grants ?? []));
    setMessage(null);
  }, [member]);

  const save = async () => {
    if (!member) return;
    const parsed = grantsSchema.safeParse(grantsOfPicker(picker));
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Libere pelo menos uma área");
      return;
    }
    setBusy(true);
    try {
      const result = await update({ data: { id: member.id, grants: parsed.data } });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      await router.invalidate();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={member !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={member ? `Acesso de ${member.name}` : ""}
      description="O que esta pessoa vê e edita na loja."
    >
      <GrantsPicker value={picker} onChange={setPicker} />
      {message && (
        <p role="alert" className={cn(textClass.meta, "mt-3 text-destructive")}>
          {message}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
        <Button onClick={() => void save()} disabled={busy}>
          {busy ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </Dialog>
  );
}
