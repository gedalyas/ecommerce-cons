import { Search } from "lucide-react";
import {
  filterAdminUsers,
  type AdminUser,
  type AdminUsersScreen,
  type AdminUsersSearch,
} from "@ecommerce/contracts/admin";
import { clientMembershipLabel, userRoleLabel, type UserRole } from "@ecommerce/contracts/auth";
import { formatDate } from "@ecommerce/contracts/shared/format";
import { Badge } from "@/shared/ui/Badge";
import { DataTable } from "@/shared/ui/DataTable";
import { Input } from "@/shared/ui/Input";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { layout } from "@/shared/styles/spacing";
import { cn } from "@/shared/utils/cn";
import { useAdminUsersSearch } from "./useAdminUsersSearch";

const ALL_CONSULTANTS = "__all";

const roleTone: Record<UserRole, "accent" | "muted" | "outline"> = {
  ADMIN: "outline",
  CONSULTANT: "muted",
  CLIENT: "accent",
};

function consultantNames(user: AdminUser, consultants: AdminUsersScreen["consultants"]) {
  const names = consultants.filter((c) => user.consultantIds.includes(c.id)).map((c) => c.name);
  return names.length > 0 ? names.join(", ") : "—";
}

export function AdminUsersFilters({
  search,
  consultants,
}: {
  search: AdminUsersSearch;
  consultants: AdminUsersScreen["consultants"];
}) {
  const patch = useAdminUsersSearch();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={search.busca}
          onChange={(e) => patch({ busca: e.target.value })}
          placeholder="Buscar por nome ou e-mail"
          aria-label="Buscar usuário"
          className="pl-9"
        />
      </div>
      <Select
        value={search.consultor || ALL_CONSULTANTS}
        onValueChange={(value) => patch({ consultor: value === ALL_CONSULTANTS ? "" : value })}
      >
        <SelectTrigger className="w-56" aria-label="Filtrar por consultor">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_CONSULTANTS}>Todos os consultores</SelectItem>
          {consultants.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AdminUsers({ data, search }: { data: AdminUsersScreen; search: AdminUsersSearch }) {
  const rows = filterAdminUsers(data.users, {
    query: search.busca,
    consultantId: search.consultor,
  });
  return (
    <div className={layout.page}>
      <PageHeader title="Usuários" subtitle={`${data.users.length} contas em todas as lojas`} />
      <div className={cn(layout.headerGap, layout.blockStack)}>
        <AdminUsersFilters search={search} consultants={data.consultants} />
        <DataTable
          columns={[
            { key: "name", header: "Nome", render: (r) => r.name, sortValue: (r) => r.name },
            { key: "email", header: "E-mail", render: (r) => r.email, sortValue: (r) => r.email },
            {
              key: "role",
              header: "Tipo",
              render: (r) => (
                <span className="inline-flex items-center gap-1">
                  <Badge tone={roleTone[r.role]}>{userRoleLabel[r.role]}</Badge>
                  {r.membership === "MEMBER" && (
                    <Badge tone="outline">{clientMembershipLabel[r.membership]}</Badge>
                  )}
                </span>
              ),
              sortValue: (r) => r.role,
            },
            {
              key: "store",
              header: "Loja",
              render: (r) => r.storeName ?? "—",
              sortValue: (r) => r.storeName ?? "",
            },
            {
              key: "consultant",
              header: "Consultor",
              render: (r) => consultantNames(r, data.consultants),
            },
            {
              key: "createdAt",
              header: "Criado em",
              render: (r) =>
                formatDate(r.createdAt, { day: "2-digit", month: "2-digit", year: "numeric" }),
              sortValue: (r) => r.createdAt,
            },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          initialSort={{ key: "name", direction: "asc" }}
          emptyMessage={
            data.users.length === 0 ? "Nenhum usuário ainda." : "Nenhum usuário com esse filtro."
          }
        />
      </div>
    </div>
  );
}
