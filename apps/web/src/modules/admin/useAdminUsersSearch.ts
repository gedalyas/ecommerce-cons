import { useNavigate } from "@tanstack/react-router";
import type { AdminUsersSearch } from "@ecommerce/contracts/admin";

export function useAdminUsersSearch() {
  const navigate = useNavigate();
  return (next: Partial<AdminUsersSearch>) =>
    void navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => ({ ...prev, ...next }),
      replace: true,
    });
}
