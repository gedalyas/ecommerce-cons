import type { AdminUser, ConsultantSummary } from "./admin.types";

export type AdminUsersFilter = { query: string; consultantId: string };

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function matchesUserQuery(user: Pick<AdminUser, "name" | "email">, query: string): boolean {
  const needle = normalize(query);
  if (!needle) return true;
  return normalize(user.name).includes(needle) || normalize(user.email).includes(needle);
}

export function filterAdminUsers(users: AdminUser[], filter: AdminUsersFilter): AdminUser[] {
  return users.filter(
    (user) =>
      matchesUserQuery(user, filter.query) &&
      (!filter.consultantId || user.consultantIds.includes(filter.consultantId)),
  );
}

export type ConsultantGroup = { key: string; title: string; users: AdminUser[] };

export const UNASSIGNED_GROUP_TITLE = "Sem consultor";
export const STAFF_GROUP_TITLE = "Equipe";

export function groupUsersByConsultant(
  users: AdminUser[],
  consultants: ConsultantSummary[],
): ConsultantGroup[] {
  const clients = users.filter((user) => user.role === "CLIENT");
  const staff = users.filter((user) => user.role !== "CLIENT");
  const byConsultant = consultants
    .map((consultant) => ({
      key: consultant.id,
      title: `Consultor: ${consultant.name}`,
      users: clients.filter((user) => user.consultantIds.includes(consultant.id)),
    }))
    .filter((group) => group.users.length > 0);
  const unassigned = clients.filter((user) => user.consultantIds.length === 0);
  const groups = [...byConsultant];
  if (unassigned.length > 0) {
    groups.push({ key: "unassigned", title: UNASSIGNED_GROUP_TITLE, users: unassigned });
  }
  if (staff.length > 0) groups.push({ key: "staff", title: STAFF_GROUP_TITLE, users: staff });
  return groups;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}
