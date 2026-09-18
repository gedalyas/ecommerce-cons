import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { invitationStatusLabel, type InvitationStatus } from "@ecommerce/contracts/admin";
import { grantLabels } from "@ecommerce/contracts/auth";
import { seatLimitMessage, type TeamMember, type TeamScreen } from "@ecommerce/contracts/team";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { DataTable } from "@/shared/ui/DataTable";
import { Dialog } from "@/shared/ui/Dialog";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { TeamInviteForm } from "./TeamInviteForm";
import { TeamMemberDialog } from "./TeamMemberDialog";
import { removeMemberFn, resendTeamInvitationFn, revokeTeamInvitationFn } from "./teamController";

const invitationTone: Record<InvitationStatus, "accent" | "muted" | "warning"> = {
  PENDING: "muted",
  EXPIRED: "warning",
  ACCEPTED: "accent",
};

function useTeamAction() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const run = async (action: () => Promise<{ ok: boolean; message?: string }>) => {
    setError(null);
    const result = await action();
    if (!result.ok) {
      setError(result.message ?? "Não foi possível concluir.");
      return;
    }
    await router.invalidate();
  };
  return { error, run };
}

export function Team({ team }: { team: TeamScreen }) {
  const resend = useServerFn(resendTeamInvitationFn);
  const revoke = useServerFn(revokeTeamInvitationFn);
  const remove = useServerFn(removeMemberFn);
  const { error, run } = useTeamAction();
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const { seats } = team;

  return (
    <SectionBlock
      title="Equipe"
      description="Pessoas da sua operação que entram na loja com acesso limitado às áreas que você liberar."
      bodyClassName={cn(layout.cardPadding, layout.groupStack)}
    >
      <p className={cn(textClass.meta, textClass.numeric, "text-muted-foreground")}>
        {seats.used} de {seats.limit} assentos usados, contando convites pendentes.
      </p>
      {error && (
        <p role="alert" className={cn(textClass.meta, "text-destructive")}>
          {error}
        </p>
      )}

      <DataTable
        columns={[
          { key: "name", header: "Nome", render: (r) => r.name },
          { key: "email", header: "E-mail", render: (r) => r.email },
          { key: "grants", header: "Acesso", render: (r) => grantLabels(r.grants).join(", ") },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (r) => (
              <span className="inline-flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setRemoving(r)}>
                  Remover
                </Button>
              </span>
            ),
          },
        ]}
        rows={team.members}
        rowKey={(r) => r.id}
        emptyMessage="Ninguém na equipe ainda."
      />

      <DataTable
        columns={[
          { key: "email", header: "Convite", render: (r) => r.email },
          { key: "grants", header: "Acesso", render: (r) => grantLabels(r.grants).join(", ") },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <Badge tone={invitationTone[r.status]}>{invitationStatusLabel[r.status]}</Badge>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (r) => (
              <span className="inline-flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void run(() => resend({ data: { id: r.id } }))}
                >
                  Reenviar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void run(() => revoke({ data: { id: r.id } }))}
                >
                  Revogar
                </Button>
              </span>
            ),
          },
        ]}
        rows={team.invitations}
        rowKey={(r) => r.id}
        emptyMessage="Nenhum convite pendente."
      />

      {seats.hasFree ? (
        <TeamInviteForm seats={seats} />
      ) : (
        <p role="status" className={cn(textClass.meta, "text-muted-foreground")}>
          {seatLimitMessage(seats.limit)}
        </p>
      )}

      <TeamMemberDialog member={editing} onClose={() => setEditing(null)} />
      <Dialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title={removing ? `Remover ${removing.name} da equipe?` : ""}
        description="A pessoa perde o acesso à loja na hora. O que ela fez continua no histórico."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRemoving(null)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              const member = removing;
              setRemoving(null);
              if (member) void run(() => remove({ data: { id: member.id } }));
            }}
          >
            Remover
          </Button>
        </div>
      </Dialog>
    </SectionBlock>
  );
}
