import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  filterAdminUsers,
  groupUsersByConsultant,
  initialsOf,
  type AdminUser,
  type AdminUsersScreen,
  type AdminUsersSearch,
} from "@ecommerce/contracts/admin";
import { userRoleLabel } from "@ecommerce/contracts/auth";
import { PageHeader } from "@/shared/ui/PageHeader";
import { radiusClass } from "@/shared/styles/radius";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { impersonateFn } from "./adminController";
import { AdminUsersFilters } from "./AdminUsers";

const captionOf = (user: AdminUser) =>
  user.role === "CLIENT" ? (user.storeName ?? userRoleLabel[user.role]) : userRoleLabel[user.role];

function UserCard({
  user,
  isBusy,
  onOpen,
}: {
  user: AdminUser;
  isBusy: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={isBusy}
      aria-label={`Acessar como ${user.name}`}
      className={cn(
        "group flex w-full flex-col items-center gap-2 p-2 text-center transition-colors duration-150",
        radiusClass.card,
        "hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-20 w-20 items-center justify-center bg-primary text-primary-foreground",
          radiusClass.card,
          textClass.sectionTitle,
          "transition-transform duration-150 group-hover:scale-105",
        )}
      >
        {initialsOf(user.name) || "?"}
      </span>
      <span className="line-clamp-2 text-[13px] font-semibold text-foreground">{user.name}</span>
      <span className={cn(textClass.label, "text-muted-foreground")}>{captionOf(user)}</span>
    </button>
  );
}

export function AdminAccess({
  data,
  search,
  currentUserId,
}: {
  data: AdminUsersScreen;
  search: AdminUsersSearch;
  currentUserId: string;
}) {
  const router = useRouter();
  const impersonate = useServerFn(impersonateFn);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const others = data.users.filter((u) => u.id !== currentUserId);
  const visible = filterAdminUsers(others, { query: search.busca, consultantId: search.consultor });
  const groups = groupUsersByConsultant(visible, data.consultants);

  const open = async (user: AdminUser) => {
    setError(null);
    setBusyId(user.id);
    const result = await impersonate({ data: { userId: user.id } });
    if (!result.ok) {
      setError(result.message);
      setBusyId(null);
      await router.invalidate();
      return;
    }
    window.location.assign("/");
  };

  return (
    <div className={layout.page}>
      <PageHeader
        title="Acesso a usuários"
        subtitle="Abra o sistema exatamente como a pessoa o vê. O acesso fica registrado na atividade."
      />
      <div className={cn(layout.headerGap, layout.blockStack)}>
        <AdminUsersFilters search={search} consultants={data.consultants} />
        {error && (
          <p role="alert" className={cn(textClass.meta, "text-destructive")}>
            {error}
          </p>
        )}
        {groups.length === 0 && (
          <p className={cn(textClass.body, "text-muted-foreground")}>
            {others.length === 0
              ? "Nenhum outro usuário ainda."
              : "Nenhum usuário com esse filtro."}
          </p>
        )}
        {groups.map((group) => (
          <section key={group.key} className={layout.groupStack}>
            <h2 className={cn(textClass.cardTitle, "border-b border-border pb-2 text-foreground")}>
              {group.title}
            </h2>
            <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {group.users.map((user) => (
                <li key={user.id}>
                  <UserCard
                    user={user}
                    isBusy={busyId === user.id}
                    onOpen={() => void open(user)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
