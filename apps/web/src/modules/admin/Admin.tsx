import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  invitationStatusLabel,
  type AdminScreen,
  type AdminStore,
  type InvitationStatus,
} from "@ecommerce/contracts/admin";
import { userRoleLabel } from "@ecommerce/contracts/auth";
import {
  connectionRequestStatusLabel,
  connectionRequestStatuses,
  connectorOf,
} from "@ecommerce/contracts/connectors";
import { formatDate } from "@ecommerce/contracts/shared/format";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { DataTable } from "@/shared/ui/DataTable";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import {
  assignConsultantsFn,
  resendInvitationFn,
  resolveRequestFn,
  revokeInvitationFn,
} from "./adminController";
import { InviteForm } from "./InviteForm";

const invitationTone: Record<InvitationStatus, "accent" | "muted" | "warning"> = {
  PENDING: "muted",
  EXPIRED: "warning",
  ACCEPTED: "accent",
};

function useAdminAction() {
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

function StoreConsultants({
  store,
  consultants,
  onAssign,
}: {
  store: AdminStore;
  consultants: AdminScreen["consultants"];
  onAssign: (ids: string[]) => void;
}) {
  return (
    <MultiSelect
      label="Consultores"
      options={consultants.map((c) => ({ value: c.id, label: c.name }))}
      value={store.consultants.map((c) => c.id)}
      onChange={onAssign}
      className="w-56"
    />
  );
}

export function Admin({ data }: { data: AdminScreen }) {
  const isAdmin = data.role === "ADMIN";
  const assign = useServerFn(assignConsultantsFn);
  const revoke = useServerFn(revokeInvitationFn);
  const resend = useServerFn(resendInvitationFn);
  const resolve = useServerFn(resolveRequestFn);
  const { error, run } = useAdminAction();

  return (
    <div className={layout.page}>
      <PageHeader
        title="Administração"
        subtitle={
          isAdmin ? "Lojas, consultores, convites e conexões" : "Suas lojas, convites e conexões"
        }
      />
      <div className={cn(layout.headerGap, layout.blockStack)}>
        {error && (
          <p role="alert" className={cn(textClass.meta, "text-destructive")}>
            {error}
          </p>
        )}

        <SectionBlock title="Lojas" description="Cada loja é um cliente com seus próprios dados.">
          <DataTable
            columns={[
              { key: "name", header: "Loja", render: (r) => r.name, sortValue: (r) => r.name },
              {
                key: "consultants",
                header: "Consultores",
                render: (r) =>
                  isAdmin ? (
                    <StoreConsultants
                      store={r}
                      consultants={data.consultants}
                      onAssign={(ids) =>
                        void run(() => assign({ data: { id: r.id, consultantIds: ids } }))
                      }
                    />
                  ) : (
                    r.consultants.map((c) => c.name).join(", ") || "—"
                  ),
              },
              { key: "users", header: "Usuários", align: "right", render: (r) => String(r.users) },
              {
                key: "requests",
                header: "Conexões pedidas",
                align: "right",
                render: (r) => String(r.pendingRequests),
              },
              {
                key: "createdAt",
                header: "Desde",
                render: (r) =>
                  formatDate(r.createdAt, { day: "2-digit", month: "2-digit", year: "2-digit" }),
              },
            ]}
            rows={data.stores}
            rowKey={(r) => r.id}
            emptyMessage="Nenhuma loja ainda. Convide um cliente para criar a primeira."
          />
        </SectionBlock>

        <SectionBlock
          title="Convites"
          description="O convidado recebe por e-mail um link para criar a conta, válido por 7 dias."
          bodyClassName={layout.cardPadding}
        >
          <InviteForm stores={data.stores} canInviteConsultant={isAdmin} />
          <div className="mt-6">
            <DataTable
              columns={[
                { key: "email", header: "E-mail", render: (r) => r.email },
                { key: "role", header: "Papel", render: (r) => userRoleLabel[r.role] },
                { key: "store", header: "Loja", render: (r) => r.storeName ?? "cria a própria" },
                { key: "by", header: "Convidou", render: (r) => r.invitedBy },
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
                  render: (r) =>
                    r.status === "ACCEPTED" ? null : (
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
              rows={data.invitations}
              rowKey={(r) => r.id}
              emptyMessage="Nenhum convite ainda."
            />
          </div>
        </SectionBlock>

        <SectionBlock
          title="Solicitações de conexão"
          description="Conectores que os clientes pediram para ligar."
        >
          <DataTable
            columns={[
              { key: "store", header: "Loja", render: (r) => r.storeName },
              {
                key: "connector",
                header: "Conector",
                render: (r) => connectorOf(r.connectorKey).label,
              },
              { key: "by", header: "Pedido por", render: (r) => r.requestedBy },
              { key: "note", header: "Observação", render: (r) => r.note || "—" },
              {
                key: "status",
                header: "Status",
                render: (r) => (
                  <Select
                    value={r.status}
                    onValueChange={(status) =>
                      void run(() =>
                        resolve({
                          data: {
                            id: r.id,
                            status: status as (typeof connectionRequestStatuses)[number],
                            note: r.note,
                          },
                        }),
                      )
                    }
                  >
                    <SelectTrigger className="h-8 w-40" aria-label="Status da solicitação">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {connectionRequestStatuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {connectionRequestStatusLabel[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ),
              },
              {
                key: "createdAt",
                header: "Quando",
                render: (r) => formatDate(r.createdAt, { day: "2-digit", month: "2-digit" }),
              },
            ]}
            rows={data.requests}
            rowKey={(r) => r.id}
            emptyMessage="Nenhuma solicitação."
          />
        </SectionBlock>
      </div>
    </div>
  );
}
